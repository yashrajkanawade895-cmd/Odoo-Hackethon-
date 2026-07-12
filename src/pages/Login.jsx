import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function Login() {
  const { login } = useAuth()
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
      await login(data.email, data.password)
      navigate('/dashboard')
    } catch (e) {
      setServerError("Couldn't sign in. Check your email and password.")
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <span className="font-mono-tag text-status-available font-semibold text-lg block mb-4">AssetFlow</span>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Track, allocate, and maintain your organization's assets.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input type="email" placeholder="name@company.com" {...register('email')} />
              {errors.email && <p className="text-xs text-status-lost mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Input type="password" placeholder="Password" {...register('password')} />
              {errors.password && <p className="text-xs text-status-lost mt-1">{errors.password.message}</p>}
            </div>
            {serverError && <p className="text-xs text-status-lost">{serverError}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <div className="flex items-center justify-between mt-4 text-xs">
            <Link to="/forgot-password" className="text-accent hover:underline">
              Forgot password?
            </Link>
            <Link to="/signup" className="text-accent hover:underline">
              Create an account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
