import { NextResponse } from 'next/server'
import { apiRequireAuth, isAuthError } from '@/lib/auth/require'
import { insertFeedEvent, deleteFeedEvent, type FeedVisibility } from '@/lib/feed-events'

// PATCH /api/bookmarks/[id]
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await apiRequireAuth()
  if (isAuthError(auth)) return auth
  const { user, supabase } = auth

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('bookmarks').select('profile_id, status').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.profile_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of ['commentary', 'og_title', 'og_description', 'og_image_url', 'og_domain', 'og_favicon_url', 'tags', 'visibility', 'status', 'reactions_enabled', 'comments_enabled']) {
    if (body[key] !== undefined) update[key] = body[key]
  }

  const becomingPublished = body.status === 'published' && existing.status !== 'published'
  if (becomingPublished) update.published_at = new Date().toISOString()
  if (existing.status === 'published') update.edited_at = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('bookmarks').update(update).eq('id', id).select('id, short_id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (becomingPublished) {
    try {
      await insertFeedEvent({ profileId: user.id, eventType: 'bookmark_published', objectId: id, objectType: 'bookmarks', visibility: (body.visibility ?? 'public') as FeedVisibility })
    } catch { /* non-blocking */ }
  } else if (body.status && body.status !== 'published' && existing.status === 'published') {
    try { await deleteFeedEvent(id, 'bookmarks') } catch { /* non-blocking */ }
  }

  return NextResponse.json(data)
}

// DELETE /api/bookmarks/[id]
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await apiRequireAuth()
  if (isAuthError(auth)) return auth
  const { user, supabase } = auth

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('bookmarks').select('profile_id').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.profile_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('bookmarks').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try { await deleteFeedEvent(id, 'bookmarks') } catch { /* non-blocking */ }
  return NextResponse.json({ deleted: true })
}
