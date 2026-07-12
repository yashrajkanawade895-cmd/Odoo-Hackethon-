import axios from 'axios'

// THE LAW is docs/api-contract.md — this client only implements what's documented there.
// Base URL + mock flag are per-env, see .env.development.
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

export const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
})

// Attach the JWT from AuthContext's storage on every request. AuthContext is the
// only place that writes this key.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('bento_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Normalize axios errors to the shape pages already expect: err.status + err.body,
// where err.body mirrors the contract's error envelope, e.g.
// { error: "asset_already_allocated", held_by: "Priya Employee", suggest: "transfer" }
client.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status
    const body = error.response?.data || {}
    const err = new Error(body.error || error.message || `Request failed: ${status}`)
    err.status = status
    err.body = body
    return Promise.reject(err)
  }
)

// Small helper so every api/*.js module reads the same: real call when
// VITE_USE_MOCKS=false, mock resolver otherwise. Keeps the branch in one place
// instead of repeated in every function.
export async function call(mockFn, realFn) {
  if (USE_MOCKS) return mockFn()
  return realFn()
}

// Simulates network latency for mock reads/writes so loading states get exercised.
export function mockDelay(value, ms = 250) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

// Throws the same shape a real 409 would produce, for mocked conflict rules
// (asset_already_allocated, booking_overlap, etc).
export function mockConflict(body) {
  const err = new Error(body.error)
  err.status = 409
  err.body = body
  throw err
}
