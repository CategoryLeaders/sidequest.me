import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/microblogs — list current user's microblogs
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await (supabase as any)
    .from('microblog_posts')
    .select('*')
    .eq('profile_id', user.id)
    .order('published_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/microblogs — create a new microblog
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as {
    post_type?: string
    title?: string
    changelog_items?: { text: string; image?: { url: string; storage_path?: string } }[]
    body?: string
    body_html?: string
    media?: { url: string; type?: string; caption?: string }[]
    location_name?: string
    tags?: string[]
    status?: string
    published_at?: string
    links?: { entity_type: string; entity_id: string }[]
    context_type?: string
    context_id?: string
  }

  const postType = body.post_type || 'standard'

  if (postType === 'changelog') {
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required for changelog posts' }, { status: 400 })
    }
    if (!body.changelog_items || body.changelog_items.length === 0) {
      return NextResponse.json({ error: 'At least one change item is required' }, { status: 400 })
    }
  } else {
    if (!body.body?.trim()) {
      return NextResponse.json({ error: 'Body is required' }, { status: 400 })
    }
  }

  // Build plain-text body from changelog items for search/fallback
  const bodyText = postType === 'changelog'
    ? `${body.title}\n\n${(body.changelog_items || []).map(i => `• ${i.text}`).join('\n')}`
    : (body.body || '').trim()

  const { data, error } = await (supabase as any)
    .from('microblog_posts')
    .insert({
      profile_id: user.id,
      post_type: postType,
      title: body.title?.trim() || null,
      changelog_items: body.changelog_items || null,
      body: bodyText,
      body_html: body.body_html || null,
      images: body.media || [],
      location_name: body.location_name?.trim() || null,
      tags: body.tags || [],
      status: body.status || 'published',
      published_at: body.published_at || new Date().toISOString(),
      context_type: body.context_type || null,
      context_id: body.context_id || null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create entity links
  if (body.links && body.links.length > 0 && data?.id) {
    const linkRows = body.links.map((l) => ({
      microblog_id: data.id,
      entity_type: l.entity_type,
      entity_id: l.entity_id,
    }))
    await (supabase as any).from('microblog_links').insert(linkRows)
  }

  return NextResponse.json(data, { status: 201 })
}
