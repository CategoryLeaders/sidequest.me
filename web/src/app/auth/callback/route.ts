import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
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
  const hostname = requestUrl.hostname
  const code = requestUrl.searchParams.get('code')
  const next = safeRedirectPath(requestUrl.searchParams.get('next'))

  if (code) {
    // Diagnostic: log all cookies to understand PKCE state
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const cookieNames = allCookies.map(c => c.name)
    const codeVerifierCookie = allCookies.find(c => c.name.includes('code-verifier'))

    console.log('[auth/callback] hostname:', hostname, 'next:', next, 'code:', code.slice(0, 8) + '...')
    console.log('[auth/callback] cookie count:', allCookies.length, 'names:', cookieNames.join(', '))
    console.log('[auth/callback] code_verifier cookie:', codeVerifierCookie ? 'PRESENT (' + codeVerifierCookie.name + ')' : 'MISSING')

    // PKCE fix: If code_verifier cookie is missing on main domain, bounce to my. subdomain
    // where the login started and the cookie was set. No condition on `next` — any auth
    // callback on the main domain without a code_verifier should bounce.
    if (!codeVerifierCookie && !hostname.startsWith('my.')) {
      const bounceUrl = new URL(requestUrl.toString())
      bounceUrl.hostname = 'my.' + bounceUrl.hostname
      // Ensure next param is preserved for redirect after exchange
      if (!bounceUrl.searchParams.has('next')) {
        bounceUrl.searchParams.set('next', '/dashboard')
      }
      console.error('[auth/callback] code_verifier MISSING on main domain — bouncing to my. subdomain')
      return NextResponse.redirect(bounceUrl.toString())
    }

    const supabase = await createClient()

    console.log('[auth/callback] calling exchangeCodeForSession...')
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[auth/callback] exchangeCodeForSession FAILED:', error.message, '| status:', error.status, '| name:', error.name)
    } else {
      console.log('[auth/callback] exchangeCodeForSession SUCCESS, user:', sessionData?.user?.email)
    }

    if (!error && sessionData.user) {
      // Check that a profile exists for this user — no auto-creation [SQ.S-W-2603-0049]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any
      const { data: profile } = await db
        .from('profiles')
        .select('username')
        .eq('id', sessionData.user.id)
        .single()

      if (!profile) {
        // No profile — sign out and redirect to login with error
        await supabase.auth.signOut()
        return NextResponse.redirect(
          new URL('/login?error=no_account', requestUrl.origin)
        )
      }

      return NextResponse.redirect(buildRedirectUrl(next, requestUrl.origin))
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(new URL('/auth/error', requestUrl.origin))
}