import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  MicroblogPost,
  MicroblogApiItem,
  MicroblogApiResponse,
} from '@/lib/microblogs'

const PER_PAGE_DEFAULT = 20
const PER_PAGE_MAX     = 100

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

  // Touch last_used_at (fire-and-forget)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', hashHex)
    .then(() => {})

  return { user_id: keyRow.user_id as string, scope: keyRow.scope ?? null }
}

// GET api.sidequest.me/content/microblogs
// (internally: /api/external/content/microblogs)
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const username  = searchParams.get('username')
  const tag       = searchParams.get('tag')
  const company   = searchParams.get('company')    // company slug filter
  const postType  = searchParams.get('post_type')   // 'standard' | 'changelog' | null (all)
  const status    = searchParams.get('status') ?? 'published'
  const page      = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const perPage   = Math.min(PER_PAGE_MAX,
    Math.max(1, parseInt(searchParams.get('per_page') ?? String(PER_PAGE_DEFAULT), 10)))
  const fields    = (searchParams.get('fields') ?? '').split(',').map((f) => f.trim()).filter(Boolean)
  const includeBody = fields.includes('body')

  if (!username) {
    return NextResponse.json({ error: '?username is required' }, { status: 400 })
  }

  // Resolve profile
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single() as { data: { id: string } | null }

  if (!profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Validate API key
  const keyResult = await resolveApiKey(request.headers.get('authorization'), supabase)
  if (!keyResult) {
    return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 })
  }
  if (keyResult.user_id !== profile.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Validate status param
  const allowedStatuses = ['published', 'unlisted', 'all']
  if (!allowedStatuses.includes(status)) {
    return NextResponse.json({ error: `?status must be one of: ${allowedStatuses.join(', ')}` }, { status: 400 })
  }

  // Validate post_type param
  if (postType && !['standard', 'changelog'].includes(postType)) {
    return NextResponse.json({ error: '?post_type must be "standard" or "changelog"' }, { status: 400 })
  }

  // ── Scope enforcement ──
  // If the API key has a scope, only return microblogs linked to that entity.
  let scopedMicroblogIds: string[] | null = null

  let entityFilter: { entity_type: string; entity_id: string } | null = keyResult.scope

  if (!entityFilter && company) {
    const { data: companyRow } = await (supabase as any)
      .from('companies')
      .select('id')
      .eq('user_id', profile.id)
      .eq('slug', company)
      .single() as { data: { id: string } | null }

    if (!companyRow) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }
    entityFilter = { entity_type: 'company', entity_id: companyRow.id }
  }

  if (entityFilter) {
    const { data: links } = await (supabase as any)
      .from('microblog_links')
      .select('microblog_id')
      .eq('entity_type', entityFilter.entity_type)
      .eq('entity_id', entityFilter.entity_id) as { data: Array<{ microblog_id: string }> | null }

    scopedMicroblogIds = (links ?? []).map((l) => l.microblog_id)

    if (scopedMicroblogIds.length === 0) {
      return NextResponse.json({
        data: [],
        meta: { total: 0, page, per_page: perPage, total_pages: 0 },
      } satisfies MicroblogApiResponse, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }
  }

  // Build query
  const selectFields = 'id, short_id, post_type, title, changelog_items, body, body_html, images, tags, published_at, location_name'

  let query = (supabase as any)
    .from('microblog_posts')
    .select(selectFields, { count: 'exact' })
    .eq('profile_id', profile.id)
    .eq('visibility', 'public')
    .order('published_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)

  if (status === 'published') {
    query = query.eq('status', 'published')
  } else if (status === 'unlisted') {
    query = query.in('status', ['published', 'unlisted'])
  }
  // 'all' → no status filter beyond visibility=public

  if (postType) query = query.eq('post_type', postType)
  if (scopedMicroblogIds) query = query.in('id', scopedMicroblogIds)
  if (tag) query = query.contains('tags', [tag])

  const { data: posts, count, error } = await query as {
    data: Partial<MicroblogPost>[] | null
    count: number | null
    error: unknown
  }

  if (error) return NextResponse.json({ error: 'Query failed' }, { status: 500 })

  const rows = posts ?? []
  const total = count ?? 0

  const items: MicroblogApiItem[] = rows.map((p) => ({
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
  }))

  const response: MicroblogApiResponse = {
    data: items,
    meta: {
      total,
      page,
      per_page:    perPage,
      total_pages: Math.ceil(total / perPage),
    },
  }

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
