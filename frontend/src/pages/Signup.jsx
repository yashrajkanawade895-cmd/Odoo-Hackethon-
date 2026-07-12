import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const schema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    setServerError('')
    try {
      // No role field sent — signup always creates an Employee account.
      await signup(data.name, data.email, data.password)
      navigate('/dashboard')
    } catch (e) {
      setServerError('That email is already registered. Try signing in instead.')
    }
  }

  return (
    <div className="min-h-screen bg-auth-glow flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="font-mono-tag text-gradient-brand font-semibold text-2xl tracking-tight">
            AssetFlow
          </span>
          <p className="text-white/40 text-xs mt-1.5">New accounts start as Employee — an admin promotes you later.</p>
        </div>

        <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h1 className="text-white text-lg font-semibold mb-1">Create your account</h1>
          <p className="text-white/40 text-xs mb-5">Takes less than a minute.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                placeholder="Full name"
                className="bg-white/[0.05] border-white/15 text-white placeholder:text-white/30 focus:ring-status-available"
                {...register('name')}
              />
              {errors.name && <p className="text-xs text-status-lost mt-1">{errors.name.message}</p>}
            </div>
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
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <p className="text-xs text-center mt-4 text-white/40">
            Already have an account?{' '}
            <Link to="/login" className="text-status-available hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
