import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <main className="min-h-[calc(100vh-120px)] flex items-center justify-center px-6">
      <div
        className="w-full max-w-md border-3 border-ink bg-bg p-10 text-center"
        style={{ boxShadow: '6px 6px 0 var(--ink)' }}
      >
        <div className="text-3xl mb-4">🔒</div>
        <h1 className="font-head font-[900] text-[1.5rem] uppercase leading-tight mb-3">
          Sign-in failed
        </h1>
        <p className="font-mono text-[0.82rem] opacity-70 leading-relaxed mb-8">
          Something went wrong during authentication. This can happen if the
          link expired or the sign-in was cancelled. Please try again.
        </p>
        <Link
          href="/login"
          className="inline-block py-2.5 px-6 bg-ink text-bg font-head font-bold text-[0.82rem] uppercase border-3 border-ink hover:bg-transparent hover:text-ink transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  )
}
