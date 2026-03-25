import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { getCurrentUser, getProfileByUsername, type Profile } from '@/lib/profiles'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Server Component Guards (use redirect() on failure)
// ---------------------------------------------------------------------------

/**
 * Require authentication in a server component.
 * Redirects to /login if not authenticated.
 *
 * @param returnTo - optional path to redirect back to after login
 * @returns the authenticated User
 */
export async function requireAuth(returnTo?: string): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    const loginUrl = returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : '/login'
    redirect(loginUrl)
  }
  return user
}

/**
 * Require authentication AND ownership in a server component.
 * - Redirects to /login if not authenticated
 * - Returns notFound() if profile doesn't exist
 * - Redirects to the profile's public page if authenticated but not the owner
 *
 * @param username - the username from the URL params
 * @returns { user, profile } for the authenticated owner
 */
export async function requireOwner(username: string): Promise<{ user: User; profile: Profile }> {
  const [user, profile] = await Promise.all([
    getCurrentUser(),
    getProfileByUsername(username),
  ])

  if (!profile) notFound()

  if (!user) {
    redirect(`/login?next=/${username}`)
  }

  if (user.id !== profile.id) {
    redirect(`/${username}`)
  }

  return { user, profile }
}

// ---------------------------------------------------------------------------
// API Route Guards (return NextResponse on failure)
// ---------------------------------------------------------------------------

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

type ApiAuthSuccess = {
  user: User
  supabase: SupabaseServerClient
}

export type ApiAuthResult = ApiAuthSuccess | NextResponse

/**
 * Type guard to check if apiRequireAuth returned an error response.
 */
export function isAuthError(result: ApiAuthResult): result is NextResponse {
  return result instanceof NextResponse
}

/**
 * Require authentication in an API route handler.
 * Returns { user, supabase } on success, or a 401 NextResponse on failure.
 *
 * Usage:
 *   const auth = await apiRequireAuth()
 *   if (isAuthError(auth)) return auth
 *   const { user, supabase } = auth
 */
export async function apiRequireAuth(): Promise<ApiAuthResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return { user, supabase }
}
