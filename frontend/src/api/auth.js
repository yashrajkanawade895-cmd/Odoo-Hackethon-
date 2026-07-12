import { client, call, mockDelay } from './client.js'
import mock from '../mocks/auth.json'

// POST /auth/signup — always role "employee", a role field in the body is ignored.
export function signup(name, email, password) {
  return call(
    () => {
      const exists = mock.users.some((u) => u.email === email)
      if (exists) {
        const err = new Error('email already registered')
        err.status = 409
        err.body = { error: 'email already registered' }
        throw err
      }
      const user = { id: mock.users.length + 1, name, email, role: 'employee', departmentId: null, status: 'active' }
      return mockDelay(user)
    },
    () => client.post('/auth/signup', { name, email, password }).then((r) => r.data)
  )
}

// POST /auth/login
export function login(email, password) {
  return call(
    () => {
      const user = mock.users.find((u) => u.email === email)
      if (!user || password !== mock.password) {
        const err = new Error('invalid credentials')
        err.status = 401
        err.body = { error: 'invalid credentials' }
        throw err
      }
      return mockDelay({ token: `mock-jwt-${user.id}`, user })
    },
    () => client.post('/auth/login', { email, password }).then((r) => r.data)
  )
}

// GET /auth/me — fresh from DB so role promotions show without re-login.
export function me() {
  return call(
    () => mockDelay(mock.users[0]),
    () => client.get('/auth/me').then((r) => r.data)
  )
}

export function forgotPassword(email) {
  return call(
    () => mockDelay({ message: 'reset link sent', resetToken: 'mock-reset-token' }),
    () => client.post('/auth/forgot-password', { email }).then((r) => r.data)
  )
}

export function resetPassword(token, newPassword) {
  return call(
    () => mockDelay({ message: 'password updated' }),
    () => client.post('/auth/reset-password', { token, newPassword }).then((r) => r.data)
  )
}
