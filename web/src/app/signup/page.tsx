'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        setError(signUpError.message)
      } else {
        setSuccess(true)
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-4 py-2.5 border-3 border-ink bg-white font-mono text-[0.88rem] focus:outline-none focus:shadow-[3px_3px_0_var(--ink)] transition-shadow'
  const labelClass = 'block font-head font-bold text-[0.78rem] uppercase mb-2'

  if (success) {
    return (
      <main className="min-h-[calc(100vh-120px)] flex items-center justify-center px-6">
        <div className="w-full max-w-md border-3 border-ink bg-bg p-10 text-center" style={{ boxShadow: '6px 6px 0 var(--ink)' }}>
          <div className="text-4xl mb-4">✉️</div>
          <h1 className="font-head font-[900] text-[1.8rem] uppercase mb-3">Check your email</h1>
          <p className="font-mono text-[0.82rem] opacity-70 mb-6">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <Link href="/login" className="font-mono text-[0.78rem] underline text-ink">
            Back to login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-120px)] flex items-center justify-center px-6">
      <div className="w-full max-w-md border-3 border-ink bg-bg p-10" style={{ boxShadow: '6px 6px 0 var(--ink)' }}>
        <h1 className="font-head font-[900] text-[2rem] uppercase leading-tight mb-1">Create Account</h1>
        <p className="font-mono text-[0.78rem] opacity-60 mb-8">Join SideQuest.me today</p>

        <form onSubmit={handleSignUp} className="space-y-5">
          <div>
            <label htmlFor="email" className={labelClass}>Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="password" className={labelClass}>Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className={labelClass}>Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className={inputClass}
            />
          </div>

          {error && (
            <div className="border-3 border-red-500 bg-red-50 p-3 font-mono text-[0.78rem] text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-ink text-bg font-head font-bold text-[0.82rem] uppercase border-3 border-ink hover:bg-transparent hover:text-ink transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>

          <p className="font-mono text-[0.75rem] opacity-60 text-center">
            Already have an account?{' '}
            <Link href="/login" className="text-ink font-bold underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}
