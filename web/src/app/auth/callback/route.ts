import { createClient } from '@/lib/supabase/server'
import { safeRedirectPath } from '@/lib/auth/redirect'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = safeRedirectPath(requestUrl.searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && sessionData.user) {
      // Check that a profile exists for this user — no auto-creation [SQ.S-W-2603-0049]
      const { data: profile } = await supabase
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

  // Auth flow failed — show error page
  return NextResponse.redirect(new URL('/auth/error', requestUrl.origin))
}
