import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { MicroblogPost, MicroblogApiItem } from '@/lib/microblogs'

interface ApiKeyResult {
  user_id: string
  scope: { entity_type: string; entity_id: string } | null
}

async function resolveApiKey(
  authHeader: string | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
): Promise<ApiKeyResult | null> {
  if (!authHeader?.startsWith('Bearer ')) return null
  const rawKey = authHeader.slice(7)
  if (!rawKey) return null

  const encoder = new TextEncoder()
  const data = encoder.encode(rawKey)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const { data: keyRow } = await supabase
    .from('api_keys')
    .select('user_id, revoked_at, scope')
    .eq('key_hash', hashHex)
    .single()

  if (!keyRow || keyRow.revoked_at) return null
  return { user_id: keyRow.user_id as string, scope: keyRow.scope ?? null }
}

// GET api.sidequest.me/content/microblogs/[shortId]
// Supports shortId=latest to fetch most recent post
export async function GET(
  request: Request,
  { params }: { params: Promise<{ shortId: string }> },
) {
  const { shortId } = await params
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const username    = searchParams.get('username')
  const postType    = searchParams.get('post_type')  // optional filter for ?shortId=latest
  const fields      = (searchParams.get('fields') ?? '').split(',').map((f) => f.trim()).filter(Boolean)
  const includeBody = fields.includes('body')

  if (!username) {
    return NextResponse.json({ error: '?username is required' }, { status: 400 })
  }

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single() as { data: { id: string } | null }

  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const keyResult = await resolveApiKey(request.headers.get('authorization'), supabase)
  if (!keyResult) return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 })
  if (keyResult.user_id !== profile.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const selectFields = 'id, short_id, post_type, title, changelog_items, body, body_html, images, tags, published_at, location_name'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any
  if (shortId === 'latest') {
    query = (supabase as any)
      .from('microblog_posts')
      .select(selectFields)
      .eq('profile_id', profile.id)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .order('published_at', { ascending: false })
      .limit(1)

    if (postType && ['standard', 'changelog'].includes(postType)) {
      query = query.eq('post_type', postType)
    }

    query = query.single()
  } else {
    query = (supabase as any)
      .from('microblog_posts')
      .select(selectFields)
      .eq('profile_id', profile.id)
      .eq('short_id', shortId)
      .in('status', ['published', 'unlisted'])
      .eq('visibility', 'public')
      .single()
  }

  const { data: p, error } = await query as { data: Partial<MicroblogPost> | null; error: unknown }

  if (error || !p) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Scope enforcement: if the key is scoped, verify this post is linked to the scoped entity
  if (keyResult.scope) {
    const { data: link } = await (supabase as any)
      .from('microblog_links')
      .select('microblog_id')
      .eq('microblog_id', p.id)
      .eq('entity_type', keyResult.scope.entity_type)
      .eq('entity_id', keyResult.scope.entity_id)
      .limit(1)
      .maybeSingle() as { data: { microblog_id: string } | null }

    if (!link) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  const item: MicroblogApiItem = {
    id:              p.id!,
    short_id:        p.short_id!,
    post_type:       p.post_type!,
    title:           p.title ?? null,
    changelog_items: p.changelog_items ?? null,
    body:            p.body ?? '',
    tags:            p.tags ?? [],
    images:          p.images ?? [],
    published_at:    p.published_at!,
    location_name:   p.location_name ?? null,
    ...(includeBody ? { body_html: p.body_html ?? '' } : {}),
  }

  return NextResponse.json({ data: item }, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
