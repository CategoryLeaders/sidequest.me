import { NextResponse } from 'next/server'
import { apiRequireAuth, isAuthError } from '@/lib/auth/require'
import { slugifyAdventure } from '@/lib/adventures'
import type { LayoutTheme, AdventureStatus, Chapter, ItineraryItem, LocationType, Waypoint } from '@/lib/adventures'

// PATCH /api/adventures/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const auth = await apiRequireAuth()
  if (isAuthError(auth)) return auth
  const { user, supabase } = auth

  // Verify ownership
  const { data: existing } = await (supabase as any)
    .from('adventures')
    .select('id, user_id, slug')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as {
    title?: string
    slug?: string
    description?: string | null
    cover_image_url?: string | null
    layout_theme?: LayoutTheme
    start_date?: string | null
    end_date?: string | null
    location_name?: string | null
    location_lat?: number | null
    location_lng?: number | null
    location_type?: LocationType
    route?: Waypoint[]
    status?: AdventureStatus
    chapters?: Chapter[]
    itinerary?: ItineraryItem[]
    sort_order?: number
    featured?: boolean
  }

  const update: Record<string, unknown> = {}

  if (body.title !== undefined) {
    update.title = body.title.trim()
    // Auto-update slug if title changed and no explicit slug provided
    if (body.slug === undefined) {
      update.slug = slugifyAdventure(body.title)
    }
  }
  if (body.slug !== undefined) update.slug = slugifyAdventure(body.slug)
  if (body.description !== undefined) update.description = body.description
  if (body.cover_image_url !== undefined) update.cover_image_url = body.cover_image_url
  if (body.layout_theme !== undefined) update.layout_theme = body.layout_theme
  if (body.start_date !== undefined) update.start_date = body.start_date
  if (body.end_date !== undefined) update.end_date = body.end_date
  if (body.location_name !== undefined) update.location_name = body.location_name
  if (body.location_lat !== undefined) update.location_lat = body.location_lat
  if (body.location_lng !== undefined) update.location_lng = body.location_lng
  if (body.location_type !== undefined) update.location_type = body.location_type
  if (body.route !== undefined) update.route = body.route
  if (body.status !== undefined) update.status = body.status
  if (body.chapters !== undefined) update.chapters = body.chapters
  if (body.itinerary !== undefined) update.itinerary = body.itinerary
  if (body.sort_order !== undefined) update.sort_order = body.sort_order
  if (body.featured !== undefined) update.featured = body.featured

  const { data, error } = await (supabase as any)
    .from('adventures')
    .update(update)
    .eq('id', id)
    .select('id, slug')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/adventures/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const auth = await apiRequireAuth()
  if (isAuthError(auth)) return auth
  const { user, supabase } = auth

  const { data: existing } = await (supabase as any)
    .from('adventures')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await (supabase as any)
    .from('adventures')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
