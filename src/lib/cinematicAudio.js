export function createCinematicAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  const context = new AudioContext();
  const master = context.createGain();
  const bed = context.createGain();
  const filter = context.createBiquadFilter();
  const sources = [];
  let stopped = false;

  master.gain.value = 0.0001;
  bed.gain.value = 0.72;
  filter.type = 'lowpass';
  filter.frequency.value = 520;
  bed.connect(filter).connect(master).connect(context.destination);

  [[43.65, 'sine', 0.11], [65.41, 'sine', 0.045], [130.81, 'triangle', 0.012]].forEach(([frequency, type, volume]) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.value = volume;
    oscillator.connect(gain).connect(bed);
    oscillator.start();
    sources.push(oscillator);
  });

  const noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);

  const whoosh = (scene) => {
    if (stopped) return;
    const now = context.currentTime;
    const source = context.createBufferSource();
    const cueFilter = context.createBiquadFilter();
    const gain = context.createGain();
    const pan = context.createStereoPanner?.();
    source.buffer = noiseBuffer;
    cueFilter.type = 'bandpass';
    cueFilter.Q.value = scene === 2 ? 0.7 : 1.2;
    cueFilter.frequency.setValueAtTime(scene === 1 ? 1300 : 600, now);
    cueFilter.frequency.exponentialRampToValueAtTime(scene === 2 ? 180 : 2600, now + 1.15);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(scene === 2 ? 0.13 : 0.085, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);
    if (pan) {
      pan.pan.setValueAtTime(scene === 0 ? -0.75 : scene === 1 ? 0.75 : 0, now);
      pan.pan.linearRampToValueAtTime(scene === 0 ? 0.75 : scene === 1 ? -0.75 : 0, now + 1.1);
      source.connect(cueFilter).connect(gain).connect(pan).connect(master);
    } else source.connect(cueFilter).connect(gain).connect(master);
    source.start(now);
  };

  const tone = (frequency, duration = 1.8, volume = 0.035) => {
    if (stopped) return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.5, now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.05);
  };

  return {
    async start() {
      if (context.state === 'suspended') await context.resume();
      const now = context.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.exponentialRampToValueAtTime(0.24, now + 1.5);
      tone(98, 2.2, 0.028);
      whoosh(0);
    },
    cue(scene = 0) {
      whoosh(scene);
      tone([146.83, 196, 261.63][scene] || 146.83, scene === 2 ? 2.5 : 1.7, 0.03);
    },
    resolve() {
      if (stopped) return;
      tone(130.81, 2.7, 0.045);
      filter.frequency.exponentialRampToValueAtTime(180, context.currentTime + 1.2);
    },
    setMuted(muted) {
      if (stopped) return;
      const now = context.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.exponentialRampToValueAtTime(muted ? 0.0001 : 0.24, now + 0.3);
    },
    stop() {
      if (stopped) return;
      stopped = true;
      const now = context.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      window.setTimeout(() => {
        sources.forEach((source) => { try { source.stop(); } catch { /* already stopped */ } });
        context.close().catch(() => {});
      }, 450);
    },
  };
}
