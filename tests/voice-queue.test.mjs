import assert from 'node:assert/strict';
import test from 'node:test';
import { createNaturalSpeech } from '../src/core/voice.js';

class FakeAudio {
  static instance = null;
  constructor() {
    FakeAudio.instance = this;
    this.playCount = 0;
    this.src = '';
    this.muted = false;
  }
  setAttribute() {}
  removeAttribute() { this.src = ''; }
  load() {}
  pause() {}
  play() {
    this.playCount += 1;
    this.onplaying?.();
    return Promise.resolve();
  }
}

const tick = () => new Promise((resolve) => setImmediate(resolve));

test('prefetches later sentence clips before the current clip ends', async () => {
  const originalAudio = globalThis.Audio;
  const originalFetch = globalThis.fetch;
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  const fetched = [];
  const revoked = [];
  let objectId = 0;
  globalThis.Audio = FakeAudio;
  globalThis.fetch = async (url) => {
    fetched.push(String(url));
    return { ok: true, blob: async () => new Blob([String(url)]) };
  };
  URL.createObjectURL = () => `blob:clip-${++objectId}`;
  URL.revokeObjectURL = (url) => revoked.push(url);

  try {
    let starts = 0;
    let ends = 0;
    const speech = createNaturalSpeech(() => 'id', 'https://example.test');
    speech.beginStream({ onstart: () => { starts += 1; }, onend: () => { ends += 1; } });
    speech.feed('Kalimat pertama.');
    speech.feed('Kalimat kedua.');
    speech.endStream();
    await tick();
    await tick();

    const audio = FakeAudio.instance;
    assert.equal(fetched.length, 2, 'both TTS requests should start immediately');
    assert.equal(audio.playCount, 1);
    assert.equal(starts, 1);

    audio.onended();
    await tick();
    assert.equal(audio.playCount, 2, 'second prefetched clip should play at the first clip boundary');
    audio.onended();
    await tick();
    assert.equal(ends, 1);
    assert.equal(revoked.length, 2);
  } finally {
    globalThis.Audio = originalAudio;
    globalThis.fetch = originalFetch;
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  }
});

test('cancel aborts every pending prefetched TTS request', async () => {
  const originalAudio = globalThis.Audio;
  const originalFetch = globalThis.fetch;
  const signals = [];
  globalThis.Audio = FakeAudio;
  globalThis.fetch = (_url, options) => {
    signals.push(options.signal);
    return new Promise(() => {});
  };

  try {
    const speech = createNaturalSpeech(() => 'id', 'https://example.test');
    speech.beginStream();
    speech.feed('Satu.');
    speech.feed('Dua.');
    await tick();
    speech.cancel();
    assert.equal(signals.length, 2);
    assert.ok(signals.every((signal) => signal.aborted));
    assert.equal(speech.isSpeaking(), false);
  } finally {
    globalThis.Audio = originalAudio;
    globalThis.fetch = originalFetch;
  }
});

test('limits neural TTS prefetch to two concurrent requests', async () => {
  const originalAudio = globalThis.Audio;
  const originalFetch = globalThis.fetch;
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  const calls = [];
  const resolvers = [];
  globalThis.Audio = FakeAudio;
  globalThis.fetch = (url, options) => {
    calls.push({ url: String(url), signal: options.signal });
    return new Promise((resolve) => {
      resolvers.push(() => resolve({ ok: true, blob: async () => new Blob([String(url)]) }));
    });
  };
  URL.createObjectURL = () => 'blob:ready';
  URL.revokeObjectURL = () => {};

  try {
    const speech = createNaturalSpeech(() => 'id', 'https://example.test');
    speech.beginStream();
    speech.feed('Satu.');
    speech.feed('Dua.');
    speech.feed('Tiga.');
    await tick();
    assert.equal(calls.length, 2);

    resolvers[0]();
    await tick();
    await tick();
    assert.equal(calls.length, 3, 'the third request starts only after a slot is free');
    speech.cancel();
  } finally {
    globalThis.Audio = originalAudio;
    globalThis.fetch = originalFetch;
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  }
});
