import { NextResponse } from 'next/server'
import { apiRequireAuth, isAuthError } from '@/lib/auth/require'

// DELETE /api/adventure-posts/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const auth = await apiRequireAuth()
  if (isAuthError(auth)) return auth
  const { user, supabase } = auth

  const { data: existing } = await (supabase as any)
    .from('adventure_posts')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await (supabase as any)
    .from('adventure_posts')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}

// PATCH /api/adventure-posts/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const auth = await apiRequireAuth()
  if (isAuthError(auth)) return auth
  const { user, supabase } = auth

  const { data: existing } = await (supabase as any)
    .from('adventure_posts')
    .select('user_id')
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
  return NextResponse.json(data)
}
