'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function DashboardLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const redirectTo = `${window.location.origin}/dashboard`

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

  // Magic link sent — show confirmation
  if (magicLinkSent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#fffbe6' }}>
        <div
          className="w-full max-w-md p-10 bg-[#fffbe6] border-[3px] border-[#1a1a1a]"
          style={{ boxShadow: '5px 5px 0 #1a1a1a' }}
        >
          <div className="text-center space-y-4">
            <div className="text-3xl">✉️</div>
            <h2 className="font-[900] text-[1rem] uppercase" style={{ fontFamily: 'Archivo' }}>
              Check your email
            </h2>
            <p className="text-[0.82rem] opacity-70 leading-relaxed" style={{ fontFamily: 'Space Mono' }}>
              We sent a magic link to <strong>{email}</strong>. Click the link in the email to access your dashboard.
            </p>
            <button
              type="button"
              onClick={() => {
                setMagicLinkSent(false)
                setEmail('')
              }}
              className="text-[0.75rem] opacity-50 underline cursor-pointer hover:opacity-80"
              style={{ fontFamily: 'Space Mono' }}
            >
              Try a different email
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#fffbe6' }}>
      <div
        className="w-full max-w-md p-10 bg-[#fffbe6] border-[3px] border-[#1a1a1a]"
        style={{ boxShadow: '5px 5px 0 #1a1a1a' }}
      >
        <h1
          className="font-[900] text-[2rem] uppercase leading-tight mb-2"
          style={{ fontFamily: 'Archivo' }}
        >
          MY SIDEQUEST
        </h1>
        <p
          className="text-[0.78rem] opacity-60 mb-8"
          style={{ fontFamily: 'Space Mono' }}
        >
          Sign in to manage your SideQuest life.
        </p>

        <form onSubmit={handleMagicLink} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block font-[900] text-[0.78rem] uppercase mb-2"
              style={{ fontFamily: 'Archivo' }}
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
              className="w-full px-4 py-2.5 border-[3px] border-[#1a1a1a] bg-[#fffbe6] text-[0.88rem] focus:outline-none transition-shadow"
              style={{
                fontFamily: 'Space Mono',
                boxShadow: 'focus:5px 5px 0 #1a1a1a',
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '5px 5px 0 #1a1a1a'
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          {error && (
            <div
              className="border-[3px] border-red-500 bg-red-50 p-3 text-[0.78rem] text-red-600"
              style={{ fontFamily: 'Space Mono' }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#ff6b35] text-white font-[900] text-[0.82rem] uppercase border-[3px] border-[#ff6b35] hover:bg-transparent hover:text-[#ff6b35] transition-colors disabled:opacity-50 cursor-pointer"
            style={{
              fontFamily: 'Archivo',
              boxShadow: '3px 3px 0 #ff6b35',
            }}
          >
            {loading ? 'Sending link…' : 'Send magic link'}
          </button>

          <p
            className="text-[0.7rem] opacity-50 text-center"
            style={{ fontFamily: 'Space Mono' }}
          >
            No password needed — we&apos;ll email you a sign-in link.
          </p>
        </form>

        <div className="mt-8 pt-6 border-t-[3px] border-[#1a1a1a] text-center">
          <Link
            href="/"
            className="text-[0.75rem] opacity-60 hover:opacity-100 underline"
            style={{ fontFamily: 'Space Mono' }}
          >
            Back to SideQuest.me
          </Link>
        </div>
      </div>
    </main>
  )
}
