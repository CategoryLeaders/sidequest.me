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
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Use request.url origin — never trust x-forwarded-host
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(new URL('/auth/error', requestUrl.origin))
}
