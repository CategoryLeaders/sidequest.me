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

/**
 * Manually exchange an auth code + code_verifier for a session via the Supabase
 * token endpoint. Bypasses the @supabase/ssr client's exchangeCodeForSession
 * which silently fails in cross-subdomain cookie scenarios.
 */
async function manualPkceExchange(code: string, codeVerifier: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const formBody = new URLSearchParams({
    auth_code: code,
    code_verifier: codeVerifier,
  })

  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=pkce`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: formBody.toString(),
  })

  const body = await res.json()

  if (!res.ok) {
    return { data: null, error: { message: body.error_description || body.msg || body.error || 'Token exchange failed', status: res.status } }
  }

  return { data: body, error: null }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const hostname = requestUrl.hostname
  const code = requestUrl.searchParams.get('code')
  const next = safeRedirectPath(requestUrl.searchParams.get('next'))

  if (code) {
    // Read all cookies to find the PKCE code_verifier
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const codeVerifierCookie = allCookies.find(c => c.name.includes('code-verifier'))

    console.log('[auth/callback] hostname:', hostname, '| next:', next, '| code:', code.slice(0, 8) + '...')
    console.log('[auth/callback] cookies:', allCookies.map(c => c.name).join(', '))
    console.log('[auth/callback] code_verifier:', codeVerifierCookie ? 'FOUND' : 'MISSING')

    // If code_verifier is missing and we're on the main domain, bounce to my. subdomain
    if (!codeVerifierCookie && !hostname.startsWith('my.')) {
      const bounceUrl = new URL(requestUrl.toString())
      bounceUrl.hostname = 'my.' + bounceUrl.hostname
      if (!bounceUrl.searchParams.has('next')) {
        bounceUrl.searchParams.set('next', '/dashboard')
      }
      console.log('[auth/callback] BOUNCING to my. subdomain')
      return NextResponse.redirect(bounceUrl.toString())
    }

    // If we still don't have the code_verifier (even on my.), redirect to error with details
    if (!codeVerifierCookie) {
      console.error('[auth/callback] code_verifier MISSING even on my. subdomain — cannot exchange')
      const errorUrl = new URL('/auth/error', requestUrl.origin)
      errorUrl.searchParams.set('reason', 'missing_code_verifier')
      return NextResponse.redirect(errorUrl.toString())
    }

    // Decode the code_verifier — @supabase/ssr stores cookies with base64url encoding
    // by default (prefix "base64-" followed by base64url-encoded value)
    const BASE64_PREFIX = 'base64-'
    const rawValue = codeVerifierCookie.value
    const codeVerifier = rawValue.startsWith(BASE64_PREFIX)
      ? Buffer.from(rawValue.substring(BASE64_PREFIX.length), 'base64url').toString('utf-8')
      : rawValue

    console.log('[auth/callback] code_verifier raw length:', rawValue.length, 'decoded length:', codeVerifier.length, 'was_encoded:', rawValue.startsWith(BASE64_PREFIX))

    // Manual PKCE exchange — bypasses @supabase/ssr client which fails silently
    console.log('[auth/callback] attempting manual PKCE exchange...')
    const { data: tokenData, error: tokenError } = await manualPkceExchange(code, codeVerifier)

    if (tokenError) {
      console.error('[auth/callback] manual PKCE exchange FAILED:', tokenError.message, '| status:', tokenError.status)
      const errorUrl = new URL('/auth/error', requestUrl.origin)
      errorUrl.searchParams.set('reason', 'exchange_failed')
      errorUrl.searchParams.set('detail', tokenError.message)
      return NextResponse.redirect(errorUrl.toString())
    }

    console.log('[auth/callback] PKCE exchange succeeded — setting session')

    // Now use the Supabase client to set the session from the tokens we received
    const supabase = await createClient()
    const { data: sessionData, error: setError } = await supabase.auth.setSession({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
    })

    if (setError) {
      console.error('[auth/callback] setSession failed:', setError.message)
      return NextResponse.redirect(new URL('/auth/error', requestUrl.origin))
    }

    // Remove the code_verifier cookie now that it's been used
    try {
      cookieStore.delete(codeVerifierCookie.name)
    } catch {
      // Non-fatal — cookie will expire naturally
    }

    if (sessionData.user) {
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

      console.log('[auth/callback] SUCCESS — redirecting to', next)
      return NextResponse.redirect(buildRedirectUrl(next, requestUrl.origin))
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(new URL('/auth/error', requestUrl.origin))
}
