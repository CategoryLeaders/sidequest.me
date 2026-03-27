'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type AuthMode = 'magic-link' | 'password'

/**
 * Get the main domain origin from the current window location.
 * my.sidequest.me → https://sidequest.me
 * my.localhost:3000 → https://localhost:3000
 */
function getMainOrigin(): string {
  const host = window.location.host
  const protocol = window.location.protocol
  // Strip 'my.' prefix to get back to main domain
  const mainHost = host.startsWith('my.') ? host.slice(3) : host
  return `${protocol}//${mainHost}`
}

function DashboardLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [mode, setMode] = useState<AuthMode>('magic-link')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(
    searchParams.get('error') === 'no_account'
      ? "Sorry, you don't appear to have an account."
      : null
  )
  const [loading, setLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      // Callback goes to the main domain (sidequest.me) which is in Supabase's redirect allowlist.
      // The callback route detects the missing PKCE cookie and bounces to my.sidequest.me.
      const redirectTo = `${getMainOrigin()}/auth/callback?next=${encodeURIComponent('/dashboard')}`

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      })

      if (otpError) {
        setError(otpError.message)
        return
      }

      setMagicLinkSent(true)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        setError(signInError.message)
        return
      }

      if (data.user) {
        // On my.sidequest.me, "/" maps to /dashboard via middleware rewrite
        router.push('/')
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setGoogleLoading(true)

    try {
      const supabase = createClient()
      // Callback goes to main domain (sidequest.me) which is in Supabase's redirect allowlist.
      // The ?next=/dashboard param tells the callback to redirect to my.sidequest.me after exchange.
      const redirectTo = `${getMainOrigin()}/auth/callback?next=${encodeURIComponent('/dashboard')}`

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      })

      if (oauthError) {
        setError(oauthError.message)
        setGoogleLoading(false)
      }
      // Browser redirects to Google — no need to handle success here
    } catch {
      setError('An unexpected error occurred')
      setGoogleLoading(false)
    }
  }

  // Magic link sent — show confirmation
  if (magicLinkSent) {
    return (
      <div className="text-center space-y-4">
        <div className="text-3xl">✉️</div>
        <h2 className="font-head font-[900] text-[1rem] uppercase text-ink">
          Check your email
        </h2>
        <p className="font-mono text-[0.82rem] text-ink/60 leading-relaxed">
          We sent a magic link to <strong>{email}</strong>. Click the link in the email to access your dashboard.
        </p>
        <button
          type="button"
          onClick={() => { setMagicLinkSent(false); setEmail('') }}
          className="font-mono text-[0.75rem] text-ink/40 underline cursor-pointer hover:text-ink"
        >
          Try a different email
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        className="w-full py-2.5 px-4 bg-white text-ink font-head font-[900] text-[0.82rem] uppercase border-3 border-ink hover:shadow-[3px_3px_0_var(--ink)] transition-shadow disabled:opacity-50 cursor-pointer flex items-center justify-center gap-3"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {googleLoading ? 'Redirecting…' : 'Continue with Google'}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-[2px] bg-ink/15" />
        <span className="font-mono text-[0.7rem] text-ink/40 uppercase">
          or
        </span>
        <div className="flex-1 h-[2px] bg-ink/15" />
      </div>

      {/* Mode tabs */}
      <div className="flex border-3 border-ink mb-6">
        <button
          type="button"
          onClick={() => { setMode('magic-link'); setError(null) }}
          className={`flex-1 py-2 font-head font-[900] text-[0.72rem] uppercase cursor-pointer transition-colors ${
            mode === 'magic-link' ? 'bg-ink text-[var(--cream)]' : 'bg-[var(--cream)] text-ink hover:bg-ink/5'
          }`}
        >
          Magic Link
        </button>
        <button
          type="button"
          onClick={() => { setMode('password'); setError(null) }}
          className={`flex-1 py-2 font-head font-[900] text-[0.72rem] uppercase cursor-pointer transition-colors border-l-3 border-ink ${
            mode === 'password' ? 'bg-ink text-[var(--cream)]' : 'bg-[var(--cream)] text-ink hover:bg-ink/5'
          }`}
        >
          Password
        </button>
      </div>

      <form onSubmit={mode === 'magic-link' ? handleMagicLink : handlePassword} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block font-head font-[900] text-[0.78rem] uppercase mb-2 text-ink"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-4 py-2.5 border-3 border-ink bg-white text-ink font-mono text-[0.88rem] focus:outline-none focus:shadow-[5px_5px_0_var(--ink)] transition-shadow placeholder:text-ink/40"
          />
        </div>

        {mode === 'password' && (
          <div>
            <label
              htmlFor="password"
              className="block font-head font-[900] text-[0.78rem] uppercase mb-2 text-ink"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 border-3 border-ink bg-white text-ink font-mono text-[0.88rem] focus:outline-none focus:shadow-[5px_5px_0_var(--ink)] transition-shadow placeholder:text-ink/40"
            />
          </div>
        )}

        {error && (
          <div className="border-3 border-red-500 bg-red-50 p-3 font-mono text-[0.78rem] text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-[var(--orange)] text-white font-head font-[900] text-[0.82rem] uppercase border-3 border-[var(--orange)] hover:bg-transparent hover:text-[var(--orange)] transition-colors disabled:opacity-50 cursor-pointer shadow-[3px_3px_0_var(--orange)]"
        >
          {loading
            ? (mode === 'magic-link' ? 'Sending link…' : 'Signing in…')
            : (mode === 'magic-link' ? 'Send Magic Link' : 'Sign In')
          }
        </button>

        {mode === 'magic-link' && (
          <p className="font-mono text-[0.7rem] text-ink/40 text-center">
            No password needed — we&apos;ll email you a sign-in link.
          </p>
        )}
      </form>
    </>
  )
}

export default function DashboardLoginPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-6 bg-[var(--cream,#fffbe6)]"
    >
      <div
        className="w-full max-w-md p-10 bg-[var(--cream,#fffbe6)] border-3 border-ink shadow-[5px_5px_0_var(--ink)]"
      >
        <h1 className="font-head font-[900] text-[2rem] uppercase leading-tight mb-2 text-ink">
          MY SIDEQUEST
        </h1>
        <p className="font-mono text-[0.78rem] text-ink/50 mb-8">
          Sign in to manage your SideQuest life.
        </p>

        <Suspense fallback={null}>
          <DashboardLoginForm />
        </Suspense>

        <div className="mt-8 pt-6 border-t-3 border-ink text-center">
          <Link
            href="/"
            className="font-mono text-[0.75rem] text-ink/40 hover:text-ink underline"
          >
            Back to SideQuest.me
          </Link>
        </div>
      </div>
    </main>
  )
}
