import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children, allowRoles }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (allowRoles && !allowRoles.includes(user.role)) return <Navigate to="/dashboard" replace />

  return children
}
