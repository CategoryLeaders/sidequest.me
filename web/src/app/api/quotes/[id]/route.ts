import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { insertFeedEvent, deleteFeedEvent, type FeedVisibility } from '@/lib/feed-events'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('quotes').select('profile_id, status').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.profile_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of ['quote_text', 'source_name', 'source_work', 'source_year', 'source_url', 'commentary', 'tags', 'visibility', 'status', 'reactions_enabled', 'comments_enabled']) {
    if (body[key] !== undefined) update[key] = body[key]
  }
  const becomingPublished = body.status === 'published' && existing.status !== 'published'
  if (body.published_at !== undefined) update.published_at = body.published_at || null
  else if (becomingPublished) update.published_at = new Date().toISOString()
  if (existing.status === 'published') update.edited_at = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('quotes').update(update).eq('id', id).select('id, short_id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (becomingPublished) {
    try { await insertFeedEvent({ profileId: user.id, eventType: 'quote_published', objectId: id, objectType: 'quotes', visibility: (body.visibility ?? 'public') as FeedVisibility }) } catch {}
  } else if (body.status && body.status !== 'published' && existing.status === 'published') {
    try { await deleteFeedEvent(id, 'quotes') } catch {}
  }

  return NextResponse.json(data)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('quotes').select('profile_id').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.profile_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('quotes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  try { await deleteFeedEvent(id, 'quotes') } catch {}
  return NextResponse.json({ deleted: true })
}
