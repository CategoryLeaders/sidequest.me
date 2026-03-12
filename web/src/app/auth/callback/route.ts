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

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = safeRedirectPath(requestUrl.searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

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

      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(new URL('/auth/error', requestUrl.origin))
}
