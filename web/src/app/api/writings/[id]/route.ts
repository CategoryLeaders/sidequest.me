import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { slugifyTitle, uniqueSlug } from '@/lib/writings'
import type { Writing } from '@/lib/writings'

// PATCH /api/writings/[id] — update an existing writing
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership
  const { data: existing } = await (supabase as any)
    .from('writings')
    .select('id, slug, status, published_at, user_id')
    .eq('id', id)
    .single() as { data: Partial<Writing> | null }

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as {
    title?: string
    slug?: string
    body?: unknown
    body_html?: string
    word_count?: number
    tags?: string[]
    status?: string
    canonical_url?: string
    external_url?: string | null
    image_url?: string | null
  }

  // Re-slug if title or slug changed
  let slug = existing.slug!
  if (body.slug !== undefined || body.title !== undefined) {
    const rawSlug = body.slug?.trim()
      ? slugifyTitle(body.slug)
      : slugifyTitle(body.title ?? existing.slug!)
    slug = await uniqueSlug(rawSlug, user.id, id, supabase)
  }

  // Set published_at only on first publish
  const becomingPublished =
    body.status === 'published' && existing.status !== 'published'
  const published_at = becomingPublished
    ? new Date().toISOString()
    : (existing.published_at ?? null)

  const update: Record<string, unknown> = { slug, published_at }
  if (body.title      !== undefined) update.title      = body.title.trim()
  if (body.body       !== undefined) update.body       = body.body
  if (body.body_html  !== undefined) update.body_html  = body.body_html
  if (body.word_count !== undefined) update.word_count = body.word_count
  if (body.tags       !== undefined) update.tags       = body.tags
  if (body.status     !== undefined) update.status     = body.status
  if (body.canonical_url !== undefined) update.canonical_url = body.canonical_url
  if (body.external_url !== undefined) update.external_url = body.external_url
  if (body.image_url !== undefined) update.image_url = body.image_url

  const { data, error } = await (supabase as any)
    .from('writings')
    .update(update)
    .eq('id', id)
    .select('id, slug')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

// DELETE /api/writings/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await (supabase as any)
    .from('writings')
    .select('user_id')
    .eq('id', id)
    .single() as { data: { user_id: string } | null }

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await (supabase as any)
    .from('writings')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ deleted: true })
}
