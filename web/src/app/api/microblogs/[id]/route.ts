import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateFeedVisibility, deleteFeedEvent } from '@/lib/feed-events'

// PATCH /api/microblogs/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await (supabase as any)
    .from('microblog_posts')
    .select('profile_id')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.profile_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const update: Record<string, unknown> = {}

  if (body.post_type !== undefined) update.post_type = body.post_type
  if (body.title !== undefined) update.title = body.title || null
  if (body.changelog_items !== undefined) {
    update.changelog_items = body.changelog_items || null
    // Rebuild plain-text body from changelog items
    if (body.changelog_items && body.post_type === 'changelog') {
      update.body = `${body.title || ''}\n\n${body.changelog_items.map((i: { text: string }) => `• ${i.text}`).join('\n')}`
    }
  }
  if (body.body !== undefined) update.body = body.body
  if (body.body_html !== undefined) update.body_html = body.body_html
  if (body.media !== undefined) update.images = body.media
  if (body.location_name !== undefined) update.location_name = body.location_name
  if (body.link_url !== undefined) update.link_url = body.link_url
  if (body.tags !== undefined) update.tags = body.tags
  if (body.visibility !== undefined) update.visibility = body.visibility
  if (body.status !== undefined) update.status = body.status
  if (body.paired_writing_id !== undefined) update.paired_writing_id = body.paired_writing_id || null
  if (body.published_at !== undefined) update.published_at = body.published_at || null

  const { data, error } = await (supabase as any)
    .from('microblog_posts')
    .update(update)
    .eq('id', id)
    .select('id')
    .single()

  // Update links if provided
  if (body.links !== undefined) {
    await (supabase as any).from('microblog_links').delete().eq('microblog_id', id)
    if (body.links.length > 0) {
      const linkRows = body.links.map((l: { entity_type: string; entity_id: string }) => ({
        microblog_id: id,
        entity_type: l.entity_type,
        entity_id: l.entity_id,
      }))
      await (supabase as any).from('microblog_links').insert(linkRows)
    }
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sync visibility to feed_events if changed
  if (body.visibility !== undefined) {
    try {
      await updateFeedVisibility(id, 'microblog_posts', body.visibility)
    } catch (feedErr) {
      console.error('[microblogs] feed_event visibility update failed:', feedErr)
    }
  }

  return NextResponse.json(data)
}

// DELETE /api/microblogs/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await (supabase as any)
    .from('microblog_posts')
    .select('profile_id')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.profile_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await (supabase as any).from('microblog_posts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Remove from feed_events
  try {
    await deleteFeedEvent(id, 'microblog_posts')
  } catch (feedErr) {
    console.error('[microblogs] feed_event delete failed:', feedErr)
  }

  return NextResponse.json({ deleted: true })
}
