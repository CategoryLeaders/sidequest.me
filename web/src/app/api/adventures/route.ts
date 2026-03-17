import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { slugifyAdventure } from '@/lib/adventures'
import type { LayoutTheme, AdventureStatus, Chapter, ItineraryItem } from '@/lib/adventures'

// GET /api/adventures — list user's adventures
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await (supabase as any)
    .from('adventures')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/adventures — create a new adventure
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as {
    title: string
    slug?: string
    description?: string
    cover_image_url?: string
    layout_theme?: LayoutTheme
    start_date?: string
    end_date?: string
    location_name?: string
    location_lat?: number
    location_lng?: number
    status?: AdventureStatus
    chapters?: Chapter[]
    itinerary?: ItineraryItem[]
  }

  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const slug = body.slug?.trim()
    ? slugifyAdventure(body.slug)
    : slugifyAdventure(body.title)

  const { data, error } = await (supabase as any)
    .from('adventures')
    .insert({
      user_id: user.id,
      title: body.title.trim(),
      slug,
      description: body.description?.trim() || null,
      cover_image_url: body.cover_image_url || null,
      layout_theme: body.layout_theme || 'journal',
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      location_name: body.location_name?.trim() || null,
      location_lat: body.location_lat ?? null,
      location_lng: body.location_lng ?? null,
      status: body.status || 'draft',
      chapters: body.chapters || [],
      itinerary: body.itinerary || [],
    })
    .select('id, slug')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
