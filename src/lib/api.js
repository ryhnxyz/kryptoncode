const API_BASE = 'https://api.kryptoncode.xyz';

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  return res.json();
}

export const api = {
  get: (path) => apiFetch(path),
  post: (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  del: (path, body) => apiFetch(path, { method: 'DELETE', body: JSON.stringify(body) }),
};

export { API_BASE };
