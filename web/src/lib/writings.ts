import type { JSONContent } from '@tiptap/core'

// ─── Types ───────────────────────────────────────────────────────────────────

export type WritingStatus = 'draft' | 'scheduled' | 'published' | 'unlisted'

export interface Writing {
  id: string
  user_id: string
  title: string
  slug: string
  body: JSONContent | null
  body_html: string | null
  tags: string[]
  status: WritingStatus
  published_at: string | null
  scheduled_at: string | null
  word_count: number
  canonical_url: string | null
  external_url: string | null
  image_url: string | null
  in_series_nav: boolean
  series_id: string | null
  series_position: number | null
  created_at: string
  updated_at: string
}

export interface WritingSeries {
  id: string
  user_id: string
  title: string
  slug: string
  created_at: string
}

export interface ApiKey {
  id: string
  user_id: string
  label: string
  key_prefix: string
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
}

// API response shape for the external /content/writings endpoint
export interface WritingApiItem {
  id: string
  title: string
  slug: string
  tags: string[]
  published_at: string
  word_count: number
  excerpt: string
  body_html?: string // only included when ?fields=body
}

export interface WritingApiMeta {
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface WritingApiResponse {
  data: WritingApiItem[]
  meta: WritingApiMeta
}

// ─── Slug ────────────────────────────────────────────────────────────────────

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

// Ensure slug is unique within a user's writings.
// Returns the base slug if available, otherwise appends -2, -3, etc.
export async function uniqueSlug(
  baseSlug: string,
  userId: string,
  excludeId: string | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
): Promise<string> {
  let candidate = baseSlug
  let n = 1
  for (;;) {
    let q = supabase
      .from('writings')
      .select('id')
      .eq('user_id', userId)
      .eq('slug', candidate)
    if (excludeId) q = q.neq('id', excludeId)
    const { data } = await q.maybeSingle()
    if (!data) return candidate
    n++
    candidate = `${baseSlug}-${n}`
  }
}

// ─── Excerpt ─────────────────────────────────────────────────────────────────

export function excerptFromHtml(html: string, maxLength = 200): string {
  // Strip tags, collapse whitespace, trim
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= maxLength) return text
  const cut = text.lastIndexOf(' ', maxLength)
  return text.slice(0, cut > 0 ? cut : maxLength) + '…'
}

// ─── Word count ───────────────────────────────────────────────────────────────

export function wordCountFromHtml(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return 0
  return text.split(' ').length
}

// ─── Read time ────────────────────────────────────────────────────────────────

export function readTimeMinutes(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 200))
}
