'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
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

      if (nextPath) {
        router.push(nextPath)
        return
      }

      // Redirect to own profile after login
      // Cast needed — postgrest-js 2.99 + TS 5.9 infers .single() data as never
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', data.user!.id)
        .single() as unknown as { data: { username: string } | null; error: unknown }

      router.push(profileData?.username ? `/${profileData.username}` : '/')
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSignIn} className="space-y-5">
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
        {loading ? 'Signing in…' : 'Sign In'}
      </button>

      <p className="font-mono text-[0.75rem] opacity-60 text-center">
        No account?{' '}
        <Link href="/signup" className="text-ink font-bold underline">
          Sign up
        </Link>
      </p>
    </form>
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
