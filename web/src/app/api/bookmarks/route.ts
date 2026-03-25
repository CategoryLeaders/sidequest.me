import { NextResponse } from 'next/server'
import { apiRequireAuth, isAuthError } from '@/lib/auth/require'
import { generateShortId } from '@/lib/thoughts-types'
import { insertFeedEvent, type FeedVisibility } from '@/lib/feed-events'

// GET /api/bookmarks — list current user's bookmarks
export async function GET() {
  const auth = await apiRequireAuth()
  if (isAuthError(auth)) return auth
  const { user, supabase } = auth

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('bookmarks')
    .select('*')
    .eq('profile_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/bookmarks — create a new bookmark
export async function POST(request: Request) {
  const auth = await apiRequireAuth()
  if (isAuthError(auth)) return auth
  const { user, supabase } = auth

  const body = await request.json()

  if (!body.url?.trim()) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  // Duplicate URL detection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('bookmarks')
    .select('id, short_id')
    .eq('profile_id', user.id)
    .eq('url', body.url.trim())
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'You already bookmarked this URL', existing_id: existing.short_id },
      { status: 409 }
    )
  }

  const status = body.status ?? 'draft'
  const now = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('bookmarks')
    .insert({
      profile_id: user.id,
      short_id: generateShortId(),
      url: body.url.trim(),
      commentary: body.commentary?.trim() || null,
      og_title: body.og_title || null,
      og_description: body.og_description || null,
      og_image_url: body.og_image_url || null,
      og_domain: body.og_domain || null,
      og_favicon_url: body.og_favicon_url || null,
      og_fetched_at: body.og_title ? now : null,
      tags: body.tags ?? [],
      visibility: body.visibility ?? 'public',
      status,
      reactions_enabled: body.reactions_enabled ?? true,
      comments_enabled: body.comments_enabled ?? true,
      published_at: status === 'published' ? now : null,
    })
    .select('id, short_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // feed_events on publish
  if (status === 'published' && data?.id) {
    try {
      await insertFeedEvent({
        profileId: user.id,
        eventType: 'bookmark_published',
        objectId: data.id,
        objectType: 'bookmarks',
        visibility: (body.visibility ?? 'public') as FeedVisibility,
      })
    } catch { /* non-blocking */ }
  }

  return NextResponse.json(data, { status: 201 })
}
