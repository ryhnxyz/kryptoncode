import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyNearFieldVoice } from '../src/core/voice.js';

test('rejects quiet room noise even when its spectrum overlaps speech', () => {
  const result = classifyNearFieldVoice({ rms: 0.006, peak: 0.02, noiseFloor: 0.006, voiceRatio: 0.55 });
  assert.equal(result.near, false);
});

test('rejects a distant voice with vocal frequency content but low pressure', () => {
  const result = classifyNearFieldVoice({ rms: 0.014, peak: 0.045, noiseFloor: 0.004, voiceRatio: 0.72 });
  assert.equal(result.near, false);
});

test('accepts a close near-field voice', () => {
  const result = classifyNearFieldVoice({ rms: 0.035, peak: 0.12, noiseFloor: 0.006, voiceRatio: 0.65 });
  assert.equal(result.near, true);
  assert.ok(result.snr > 5);
});

test('rejects transient non-vocal noise despite a high peak', () => {
  const result = classifyNearFieldVoice({ rms: 0.03, peak: 0.13, noiseFloor: 0.006, voiceRatio: 0.18 });
  assert.equal(result.near, false);
});

test('adapts to a noisy room and still requires a close voice', () => {
  const close = classifyNearFieldVoice({ rms: 0.05, peak: 0.15, noiseFloor: 0.012, voiceRatio: 0.6 });
  const distant = classifyNearFieldVoice({ rms: 0.03, peak: 0.1, noiseFloor: 0.012, voiceRatio: 0.6 });
  assert.equal(close.near, true);
  assert.equal(distant.near, false);
});
