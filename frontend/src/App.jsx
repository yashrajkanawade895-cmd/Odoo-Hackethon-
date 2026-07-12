import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import Dashboard from './components/Dashboard.jsx'
import Directory from './pages/Directory.jsx'
import Projects from './pages/Projects.jsx'
import OrgSetup from './pages/OrgSetup.jsx'
import Assets from './pages/Assets.jsx'
import Allocations from './pages/Allocations.jsx'
import Meetings from './pages/Meetings.jsx'
import Maintenance from './pages/Maintenance.jsx'
import Audit from './pages/Audit.jsx'
import Reports from './pages/Reports.jsx'
import Notifications from './pages/Notifications.jsx'
import Settings from './pages/Settings.jsx'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/directory" element={<Directory />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/org-setup" element={<ProtectedRoute allowRoles={['admin']}><OrgSetup /></ProtectedRoute>} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/allocations" element={<Allocations />} />
              <Route path="/meetings" element={<Meetings />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/audit" element={<Audit />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
