import { NextResponse } from 'next/server'
import { apiRequireAuth, isAuthError } from '@/lib/auth/require'

// GET /api/microblogs — list current user's microblogs
export async function GET() {
  const auth = await apiRequireAuth()
  if (isAuthError(auth)) return auth
  const { user, supabase } = auth

  const { data, error } = await (supabase as any)
    .from('microblogs')
    .select('*')
    .eq('user_id', user.id)
    .order('published_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/microblogs — create a new microblog
export async function POST(request: Request) {
  const auth = await apiRequireAuth()
  if (isAuthError(auth)) return auth
  const { user, supabase } = auth

  const body = await request.json() as {
    body: string
    body_html?: string
    media?: { url: string; type?: string; caption?: string }[]
    location_name?: string
    tags?: string[]
    status?: string
    published_at?: string
    links?: { entity_type: string; entity_id: string }[]
  }

  if (!body.body?.trim()) {
    return NextResponse.json({ error: 'Body is required' }, { status: 400 })
  }

  const { data, error } = await (supabase as any)
    .from('microblogs')
    .insert({
      user_id: user.id,
      body: body.body.trim(),
      body_html: body.body_html || null,
      media: body.media || [],
      location_name: body.location_name?.trim() || null,
      tags: body.tags || [],
      status: body.status || 'published',
      published_at: body.published_at || new Date().toISOString(),
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
