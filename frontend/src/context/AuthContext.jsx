import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api/index.js'

const AuthContext = createContext(null)

const TOKEN_KEY = 'bento_token'
const USER_KEY = 'bento_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem(USER_KEY)
    return cached ? JSON.parse(cached) : null
  })
  const [loading, setLoading] = useState(true)

  // On load, if we have a token, refresh the user from /auth/me so role
  // promotions (done by an admin elsewhere) show up without a re-login.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }
    api.auth
      .me()
      .then((fresh) => {
        setUser(fresh)
        localStorage.setItem(USER_KEY, JSON.stringify(fresh))
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const { token, user: loggedInUser } = await api.auth.login(email, password)
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser))
    setUser(loggedInUser)
    return loggedInUser
  }

  const signup = async (name, email, password) => {
    // Always creates role "employee" — no role field is sent, matching the contract.
    const created = await api.auth.signup(name, email, password)
    // Signup doesn't return a token per the contract, so log in right after.
    return login(email, password).catch(() => created)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  // Demo-only helper for previewing role-based UI while mocks are on. No-ops
  // against a real backend since role changes only happen via PATCH /employees/:id/role.
  const setRoleForDemo = (role) => setUser((u) => (u ? { ...u, role } : u))

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, setRoleForDemo }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
