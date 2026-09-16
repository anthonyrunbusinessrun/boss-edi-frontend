const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/connector' : 'https://boss-edi-connector-production.up.railway.app')).replace(/\/$/, '');
const TOKEN_KEY = 'boss_edi_session';

export function hasSession() { return Boolean(sessionStorage.getItem(TOKEN_KEY)); }
export function setSession(token) { sessionStorage.setItem(TOKEN_KEY, token); }
export function clearSession() { sessionStorage.removeItem(TOKEN_KEY); }

export async function api(path, options = {}) {
  const { auth = true, allowError = false, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});
  if (auth) {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  if (fetchOptions.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${API_URL}${path}`, { ...fetchOptions, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok && !allowError) {
    const error = new Error(data.error || `Request failed with HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function login(password) {
  return api('/api/auth/login', { method: 'POST', auth: false, body: JSON.stringify({ password }) });
}
