class KryptonPcmRingProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const capacitySeconds = Math.max(1, Math.min(8, options.processorOptions?.capacitySeconds || 4));
    this.capacity = Math.max(1024, Math.round(sampleRate * capacitySeconds));
    this.sourceSampleRate = Number(options.processorOptions?.sourceSampleRate) || 24000;
    this.samples = new Float32Array(this.capacity);
    this.readIndex = 0;
    this.writeIndex = 0;
    this.available = 0;
    this.token = 0;
    this.playing = false;
    this.draining = false;
    this.drainSent = false;
    this.prebufferFrames = Math.round(sampleRate * 0.12);
    this.maxPrebufferFrames = Math.round(sampleRate * 0.4);
    this.statusCountdown = 0;
    this.underruns = 0;

    this.port.onmessage = (event) => {
      const message = event.data || {};
      if (message.type === 'reset') {
        this.reset(
          Number(message.token) || 0,
          Number(message.sourceSampleRate) || this.sourceSampleRate
        );
        return;
      }
      if (message.type === 'pcm') {
        if ((Number(message.token) || 0) !== this.token || !(message.buffer instanceof ArrayBuffer)) return;
        this.push(new Int16Array(message.buffer));
        return;
      }
      if (message.type === 'end' && (Number(message.token) || 0) === this.token) {
        this.draining = true;
        this.maybeDrain();
        return;
      }
      if (message.type === 'cancel') this.reset(0);
    };
  }

  reset(token, sourceSampleRate = 24000) {
    this.readIndex = 0;
    this.sourceSampleRate = Math.max(8000, Math.min(96000, sourceSampleRate));
    this.writeIndex = 0;
    this.available = 0;
    this.token = token;
    this.playing = false;
    this.draining = false;
    this.drainSent = false;
    this.statusCountdown = 0;
    this.underruns = 0;
    this.prebufferFrames = Math.round(sampleRate * 0.12);
    this.port.postMessage({ type: 'buffer', token: this.token, bufferedMs: 0, underruns: 0 });
  }

  push(input) {
    const outputLength = this.sourceSampleRate === sampleRate
      ? input.length
      : Math.max(1, Math.round(input.length * sampleRate / this.sourceSampleRate));
    const free = this.capacity - this.available;
    if (outputLength > free) {
      this.port.postMessage({
        type: 'overflow',
        token: this.token,
        bufferedMs: (this.available / sampleRate) * 1000,
      });
      return;
    }

    for (let index = 0; index < outputLength; index += 1) {
      let value;
      if (outputLength === input.length || input.length === 1) {
        value = input[Math.min(index, input.length - 1)];
      } else {
        const position = index * (input.length - 1) / Math.max(1, outputLength - 1);
        const left = Math.floor(position);
        const right = Math.min(input.length - 1, left + 1);
        const mix = position - left;
        value = input[left] * (1 - mix) + input[right] * mix;
      }
      this.samples[this.writeIndex] = value / 32768;
      this.writeIndex = (this.writeIndex + 1) % this.capacity;
    }
    this.available += outputLength;
  }

  maybeDrain() {
    if (!this.draining || this.available > 0 || this.drainSent) return;
    this.playing = false;
    this.drainSent = true;
    this.port.postMessage({ type: 'drained', token: this.token, underruns: this.underruns });
  }

  process(_inputs, outputs) {
    const output = outputs[0]?.[0];
    if (!output) return true;
    output.fill(0);

    if (!this.playing && (
      this.available >= this.prebufferFrames ||
      (this.draining && this.available > 0)
    )) {
      this.playing = true;
      this.port.postMessage({ type: 'started', token: this.token });
    }

    if (this.playing) {
      const readable = Math.min(output.length, this.available);
      for (let index = 0; index < readable; index += 1) {
        output[index] = this.samples[this.readIndex];
        this.readIndex = (this.readIndex + 1) % this.capacity;
      }
      this.available -= readable;

      if (readable < output.length && !this.draining) {
        this.playing = false;
        this.underruns += 1;
        this.prebufferFrames = Math.min(
          this.maxPrebufferFrames,
          this.prebufferFrames + Math.round(sampleRate * 0.04)
        );
        this.port.postMessage({
          type: 'underrun',
          token: this.token,
          underruns: this.underruns,
          nextPrebufferMs: (this.prebufferFrames / sampleRate) * 1000,
        });
      }
    }

    this.maybeDrain();
    this.statusCountdown -= output.length;
    if (this.statusCountdown <= 0) {
      this.statusCountdown = Math.round(sampleRate / 10);
      this.port.postMessage({
        type: 'buffer',
        token: this.token,
        bufferedMs: (this.available / sampleRate) * 1000,
        underruns: this.underruns,
      });
    }
    return true;
  }
}

registerProcessor('krypton-pcm-ring', KryptonPcmRingProcessor);
