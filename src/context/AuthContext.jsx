import { createContext, useContext, useState, useEffect } from 'react'
import { api, tokenStorage } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = tokenStorage.get()
      if (token) {
        try {
          const profile = await api.auth.me()
          setUser(profile)
        } catch (err) {
          console.error('Failed to restore session', err)
          tokenStorage.clear()
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const login = async (email, password) => {
    const res = await api.auth.login(email, password)
    tokenStorage.set(res.token)
    setUser(res.user)
    return res.user
  }

  const signup = async (name, email, password) => {
    await api.auth.signup(name, email, password)
    // Auto login after signup
    return login(email, password)
  }

  const logout = () => {
    tokenStorage.clear()
    setUser(null)
  }

  // Helper for demo UI when not fully logged in
  const setRoleForDemo = (role) => setUser((u) => ({ ...u, role }))

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, setRoleForDemo, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
