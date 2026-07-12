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
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <span className="font-mono-tag text-status-available font-semibold text-lg block mb-4">AssetFlow</span>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            New accounts start as Employee. An admin can promote you later from the employee directory.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input placeholder="Full name" {...register('name')} />
              {errors.name && <p className="text-xs text-status-lost mt-1">{errors.name.message}</p>}
            </div>
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
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
          <p className="text-xs text-center mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
