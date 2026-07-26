import assert from 'node:assert/strict';
import test from 'node:test';
import { streamChat } from '../src/core/liveApi.js';

const encoder = new TextEncoder();

function installFetch(chunks) {
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    body: new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    }),
  });
}

test('parses split CRLF SSE frames, ignores heartbeats, and requires one done event', async () => {
  installFetch([
    ': heartbeat\r\n\r\nevent: token\r\ndata: {"t":"Halo"}\r',
    '\n\r\nevent: token\r\ndata: {"t":" Krypton"}\r\n\r\n',
    'event: done\r\ndata: {"text":"Halo Krypton"}\r\n\r\n',
  ]);
  const tokens = [];
  let done = null;
  const terminal = await streamChat({
    message: 'test',
    handlers: {
      token: (data) => tokens.push(data.t),
      done: (data) => { done = data.text; },
    },
  });
  assert.equal(terminal, 'done');
  assert.deepEqual(tokens, ['Halo', ' Krypton']);
  assert.equal(done, 'Halo Krypton');
});

test('dispatches a terminal error event exactly once', async () => {
  installFetch(['event: error\ndata: {"reason":"upstream timeout"}\n\n']);
  const errors = [];
  const terminal = await streamChat({
    message: 'test',
    handlers: { error: (data) => errors.push(data.reason) },
  });
  assert.equal(terminal, 'error');
  assert.deepEqual(errors, ['upstream timeout']);
});

test('rejects EOF without a terminal event instead of leaving the UI thinking', async () => {
  installFetch(['event: token\ndata: {"t":"partial"}\n\n']);
  await assert.rejects(
    () => streamChat({ message: 'test', handlers: {} }),
    /without terminal event/
  );
});

test('rejects malformed JSON frames', async () => {
  installFetch(['event: token\ndata: not-json\n\n']);
  await assert.rejects(
    () => streamChat({ message: 'test', handlers: {} }),
    /malformed token event/
  );
});
