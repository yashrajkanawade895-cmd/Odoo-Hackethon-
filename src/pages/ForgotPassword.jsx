import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card.jsx'

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)

  const onSubmit = (e) => {
    e.preventDefault()
    // TODO: POST /auth/forgot-password
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>Enter your email and we'll send a reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <p className="text-sm text-ink">Check your inbox for a reset link.</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <Input type="email" placeholder="name@company.com" required />
              <Button type="submit" className="w-full">
                Send reset link
              </Button>
            </form>
          )}
          <p className="text-xs text-center mt-4">
            <Link to="/login" className="text-accent hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
