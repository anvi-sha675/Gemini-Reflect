const REDACTED = '[redacted]';
const SENSITIVE_KEYS = ['authorization', 'token', 'apiKey', 'api_key', 'content', 'password'];

function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = Array.isArray(obj) ? [] : {};
  for (const [k, v] of Object.entries(obj)) {
    clone[k] = SENSITIVE_KEYS.includes(k) ? REDACTED : (typeof v === 'object' ? sanitize(v) : v);
  }
  return clone;
}

export function logEvent(name, meta = {}) {
  console.log(JSON.stringify({ event: name, ...sanitize(meta), ts: new Date().toISOString() }));
}
