import { NextResponse } from 'next/server'
import { apiRequireAuth, isAuthError } from '@/lib/auth/require'

// GET /api/adventure-posts?adventure_id=xxx
export async function GET(request: Request) {
  const auth = await apiRequireAuth()
  if (isAuthError(auth)) return auth
  const { user, supabase } = auth

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
  const auth = await apiRequireAuth()
  if (isAuthError(auth)) return auth
  const { user, supabase } = auth

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

  const { data, error } = await (supabase as any)
    .from('adventure_posts')
    .insert({
      adventure_id: body.adventure_id,
      user_id: user.id,
      post_type: body.post_type || 'micro',
      body: body.body?.trim() || null,
      body_html: body.body_html || null,
      photos: body.photos || [],
      location_name: body.location_name?.trim() || null,
      location_lat: body.location_lat ?? null,
      location_lng: body.location_lng ?? null,
      linked_writing_id: body.linked_writing_id || null,
      chapter_index: body.chapter_index ?? null,
      posted_at: body.posted_at || new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
