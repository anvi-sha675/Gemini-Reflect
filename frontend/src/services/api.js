import { auth } from '../firebase/config.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function request(path, options = {}) {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;

  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    let message = 'Something went wrong. Please try again.';
    try {
      const body = await res.json();
      message = body.error || message;
    } catch {
      /* non-JSON error body, keep default message */
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  createJournal: () => request('/journals', { method: 'POST' }),
  listJournals: () => request('/journals'),
  getJournal: (id) => request(`/journals/${id}`),
  sendMessage: (id, content) =>
    request(`/journals/${id}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),
  endJournal: (id) => request(`/journals/${id}/end`, { method: 'POST' }),
  deleteJournal: (id) => request(`/journals/${id}`, { method: 'DELETE' }),
  deleteAllJournals: () => request('/journals', { method: 'DELETE' }),
  generateInsights: () => request('/insights/generate', { method: 'POST' }),
  getLatestInsight: () => request('/insights/latest'),
  generateGrowthTimeline: () => request('/insights/timeline/generate', { method: 'POST' }),
  getLatestGrowthTimeline: () => request('/insights/timeline/latest'),
  exportData: () => request('/export'),
};
