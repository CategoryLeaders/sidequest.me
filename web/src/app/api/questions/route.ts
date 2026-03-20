import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateShortId } from '@/lib/thoughts-types'
import { insertFeedEvent, type FeedVisibility } from '@/lib/feed-events'

// GET /api/questions — list current user's questions
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('questions')
    .select('*')
    .eq('profile_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/questions — create a new question
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  if (!body.question_text?.trim()) {
    return NextResponse.json({ error: 'Question text is required' }, { status: 400 })
  }
  if (body.question_text.trim().length > 280) {
    return NextResponse.json({ error: 'Question text must be 280 characters or fewer' }, { status: 400 })
  }
  if (body.thinking && body.thinking.trim().length > 1000) {
    return NextResponse.json({ error: 'Thinking must be 1000 characters or fewer' }, { status: 400 })
  }

  const status = body.status ?? 'draft'
  const now = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('questions')
    .insert({
      profile_id: user.id,
      short_id: generateShortId(),
      question_text: body.question_text.trim(),
      thinking: body.thinking?.trim() || null,
      resolved: false,
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
      await insertFeedEvent({
        profileId: user.id,
        eventType: 'question_published',
        objectId: data.id,
        objectType: 'questions',
        visibility: (body.visibility ?? 'public') as FeedVisibility,
      })
    } catch { /* non-blocking */ }
  }

  return NextResponse.json(data, { status: 201 })
}
