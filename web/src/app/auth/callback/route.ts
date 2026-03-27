import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Validates a redirect path to prevent open-redirect attacks.
 * Only allows relative paths starting with "/" (not "//").
 */
function safeRedirectPath(raw: string | null): string {
  if (!raw) return '/'
  // Must start with exactly one slash (not //) to stay on-origin
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw
  return '/'
}

/**
 * Build the final redirect URL for a given `next` path.
 * When next is "/dashboard" or starts with "/dashboard/", redirect to the
 * my. subdomain instead of the main domain — the dashboard routes only
 * exist behind the my.sidequest.me middleware rewrite.
 *
 * e.g. next="/dashboard"       → https://my.sidequest.me/
 *      next="/dashboard/profile" → https://my.sidequest.me/profile
 */
function buildRedirectUrl(next: string, origin: string): URL {
  if (next === '/dashboard' || next.startsWith('/dashboard/')) {
    const subPath = next === '/dashboard' ? '/' : next.slice('/dashboard'.length)
    const url = new URL(origin)
    // Ensure we're on the my. subdomain (don't double-prepend if already there)
    if (!url.hostname.startsWith('my.')) {
      url.hostname = 'my.' + url.hostname
    }
    url.pathname = subPath
    return url
  }
  return new URL(next, origin)
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = safeRedirectPath(requestUrl.searchParams.get('next'))

  console.log('[auth/callback] code:', code ? code.slice(0, 8) + '...' : 'MISSING', '| next:', next)

  if (code) {
    const supabase = await createClient()

    // Use the library's built-in PKCE exchange — it handles cookie reading,
    // base64url decoding, and API formatting internally.
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[auth/callback] exchangeCodeForSession FAILED:', error.message)
      const errorUrl = new URL('/auth/error', requestUrl.origin)
      errorUrl.searchParams.set('reason', 'exchange_failed')
      errorUrl.searchParams.set('detail', error.message)
      return NextResponse.redirect(errorUrl.toString())
    }

    console.log('[auth/callback] exchange succeeded, user:', data.user?.id)

    if (data.user) {
      // Check that a profile exists for this user — no auto-creation [SQ.S-W-2603-0049]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any
      const { data: profile } = await db
        .from('profiles')
        .select('username')
        .eq('id', data.user.id)
        .single()

      if (!profile) {
        // No profile — sign out and redirect to login with error
        await supabase.auth.signOut()
        return NextResponse.redirect(
          new URL('/login?error=no_account', requestUrl.origin)
        )
      }

      console.log('[auth/callback] SUCCESS — redirecting to', next)
      return NextResponse.redirect(buildRedirectUrl(next, requestUrl.origin))
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(new URL('/auth/error', requestUrl.origin))
}
