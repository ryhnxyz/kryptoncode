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
    .then((d) => (d && d.success ? d.processes : null))
    .catch(() => null);
}

export function getLogs(service = 'api_kryptoncode') {
  return getJSON(`/api/core/logs?service=${encodeURIComponent(service)}`)
    .then((d) => (d && d.success ? d.lines : null))
    .catch(() => null);
}

// Natural neural voice — URL the <audio> element plays directly.
export function voiceUrl(text, lang = 'id') {
  return `${API_BASE}/api/core/voice?lang=${encodeURIComponent(lang)}&text=${encodeURIComponent(
    String(text).slice(0, 500)
  )}`;
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
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf('\n\n')) >= 0) {
      const frame = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      let event = 'message';
      let data = '';
      for (const line of frame.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data += line.slice(5).trim();
      }
      if (!data) continue;
      let parsed;
      try {
        parsed = JSON.parse(data);
      } catch {
        parsed = data;
      }
      handlers[event] && handlers[event](parsed);
    }
  }
}

export { API_BASE };
