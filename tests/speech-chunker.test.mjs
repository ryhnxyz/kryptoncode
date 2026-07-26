import assert from 'node:assert/strict';
import test from 'node:test';
import { createSpeechChunker } from '../src/core/speechChunker.js';

function stream(chunker, parts) {
  return parts.flatMap((part) => chunker.push(part));
}

test('emits a complete short sentence as soon as punctuation arrives', () => {
  const chunker = createSpeechChunker();
  const chunks = stream(chunker, ['API adalah ', 'jembatan antar ', 'aplikasi. Lalu data mengalir']);
  assert.deepEqual(chunks, ['API adalah jembatan antar aplikasi.']);
  assert.equal(chunker.pendingText.trim(), 'Lalu data mengalir');
});

test('emits an early useful chunk when punctuation is delayed', () => {
  const chunker = createSpeechChunker();
  const chunks = stream(chunker, [
    'Database menyimpan ',
    'dan mengelola data ',
    'aplikasi secara terpusat sehingga akses tetap cepat',
  ]);
  assert.equal(chunks.length, 1);
  assert.match(chunks[0], /^Database menyimpan dan mengelola data/);
  assert.ok(chunks[0].split(/\s+/).length <= 9);
  assert.ok(chunker.pendingText.trim().length > 0);
});

test('prefers a natural clause boundary over a forced word cut', () => {
  const chunker = createSpeechChunker();
  const chunks = stream(chunker, ['Gunakan kata sandi unik dan kuat, lalu aktifkan verifikasi dua langkah']);
  assert.deepEqual(chunks, ['Gunakan kata sandi unik dan kuat,']);
});

test('does not split abbreviations, decimals, domains, or email addresses as sentences', () => {
  const chunker = createSpeechChunker({ firstMaximumWords: 50, firstMaximumCharacters: 500 });
  const chunks = stream(chunker, [
    'Hubungi Dr. Budi pada pukul 9.30 melalui api.example.com atau dev@example.com. Setelah itu lanjut.',
  ]);
  assert.deepEqual(chunks, [
    'Hubungi Dr. Budi pada pukul 9.30 melalui api.example.com atau dev@example.com.',
    'Setelah itu lanjut.',
  ]);
});

test('flush emits the final tail exactly once', () => {
  const chunker = createSpeechChunker();
  assert.deepEqual(chunker.push('Jawaban terakhir tanpa tanda baca'), []);
  assert.deepEqual(chunker.flush(), ['Jawaban terakhir tanpa tanda baca']);
  assert.deepEqual(chunker.flush(), []);
});

test('never ends a forced chunk on a dangling connector when an earlier boundary is available', () => {
  const chunker = createSpeechChunker({ firstMaximumWords: 7 });
  const chunks = chunker.push('Krypton memberi jawaban singkat dan tepat untuk pengguna');
  assert.equal(chunks.length, 1);
  assert.doesNotMatch(chunks[0], /\b(dan|yang|untuk)$/i);
});

test('waits when the latest streamed token may be a partial word', () => {
  const chunker = createSpeechChunker({ firstMaximumWords: 5 });
  assert.deepEqual(chunker.push('Krypton memberi jawaban yang san'), []);
  assert.deepEqual(chunker.push('gat cepat '), ['Krypton memberi jawaban yang sangat']);
  assert.equal(chunker.pendingText.trim(), 'cepat');
});
