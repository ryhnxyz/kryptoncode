import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRealtimeSpeech } from '../src/core/realtimeVoice.js';

const tick = () => new Promise((resolve) => setImmediate(resolve));

class FakePort {
  constructor() { this.messages = []; this.onmessage = null; }
  postMessage(message) { this.messages.push(message); }
  emit(message) { this.onmessage?.({ data: message }); }
}

class FakeAudioWorkletNode {
  static instance = null;
  constructor() {
    FakeAudioWorkletNode.instance = this;
    this.port = new FakePort();
  }
  connect() {}
  disconnect() {}
}

class FakeAudioContext {
  constructor(options) {
    this.options = options;
    this.state = 'running';
    this.destination = {};
    this.audioWorklet = { addModule: async (url) => { this.moduleUrl = url; } };
  }
  async resume() { this.state = 'running'; }
  async close() { this.state = 'closed'; }
}

class FakeWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances = [];
  constructor(url) {
    this.url = url;
    this.readyState = FakeWebSocket.CONNECTING;
    this.sent = [];
    FakeWebSocket.instances.push(this);
    setImmediate(() => {
      this.readyState = FakeWebSocket.OPEN;
      this.onopen?.();
    });
  }
  send(raw) {
    const message = JSON.parse(raw);
    this.sent.push(message);
    if (message.type === 'hello') {
      setImmediate(() => this.emitControl({
        type: 'ready',
        version: 1,
        format: 'pcm_s16le',
        sampleRate: 24000,
        channels: 1,
        frameMs: 20,
      }));
    }
  }
  close() {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.();
  }
  emitControl(message) { this.onmessage?.({ data: JSON.stringify(message) }); }
  emitBinary(buffer) { this.onmessage?.({ data: buffer }); }
}

function pcmPacket(token, sequence, samples = 480) {
  const buffer = new ArrayBuffer(12 + samples * 2);
  const view = new DataView(buffer);
  view.setUint8(0, 1);
  view.setUint8(1, 1);
  view.setUint16(2, token, false);
  view.setUint32(4, sequence, false);
  view.setUint32(8, samples * 2, false);
  const pcm = new Int16Array(buffer, 12);
  pcm.fill(1000);
  return buffer;
}

function installBrowserMocks() {
  const previous = {
    window: globalThis.window,
    WebSocket: globalThis.WebSocket,
  };
  FakeWebSocket.instances = [];
  FakeAudioWorkletNode.instance = null;
  globalThis.WebSocket = FakeWebSocket;
  globalThis.window = {
    AudioContext: FakeAudioContext,
    AudioWorkletNode: FakeAudioWorkletNode,
    WebSocket: FakeWebSocket,
  };
  return () => {
    globalThis.window = previous.window;
    globalThis.WebSocket = previous.WebSocket;
  };
}

test('uses only websocket PCM for an ordered speech session', async () => {
  const restore = installBrowserMocks();
  try {
    let starts = 0;
    let ends = 0;
    let errors = 0;
    const speech = createRealtimeSpeech(() => 'id', 'https://api.example.test');
    speech.beginStream({
      onstart: () => { starts += 1; },
      onend: () => { ends += 1; },
      onerror: () => { errors += 1; },
    });
    speech.feed('Kalimat pertama.');
    speech.feed('Kalimat kedua.');
    speech.endStream();
    for (let index = 0; index < 6; index += 1) await tick();

    const socket = FakeWebSocket.instances[0];
    assert.equal(socket.url, 'wss://api.example.test/api/core/voice-stream');
    assert.deepEqual(socket.sent.map((message) => message.type), [
      'hello', 'start', 'segment', 'segment', 'end',
    ]);
    assert.deepEqual(
      socket.sent.filter((message) => message.type === 'segment').map((message) => message.seq),
      [0, 1]
    );

    const start = socket.sent.find((message) => message.type === 'start');
    const worklet = FakeAudioWorkletNode.instance;
    worklet.port.emit({ type: 'buffer', token: start.token, bufferedMs: 1600, underruns: 0 });
    worklet.port.emit({ type: 'buffer', token: start.token, bufferedMs: 600, underruns: 0 });
    assert.deepEqual(
      socket.sent.filter((message) => message.type === 'flow').map((message) => message.paused),
      [true, false]
    );
    socket.emitBinary(pcmPacket(start.token, 0));
    assert.equal(worklet.port.messages.at(-1).type, 'pcm');
    worklet.port.emit({ type: 'started', token: start.token });
    assert.equal(starts, 1);

    socket.emitControl({
      type: 'session_done',
      sessionId: start.sessionId,
      token: start.token,
      frames: 1,
    });
    assert.equal(worklet.port.messages.at(-1).type, 'end');
    worklet.port.emit({ type: 'drained', token: start.token, underruns: 0 });
    assert.equal(ends, 1);
    assert.equal(errors, 0);
    speech.destroy();
  } finally {
    restore();
  }
});

test('cancel invalidates PCM immediately and sends a server cancel', async () => {
  const restore = installBrowserMocks();
  try {
    const speech = createRealtimeSpeech(() => 'id', 'https://api.example.test');
    speech.beginStream();
    speech.feed('Batalkan ini.');
    for (let index = 0; index < 5; index += 1) await tick();
    const socket = FakeWebSocket.instances[0];
    const start = socket.sent.find((message) => message.type === 'start');

    speech.cancel();
    assert.equal(socket.sent.at(-1).type, 'cancel');
    assert.equal(socket.sent.at(-1).sessionId, start.sessionId);
    assert.equal(FakeAudioWorkletNode.instance.port.messages.at(-1).type, 'cancel');
    assert.equal(speech.isSpeaking(), false);
    speech.destroy();
  } finally {
    restore();
  }
});

test('rejects stale and out-of-order binary frames', async () => {
  const restore = installBrowserMocks();
  try {
    let error = '';
    const speech = createRealtimeSpeech(() => 'id', 'https://api.example.test');
    speech.beginStream({ onerror: (reason) => { error = String(reason); } });
    speech.feed('Uji urutan.');
    for (let index = 0; index < 5; index += 1) await tick();
    const socket = FakeWebSocket.instances[0];
    const start = socket.sent.find((message) => message.type === 'start');

    socket.emitBinary(pcmPacket((start.token + 1) & 0xffff, 0));
    assert.equal(FakeAudioWorkletNode.instance.port.messages.filter((message) => message.type === 'pcm').length, 0);
    socket.emitBinary(pcmPacket(start.token, 1));
    assert.match(error, /sequence/i);
    assert.equal(speech.isSpeaking(), false);
    speech.destroy();
  } finally {
    restore();
  }
});

test('Krypton Core browser source contains no MP3 playback path', () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const core = path.join(here, '..', 'src', 'core');
  const source = ['voice.js', 'realtimeVoice.js', 'liveApi.js', 'KryptonCore.jsx']
    .map((name) => fs.readFileSync(path.join(core, name), 'utf8'))
    .join('\n');
  assert.doesNotMatch(source, /\/api\/core\/voice\?/);
  assert.doesNotMatch(source, /audio\/mpeg/);
  assert.doesNotMatch(source, /MediaSource/);
  assert.doesNotMatch(source, /response\.blob\(/);
});

test('AudioWorklet buffers PCM, starts after prebuffer, and drains', () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const source = fs.readFileSync(path.join(here, '..', 'public', 'krypton-pcm-worklet.js'), 'utf8');
  let Processor = null;
  class MockAudioWorkletProcessor {
    constructor() { this.port = new FakePort(); }
  }
  vm.runInNewContext(source, {
    AudioWorkletProcessor: MockAudioWorkletProcessor,
    registerProcessor: (_name, constructor) => { Processor = constructor; },
    sampleRate: 48000,
    Float32Array,
    Int16Array,
    ArrayBuffer,
    Math,
  });

  const processor = new Processor({ processorOptions: { capacitySeconds: 1 } });
  processor.port.onmessage({ data: { type: 'reset', token: 77 } });
  const pcm = new Int16Array(3840);
  pcm.fill(16384);
  processor.port.onmessage({ data: { type: 'pcm', token: 77, buffer: pcm.buffer } });
  assert.equal(processor.available, 7680, '24 kHz PCM should resample to a 48 kHz output context');

  const output = [[new Float32Array(128)]];
  processor.process([], output);
  assert.ok(processor.port.messages.some((message) => message.type === 'started' && message.token === 77));
  assert.ok(output[0][0][0] > 0.49 && output[0][0][0] < 0.51);

  processor.port.onmessage({ data: { type: 'end', token: 77 } });
  for (let index = 0; index < 70; index += 1) processor.process([], output);
  assert.ok(processor.port.messages.some((message) => message.type === 'drained' && message.token === 77));
});
