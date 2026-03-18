import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { slugifyTitle, uniqueSlug } from '@/lib/writings'

// GET /api/writings — list current user's writings
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await (supabase as any)
    .from('writings')
    .select('id, title, slug, status, tags, word_count, published_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/writings — create a new writing
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as {
    title: string
    slug?: string
    body?: unknown
    body_html?: string
    word_count?: number
    tags?: string[]
    status?: string
    canonical_url?: string
    external_url?: string | null
    image_url?: string | null
    published_at?: string | null
  }

  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const baseSlug = body.slug?.trim()
    ? slugifyTitle(body.slug)
    : slugifyTitle(body.title)

  const slug = await uniqueSlug(baseSlug, user.id, null, supabase)

  const { data, error } = await (supabase as any)
    .from('writings')
    .insert({
      user_id:    user.id,
      title:      body.title.trim(),
      slug,
      body:       body.body ?? null,
      body_html:  body.body_html ?? null,
      word_count: body.word_count ?? 0,
      tags:       body.tags ?? [],
      status:     body.status ?? 'draft',
      canonical_url: body.canonical_url ?? null,
      external_url: body.external_url ?? null,
      image_url: body.image_url ?? null,
      published_at: body.published_at ?? (body.status === 'published' ? new Date().toISOString() : null),
    })
    .select('id, slug')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
