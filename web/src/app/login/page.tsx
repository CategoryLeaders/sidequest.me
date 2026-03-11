'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type AuthMode = 'magic-link' | 'password'

/**
 * Validates redirect path — prevents open-redirect attacks.
 * Only allows relative paths starting with "/" (not "//").
 */
function safeNextPath(raw: string | null): string | null {
  if (!raw) return null
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw
  return null
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = safeNextPath(searchParams.get('next'))

  const [mode, setMode] = useState<AuthMode>('magic-link')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const redirectAfterLogin = async (userId: string) => {
    if (nextPath) {
      router.push(nextPath)
      return
    }
    const supabase = createClient()
    // Cast needed — postgrest-js 2.99 + TS 5.9 infers .single() data as never
    const { data: profileData } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single() as unknown as { data: { username: string } | null; error: unknown }

    router.push(profileData?.username ? `/${profileData.username}` : '/')
    router.refresh()
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const redirectTo = `${window.location.origin}/auth/callback${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''}`

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

      await redirectAfterLogin(data.user!.id)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Magic link sent — show confirmation
  if (magicLinkSent) {
    return (
      <div className="text-center space-y-4">
        <div className="text-3xl">✉️</div>
        <h2 className="font-head font-bold text-[1rem] uppercase">Check your email</h2>
        <p className="font-mono text-[0.82rem] opacity-70 leading-relaxed">
          We sent a magic link to <strong>{email}</strong>. Click the link in the email to sign in.
        </p>
        <button
          type="button"
          onClick={() => { setMagicLinkSent(false); setEmail('') }}
          className="font-mono text-[0.75rem] opacity-50 underline cursor-pointer hover:opacity-80"
        >
          Try a different email
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Mode tabs */}
      <div className="flex border-3 border-ink mb-6">
        <button
          type="button"
          onClick={() => { setMode('magic-link'); setError(null) }}
          className={`flex-1 py-2 font-head font-bold text-[0.72rem] uppercase cursor-pointer transition-colors ${
            mode === 'magic-link' ? 'bg-ink text-bg' : 'bg-white text-ink hover:bg-ink/5'
          }`}
        >
          Magic Link
        </button>
        <button
          type="button"
          onClick={() => { setMode('password'); setError(null) }}
          className={`flex-1 py-2 font-head font-bold text-[0.72rem] uppercase cursor-pointer transition-colors border-l-3 border-ink ${
            mode === 'password' ? 'bg-ink text-bg' : 'bg-white text-ink hover:bg-ink/5'
          }`}
        >
          Password
        </button>
      </div>

      <form onSubmit={mode === 'magic-link' ? handleMagicLink : handlePassword} className="space-y-5">
        <div>
          <label htmlFor="email" className="block font-head font-bold text-[0.78rem] uppercase mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-4 py-2.5 border-3 border-ink bg-white font-mono text-[0.88rem] focus:outline-none focus:shadow-[3px_3px_0_var(--ink)] transition-shadow"
          />
        </div>

        {mode === 'password' && (
          <div>
            <label htmlFor="password" className="block font-head font-bold text-[0.78rem] uppercase mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 border-3 border-ink bg-white font-mono text-[0.88rem] focus:outline-none focus:shadow-[3px_3px_0_var(--ink)] transition-shadow"
            />
          </div>
        )}

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
          {loading
            ? (mode === 'magic-link' ? 'Sending link…' : 'Signing in…')
            : (mode === 'magic-link' ? 'Send Magic Link' : 'Sign In')
          }
        </button>

        {mode === 'magic-link' && (
          <p className="font-mono text-[0.7rem] opacity-50 text-center">
            No password needed — we&apos;ll email you a sign-in link.
          </p>
        )}

        <p className="font-mono text-[0.75rem] opacity-60 text-center">
          No account?{' '}
          <Link href="/signup" className="text-ink font-bold underline">
            Sign up
          </Link>
        </p>
      </form>
    </>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-[calc(100vh-120px)] flex items-center justify-center px-6">
      <div className="w-full max-w-md border-3 border-ink bg-bg p-10" style={{ boxShadow: '6px 6px 0 var(--ink)' }}>
        <h1 className="font-head font-[900] text-[2rem] uppercase leading-tight mb-1">Sign In</h1>
        <p className="font-mono text-[0.78rem] opacity-60 mb-8">Welcome back to SideQuest.me</p>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}
