import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { insertFeedEvent, deleteFeedEvent, type FeedVisibility } from '@/lib/feed-events'

// PATCH /api/questions/[id]
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('questions').select('profile_id, status, resolved').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.profile_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()

  // Validate length constraints
  if (body.question_text !== undefined && body.question_text.trim().length > 280) {
    return NextResponse.json({ error: 'Question text must be 280 characters or fewer' }, { status: 400 })
  }
  if (body.thinking !== undefined && body.thinking && body.thinking.trim().length > 1000) {
    return NextResponse.json({ error: 'Thinking must be 1000 characters or fewer' }, { status: 400 })
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of ['question_text', 'thinking', 'resolved', 'resolved_summary', 'tags', 'visibility', 'status', 'reactions_enabled', 'comments_enabled']) {
    if (body[key] !== undefined) update[key] = body[key]
  }

  const becomingPublished = body.status === 'published' && existing.status !== 'published'
  if (body.published_at !== undefined) update.published_at = body.published_at || null
  else if (becomingPublished) update.published_at = new Date().toISOString()
  if (existing.status === 'published') update.edited_at = new Date().toISOString()

  // Handle resolved state transition
  const becomingResolved = body.resolved === true && !existing.resolved
  if (becomingResolved) update.resolved_at = new Date().toISOString()
  if (body.resolved === false && existing.resolved) {
    update.resolved_at = null
    update.resolved_summary = null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('questions').update(update).eq('id', id).select('id, short_id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (becomingPublished) {
    try {
      await insertFeedEvent({ profileId: user.id, eventType: 'question_published', objectId: id, objectType: 'questions', visibility: (body.visibility ?? 'public') as FeedVisibility })
    } catch { /* non-blocking */ }
  } else if (body.status && body.status !== 'published' && existing.status === 'published') {
    try { await deleteFeedEvent(id, 'questions') } catch { /* non-blocking */ }
  }

  // If question was just resolved and is published, insert a resolution feed event
  if (becomingResolved && (existing.status === 'published' || becomingPublished)) {
    try {
      await insertFeedEvent({ profileId: user.id, eventType: 'question_resolved', objectId: id, objectType: 'questions', visibility: (body.visibility ?? 'public') as FeedVisibility })
    } catch { /* non-blocking */ }
  }

  return NextResponse.json(data)
}

// DELETE /api/questions/[id]
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('questions').select('profile_id').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.profile_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('questions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try { await deleteFeedEvent(id, 'questions') } catch { /* non-blocking */ }
  return NextResponse.json({ deleted: true })
}
