import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? ''

  // Route api.sidequest.me/* → /api/external/*
  // Matches both production (api.sidequest.me) and local dev (api.localhost:3000)
  if (hostname.startsWith('api.')) {
    const pathname = request.nextUrl.pathname
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = `/api/external${pathname}`
    return NextResponse.rewrite(rewriteUrl)
  }

  // Route my.sidequest.me/* → /dashboard/*
  // Matches both production (my.sidequest.me) and local dev (my.localhost:3000)
  // Skip rewrite for /api/* and /auth/* paths — those should resolve as-is.
  if (hostname.startsWith('my.')) {
    const pathname = request.nextUrl.pathname
    if (!pathname.startsWith('/api/') && !pathname.startsWith('/auth/')) {
      const rewriteUrl = request.nextUrl.clone()
      rewriteUrl.pathname = `/dashboard${pathname === '/' ? '' : pathname}`
      return updateSession(request, rewriteUrl)
    }
    return updateSession(request)
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}