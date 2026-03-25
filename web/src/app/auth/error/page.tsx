import Link from 'next/link'

/**
 * Auth error page — shown when OAuth or magic link flow fails.
 * The auth callback redirects here when code exchange fails.
 */
export default function AuthErrorPage() {
  return (
    <main className="min-h-[calc(100vh-120px)] flex items-center justify-center px-6">
      <div
        className="w-full max-w-md border-3 border-ink bg-bg p-10 text-center"
        style={{ boxShadow: '6px 6px 0 var(--ink)' }}
      >
        <div className="text-4xl mb-4">😕</div>
        <h1 className="font-head font-[900] text-[1.8rem] uppercase mb-3">
          Sign-in failed
        </h1>
        <p className="font-mono text-[0.82rem] opacity-70 mb-6 leading-relaxed">
          Something went wrong during sign-in.
          <br />
          This can happen if the link expired or was already used.
        </p>
        <Link
          href="/login"
          className="font-mono text-[0.78rem] underline text-ink"
        >
          Try again
        </Link>
      </div>
    </main>
  )
}
