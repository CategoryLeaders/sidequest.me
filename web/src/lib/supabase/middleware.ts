import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Path segments under /[username]/ that require authentication.
// Adding a new protected section = adding one string here.
const OWNER_ONLY_SEGMENTS = new Set(['settings', 'admin', 'publish'])

/**
 * Check if a pathname requires authentication.
 * Matches /[username]/settings/*, /[username]/admin/*, /[username]/publish/*.
 */
function isOwnerOnlyRoute(pathname: string): boolean {
  const parts = pathname.split('/').filter(Boolean)
  // Need at least /[username]/[segment]
  return parts.length >= 2 && OWNER_ONLY_SEGMENTS.has(parts[1])
}

// Auth routes — redirect to own profile if already logged in
const AUTH_ROUTES = ['/login', '/signup']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not add logic between createServerClient and getUser
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protect routes that require authentication
  if (isOwnerOnlyRoute(pathname) && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect already-authenticated users away from login/signup
  if (AUTH_ROUTES.includes(pathname) && user) {
    // Fetch username from profiles table to redirect to own profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()

    const target = profile?.username ? `/${profile.username}` : '/'
    return NextResponse.redirect(new URL(target, request.url))
  }

  return supabaseResponse
}
