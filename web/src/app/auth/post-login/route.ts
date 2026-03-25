import { createClient } from '@/lib/supabase/server'
import { safeRedirectPath } from '@/lib/auth/redirect'
import { NextResponse } from 'next/server'

/**
 * Server-side post-login redirect.
 *
 * After email+password login succeeds on the client, the login page navigates
 * here instead of making a client-side DB query to find the username.
 *
 * Flow:
 * 1. Validate user is authenticated
 * 2. If ?next param provided, redirect there
 * 3. Otherwise look up profile username and redirect to /{username}
 * 4. If no profile found (invite-only), sign out + redirect to login with error
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const next = safeRedirectPath(url.searchParams.get('next'))

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', url.origin))
  }

  // If there's a specific destination, go there
  if (next !== '/') {
    return NextResponse.redirect(new URL(next, url.origin))
  }

  // Look up username for the default redirect
  // Cast needed — postgrest-js 2.99 + TS 5.9 infers .single() data as never
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single() as unknown as { data: { username: string } | null }

  if (!profile?.username) {
    // Authenticated but no profile — invite-only enforcement
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login?error=no_account', url.origin))
  }

  return NextResponse.redirect(new URL(`/${profile.username}`, url.origin))
}
