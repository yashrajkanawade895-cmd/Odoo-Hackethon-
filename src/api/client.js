const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = new Error(body.error || `Request failed: ${res.status}`)
    err.status = res.status
    err.body = body
    throw err
  }
  return res.json()
}

// Mirrors docs/api-contract.md — one function per endpoint, add as backend lands.
export const api = {
  auth: {
    login: (email, password) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    signup: (name, email, password) =>
      request('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
    me: () => request('/auth/me'),
  },
  dashboard: {
    kpis: () => request('/dashboard/kpis'),
  },
  // assets, allocations, bookings, maintenance, audits, reports added as each
  // phase's endpoints land — see docs/api-contract.md for the full list.
}
