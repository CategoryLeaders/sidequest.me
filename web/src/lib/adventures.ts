/* ── Adventures ── */

export const LAYOUT_THEMES = ['journal', 'magazine', 'map', 'stream', 'dashboard'] as const
export type LayoutTheme = typeof LAYOUT_THEMES[number]

export const ADVENTURE_STATUSES = ['draft', 'upcoming', 'live', 'complete'] as const
export type AdventureStatus = typeof ADVENTURE_STATUSES[number]

export const POST_TYPES = ['micro', 'photo', 'checkin', 'article_link'] as const
export type PostType = typeof POST_TYPES[number]

export type LocationType = 'single' | 'multi'

export interface Waypoint {
  name: string
  lat?: number
  lng?: number
  arrival_date?: string    // ISO date
  departure_date?: string  // ISO date
}

export interface Adventure {
  id: string
  user_id: string
  title: string
  slug: string
  description: string | null
  cover_image_url: string | null
  layout_theme: LayoutTheme
  start_date: string | null
  end_date: string | null
  location_name: string | null
  location_lat: number | null
  location_lng: number | null
  location_type: LocationType
  route: Waypoint[]
  status: AdventureStatus
  chapters: Chapter[]
  itinerary: ItineraryItem[]
  sort_order: number
  featured: boolean
  created_at: string
  updated_at: string
}

export interface Chapter {
  title: string
  description?: string
}

export interface ItineraryItem {
  day: number
  label: string
  done: boolean
}

export interface AdventurePost {
  id: string
  adventure_id: string
  user_id: string
  post_type: PostType
  body: string | null
  body_html: string | null
  photos: PhotoItem[]
  location_name: string | null
  location_lat: number | null
  location_lng: number | null
  linked_writing_id: string | null
  chapter_index: number | null
  posted_at: string
  created_at: string
  updated_at: string
  sort_order: number
}

export interface PhotoItem {
  url: string
  caption?: string
  width?: number
  height?: number
  featured?: boolean
}

export const THEME_META: Record<LayoutTheme, { label: string; description: string; icon: string; bestFor: string }> = {
  journal: {
    label: 'Journal Timeline',
    description: 'Chronological feed with a vertical timeline. Posts appear in order with timestamps and location pins.',
    icon: '📓',
    bestFor: 'Travel diaries, festivals, multi-day events',
  },
  magazine: {
    label: 'Magazine',
    description: 'Curated editorial layout with chapters. Organise posts into narrative sections.',
    icon: '📰',
    bestFor: 'Polished stories, long trips with distinct phases',
  },
  map: {
    label: 'Map-First',
    description: 'Interactive map as the primary navigation. Each pin is a location with its own posts.',
    icon: '🗺️',
    bestFor: 'Road trips, motorcycle tours, sailing, multi-city travel',
  },
  stream: {
    label: 'Card Stream',
    description: 'Masonry/Pinterest-style card layout. Visual and scrollable with content-type filters.',
    icon: '🃏',
    bestFor: 'Conferences, expos, photo-heavy events',
  },
  dashboard: {
    label: 'Dashboard',
    description: 'Structured layout with sidebar widgets: stats, mini-map, itinerary. Professional feel.',
    icon: '📊',
    bestFor: 'Conferences, work trips, structured events',
  },
}

export const STATUS_META: Record<AdventureStatus, { label: string; colour: string }> = {
  draft: { label: 'Draft', colour: 'gray' },
  upcoming: { label: 'Upcoming', colour: 'gold' },
  live: { label: 'Live Now', colour: 'orange' },
  complete: { label: 'Complete', colour: 'green' },
}

export function slugifyAdventure(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}
