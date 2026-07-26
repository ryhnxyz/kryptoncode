// ─────────────────────────────────────────────────────────────────
// KRYPTON AI CORE · live API client → kryptoncode-backend /api/core
// Read-only live data + natural voice + streaming orchestrator (SSE).
// Everything degrades gracefully: callers fall back to mock on error.
// ─────────────────────────────────────────────────────────────────

const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_CORE_API) ||
  'https://api.kryptoncode.xyz';

function timeoutSignal(ms) {
  if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) return AbortSignal.timeout(ms);
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
}

async function getJSON(path, ms = 6000) {
  const res = await fetch(`${API_BASE}${path}`, { signal: timeoutSignal(ms) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function getSystem() {
  return getJSON('/api/core/system').catch(() => null);
}

export function getProcesses() {
  return getJSON('/api/core/processes')
    .then((data) => (data?.success ? data : null))
    .catch(() => null);
}

/**
 * Stream the orchestrator over SSE (POST). Parses `event:`/`data:` frames and
 * dispatches to handlers: { stage, panel, token, done, error }.
 * Returns a promise that resolves when the stream ends.
 */
export async function streamChat({ message, lang = 'id', history = [], handlers = {}, signal }) {
  const res = await fetch(`${API_BASE}/api/core/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, lang, history }),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`chat HTTP ${res.status}`);

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let terminal = null;

  const dispatchFrame = (frame) => {
    let event = 'message';
    const dataLines = [];
    for (const line of frame.split(/\r\n|\n|\r/)) {
      if (!line || line.startsWith(':')) continue;
      const colon = line.indexOf(':');
      const field = colon < 0 ? line : line.slice(0, colon);
      let value = colon < 0 ? '' : line.slice(colon + 1);
      if (value.startsWith(' ')) value = value.slice(1);
      if (field === 'event') event = value || 'message';
      else if (field === 'data') dataLines.push(value);
    }
    if (!dataLines.length) return;
    let parsed;
    try {
      parsed = JSON.parse(dataLines.join('\n'));
    } catch {
      throw new Error(`malformed ${event} event`);
    }
    if (event === 'done' || event === 'error') {
      if (terminal) throw new Error('duplicate terminal event');
      terminal = event;
    }
    handlers[event]?.(parsed);
  };

  const drain = () => {
    while (true) {
      const match = /\r\n\r\n|\n\n|\r\r/.exec(buf);
      if (!match) return;
      const frame = buf.slice(0, match.index);
      buf = buf.slice(match.index + match[0].length);
      dispatchFrame(frame);
      if (terminal) return;
    }
  };

  try {
    while (!terminal) {
      const { value, done } = await reader.read();
      if (done) {
        buf += dec.decode();
        drain();
        break;
      }
      buf += dec.decode(value, { stream: true });
      if (buf.length > 1024 * 1024) throw new Error('chat stream buffer overflow');
      drain();
    }
    if (!terminal) throw new Error('chat stream ended without terminal event');
    if (!signal?.aborted) await reader.cancel().catch(() => {});
    return terminal;
  } finally {
    try { reader.releaseLock(); } catch { /* already released */ }
  }
}

export { API_BASE };
