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
  const code = requestUrl.searchParams.get('code')
  const next = safeRedirectPath(requestUrl.searchParams.get('next'))

  if (code) {
    // Diagnostic: log all cookie names to debug PKCE code_verifier delivery
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const codeVerifierCookie = allCookies.find(c => c.name.includes('code-verifier'))
    console.error('[auth/callback] cookies received:', allCookies.map(c => c.name).join(', '))
    console.error('[auth/callback] code_verifier cookie:', codeVerifierCookie ? 'PRESENT' : 'MISSING')

    const supabase = await createClient()
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[auth/callback] exchangeCodeForSession failed:', error.message, error.status)
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
