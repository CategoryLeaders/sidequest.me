import { NextResponse } from 'next/server'
import { apiRequireAuth, isAuthError } from '@/lib/auth/require'
import { generateShortId } from '@/lib/thoughts-types'
import { insertFeedEvent, type FeedVisibility } from '@/lib/feed-events'

export async function GET() {
  const auth = await apiRequireAuth()
  if (isAuthError(auth)) return auth
  const { user, supabase } = auth

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('quotes').select('*').eq('profile_id', user.id).order('updated_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const auth = await apiRequireAuth()
  if (isAuthError(auth)) return auth
  const { user, supabase } = auth

  const body = await request.json()
  if (!body.quote_text?.trim()) return NextResponse.json({ error: 'Quote text is required' }, { status: 400 })
  if (!body.source_name?.trim()) return NextResponse.json({ error: 'Source name is required' }, { status: 400 })

  const status = body.status ?? 'draft'
  const now = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('quotes')
    .insert({
      profile_id: user.id,
      short_id: generateShortId(),
      quote_text: body.quote_text.trim(),
      source_name: body.source_name.trim(),
      source_work: body.source_work?.trim() || null,
      source_year: body.source_year || null,
      source_url: body.source_url?.trim() || null,
      commentary: body.commentary?.trim() || null,
      tags: body.tags ?? [],
      visibility: body.visibility ?? 'public',
      status,
      reactions_enabled: body.reactions_enabled ?? true,
      comments_enabled: body.comments_enabled ?? true,
      published_at: status === 'published' ? now : null,
    })
    .select('id, short_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (status === 'published' && data?.id) {
    try {
      await insertFeedEvent({ profileId: user.id, eventType: 'quote_published', objectId: data.id, objectType: 'quotes', visibility: (body.visibility ?? 'public') as FeedVisibility })
    } catch { /* non-blocking */ }
  }

  return NextResponse.json(data, { status: 201 })
}
