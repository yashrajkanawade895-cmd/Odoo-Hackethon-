import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

// TODO(sync with Yashraj): replace with real POST /auth/login + JWT storage
// per docs/api-contract.md. Shape below matches the documented JWT claims
// {id, role, department_id} so swapping the implementation doesn't touch consumers.
const MOCK_USER = {
  id: 'usr_1',
  name: 'Admin User',
  role: 'admin', // admin | asset_manager | dept_head | employee
  department_id: null,
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(MOCK_USER)

  const login = async (email, password) => {
    // TODO: POST /auth/login -> { token, user }
    setUser(MOCK_USER)
    return MOCK_USER
  }

  const signup = async (name, email, password) => {
    // TODO: POST /auth/signup -> always role "employee", no role field sent
    setUser({ ...MOCK_USER, role: 'employee' })
  }

  const logout = () => setUser(null)

  const setRoleForDemo = (role) => setUser((u) => ({ ...u, role }))

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, setRoleForDemo }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
