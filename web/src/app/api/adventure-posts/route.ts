import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateShortId } from '@/lib/microblogs'

// GET /api/adventure-posts?adventure_id=xxx
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const adventureId = searchParams.get('adventure_id')
  if (!adventureId) return NextResponse.json({ error: 'adventure_id required' }, { status: 400 })

  const { data, error } = await (supabase as any)
    .from('adventure_posts')
    .select('*')
    .eq('adventure_id', adventureId)
    .eq('user_id', user.id)
    .order('posted_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/adventure-posts
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as {
    adventure_id: string
    post_type?: string
    body?: string
    body_html?: string
    photos?: { url: string; caption?: string }[]
    location_name?: string
    location_lat?: number
    location_lng?: number
    linked_writing_id?: string
    chapter_index?: number
    posted_at?: string
  }

  if (!body.adventure_id) {
    return NextResponse.json({ error: 'adventure_id required' }, { status: 400 })
  }

  // Verify adventure ownership
  const { data: adventure } = await (supabase as any)
    .from('adventures')
    .select('id, user_id')
    .eq('id', body.adventure_id)
    .single()

  if (!adventure || adventure.user_id !== user.id) {
    return NextResponse.json({ error: 'Adventure not found' }, { status: 404 })
  }

  const postType = body.post_type || 'micro'
  const postedAt = body.posted_at || new Date().toISOString()
  const locationName = body.location_name?.trim() || null

  // ── For micro posts: dual-write to microblog_posts ──────────────────────
  let microblogPostId: string | null = null

  if (postType === 'micro') {
    // Map adventure photos → microblog images (dimensions unknown at post time)
    const microblogImages = (body.photos ?? []).map((p) => ({
      url: p.url,
      width: 0,
      height: 0,
      alt_text: p.caption ?? null,
    }))

    const { data: mbData, error: mbError } = await (supabase as any)
      .from('microblog_posts')
      .insert({
        profile_id: user.id,
        short_id: generateShortId(),
        body: body.body?.trim() || '',
        body_html: body.body_html || null,
        images: microblogImages,
        tags: [],
        visibility: 'public',
        status: 'published',
        reactions_enabled: true,
        comments_enabled: true,
        pinned: false,
        source: 'native',
        context_type: 'adventure',
        context_id: body.adventure_id,
        location_name: locationName,
        chapter_index: body.chapter_index ?? null,
        published_at: postedAt,
      })
      .select('id')
      .single()

    if (mbError) return NextResponse.json({ error: mbError.message }, { status: 500 })
    microblogPostId = mbData?.id ?? null
  }

  // ── Insert adventure_posts row ────────────────────────────────────────────
  const { data, error } = await (supabase as any)
    .from('adventure_posts')
    .insert({
      adventure_id: body.adventure_id,
      user_id: user.id,
      post_type: postType,
      body: body.body?.trim() || null,
      body_html: body.body_html || null,
      photos: body.photos || [],
      location_name: locationName,
      location_lat: body.location_lat ?? null,
      location_lng: body.location_lng ?? null,
      linked_writing_id: body.linked_writing_id || null,
      chapter_index: body.chapter_index ?? null,
      posted_at: postedAt,
      microblog_post_id: microblogPostId,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
