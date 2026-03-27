import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DELETE /api/adventure-posts/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch with microblog_post_id so we can clean up dual-write
  const { data: existing } = await (supabase as any)
    .from('adventure_posts')
    .select('user_id, microblog_post_id')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Delete the adventure post (microblog_posts FK is ON DELETE SET NULL, so
  // we must delete the microblog row separately before or after)
  const { error } = await (supabase as any)
    .from('adventure_posts')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ── Also delete the linked microblog post (dual-write clean-up) ───────────
  if (existing.microblog_post_id) {
    await (supabase as any)
      .from('microblog_posts')
      .delete()
      .eq('id', existing.microblog_post_id)
      .eq('profile_id', user.id) // safety: only delete own posts
  }

  return NextResponse.json({ deleted: true })
}

// PATCH /api/adventure-posts/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch with microblog_post_id for dual-write sync
  const { data: existing } = await (supabase as any)
    .from('adventure_posts')
    .select('user_id, microblog_post_id')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const update: Record<string, unknown> = {}

  if (body.body !== undefined) update.body = body.body
  if (body.body_html !== undefined) update.body_html = body.body_html
  if (body.post_type !== undefined) update.post_type = body.post_type
  if (body.photos !== undefined) update.photos = body.photos
  if (body.location_name !== undefined) update.location_name = body.location_name
  if (body.location_lat !== undefined) update.location_lat = body.location_lat
  if (body.location_lng !== undefined) update.location_lng = body.location_lng
  if (body.chapter_index !== undefined) update.chapter_index = body.chapter_index
  if (body.posted_at !== undefined) update.posted_at = body.posted_at

  const { data, error } = await (supabase as any)
    .from('adventure_posts')
    .update(update)
    .eq('id', id)
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ── Sync changes to linked microblog post (dual-write) ────────────────────
  if (existing.microblog_post_id) {
    const mbUpdate: Record<string, unknown> = {}

    if (body.body !== undefined) mbUpdate.body = body.body
    if (body.body_html !== undefined) mbUpdate.body_html = body.body_html
    if (body.location_name !== undefined) mbUpdate.location_name = body.location_name
    if (body.chapter_index !== undefined) mbUpdate.chapter_index = body.chapter_index
    if (body.posted_at !== undefined) mbUpdate.published_at = body.posted_at

    // Sync photos → images (map to microblog image shape)
    if (body.photos !== undefined) {
      mbUpdate.images = (body.photos as { url: string; caption?: string }[]).map((p) => ({
        url: p.url,
        width: 0,
        height: 0,
        alt_text: p.caption ?? null,
      }))
    }

    if (Object.keys(mbUpdate).length > 0) {
      await (supabase as any)
        .from('microblog_posts')
        .update(mbUpdate)
        .eq('id', existing.microblog_post_id)
        .eq('profile_id', user.id) // safety
    }
  }

  return NextResponse.json(data)
}
