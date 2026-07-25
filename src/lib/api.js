const API_BASE = 'https://api.kryptoncode.xyz';
const DEFAULT_TIMEOUT = 6500;

// Abort slow requests so offline fallbacks kick in quickly.
function timeoutSignal(ms) {
  if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) return AbortSignal.timeout(ms);
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

export async function apiFetch(path, options = {}) {
  const { timeout = DEFAULT_TIMEOUT, ...rest } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    signal: timeoutSignal(timeout),
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(rest.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const api = {
  get: (path, options) => apiFetch(path, options),
  post: (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  del: (path, body) => apiFetch(path, { method: 'DELETE', body: JSON.stringify(body) }),
};

export { API_BASE };
