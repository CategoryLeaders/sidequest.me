import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require authentication (regex patterns)
const PROTECTED_PATTERNS = [
  /^\/[^/]+\/settings(\/.*)?$/,  // /[username]/settings/*
  /^\/dashboard(?!\/login).*$/,  // /dashboard/* EXCEPT /dashboard/login
]

// Auth routes — redirect to own profile if already logged in
const AUTH_ROUTES = ['/login', '/signup']

/**
 * Update Supabase auth session and handle route protection.
 * @param request  The incoming request
 * @param rewriteUrl  Optional URL to rewrite to (e.g. for subdomain routing)
 */
export async function updateSession(request: NextRequest, rewriteUrl?: URL) {
  let supabaseResponse = rewriteUrl
    ? NextResponse.rewrite(rewriteUrl, { request })
    : NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = rewriteUrl
            ? NextResponse.rewrite(rewriteUrl, { request })
            : NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not add logic between createServerClient and getUser
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = rewriteUrl?.pathname ?? request.nextUrl.pathname

  // Protect routes that require authentication
  const isProtected = PROTECTED_PATTERNS.some(p => p.test(pathname))
  if (isProtected && !user) {
    // For dashboard routes, redirect to the dashboard login page
    if (pathname.startsWith('/dashboard')) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/dashboard/login'
      return NextResponse.rewrite(loginUrl, { request })
    }
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect already-authenticated users away from login/signup
  if (AUTH_ROUTES.includes(request.nextUrl.pathname) && user) {
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
