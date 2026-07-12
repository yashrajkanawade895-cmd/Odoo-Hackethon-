import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'
import { api } from '../api/index.js'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.auth.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError("Couldn't send a reset link. Check the email and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-auth-glow flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="font-mono-tag text-gradient-brand font-semibold text-2xl tracking-tight">
            AssetFlow
          </span>
        </div>

        <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h1 className="text-white text-lg font-semibold mb-1">Reset your password</h1>
          <p className="text-white/40 text-xs mb-5">Enter your email and we'll send a reset link.</p>

          {sent ? (
            <p className="text-sm text-white/80">Check your inbox for a reset link.</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="name@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/[0.05] border-white/15 text-white placeholder:text-white/30 focus:ring-status-available"
              />
              {error && <p className="text-xs text-status-lost">{error}</p>}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>
          )}
          <p className="text-xs text-center mt-4">
            <Link to="/login" className="text-white/50 hover:text-status-available transition-colors">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
