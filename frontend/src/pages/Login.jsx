import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { USE_MOCKS } from '../api/index.js'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const demoAccounts = [
  { role: 'Admin', email: 'admin@bento.test' },
  { role: 'Asset Manager', email: 'manager@bento.test' },
  { role: 'Dept Head', email: 'head@bento.test' },
  { role: 'Employee', email: 'priya@bento.test' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const [demoLoading, setDemoLoading] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    setServerError('')
    try {
      await login(data.email, data.password)
      navigate('/dashboard')
    } catch (e) {
      setServerError("Couldn't sign in. Check your email and password.")
    }
  }

  const loginAsDemo = async (email) => {
    setServerError('')
    setDemoLoading(email)
    try {
      await login(email, 'pass123')
      navigate('/dashboard')
    } catch (e) {
      setServerError("Couldn't sign in with that demo account.")
    } finally {
      setDemoLoading('')
    }
  }

  return (
    <div className="min-h-screen bg-auth-glow flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="font-mono-tag text-gradient-brand font-semibold text-2xl tracking-tight">
            Bento
          </span>
          <p className="text-white/40 text-xs mt-1.5">Enterprise Asset & Resource Management System. Lovely.</p>
        </div>

        <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h1 className="text-white text-lg font-semibold mb-1">Sign in</h1>
          <p className="text-white/40 text-xs mb-5">Welcome back — enter your details to continue.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="name@company.com"
                className="bg-white/[0.05] border-white/15 text-white placeholder:text-white/30 focus:ring-status-available"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-status-lost mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                className="bg-white/[0.05] border-white/15 text-white placeholder:text-white/30 focus:ring-status-available"
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-status-lost mt-1">{errors.password.message}</p>}
            </div>
            {serverError && <p className="text-xs text-status-lost">{serverError}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          {USE_MOCKS && (
            <div className="mt-5 pt-4 border-t border-white/10">
              <p className="text-[11px] text-white/35 mb-2">Skip login for now — preview as:</p>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map((d) => (
                  <button
                    key={d.email}
                    type="button"
                    onClick={() => loginAsDemo(d.email)}
                    disabled={demoLoading !== ''}
                    className="text-xs px-3 py-1.5 rounded-md border border-white/15 text-white/70 hover:border-status-available hover:text-status-available transition-colors disabled:opacity-50"
                  >
                    {demoLoading === d.email ? 'Signing in…' : d.role}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-4 text-xs">
            <Link to="/forgot-password" className="text-white/50 hover:text-status-available transition-colors">
              Forgot password?
            </Link>
            <Link to="/signup" className="text-white/50 hover:text-status-available transition-colors">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
