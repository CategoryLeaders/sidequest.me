/**
 * Site Tags — shared types and helpers.
 * [SQ.S-W-2603-0055]
 */

export interface SiteTag {
  label: string
  color: StickerColor
}

export type StickerColor =
  | 'sticker-orange'
  | 'sticker-green'
  | 'sticker-blue'
  | 'sticker-yellow'
  | 'sticker-lilac'
  | 'sticker-pink'

export const STICKER_COLORS: StickerColor[] = [
  'sticker-orange',
  'sticker-green',
  'sticker-blue',
  'sticker-yellow',
  'sticker-lilac',
  'sticker-pink',
]

export const STICKER_COLOR_LABELS: Record<StickerColor, string> = {
  'sticker-orange': 'Orange',
  'sticker-green':  'Green',
  'sticker-blue':   'Blue',
  'sticker-yellow': 'Yellow',
  'sticker-lilac':  'Lilac',
  'sticker-pink':   'Pink',
}

/** "Side Projects" → "side-projects" */
export function slugify(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
}

/** Find the tag whose slug matches the given slug. */
export function tagBySlug(tags: SiteTag[], slug: string): SiteTag | undefined {
  return tags.find((t) => slugify(t.label) === slug)
}

/** Default sticker tags — used when the profile has no site_tags set. */
export const DEFAULT_SITE_TAGS: SiteTag[] = [
  { label: 'Product',       color: 'sticker-orange' },
  { label: 'Marketing',     color: 'sticker-green'  },
  { label: 'Writing',       color: 'sticker-blue'   },
  { label: 'Cybersecurity', color: 'sticker-yellow' },
  { label: 'Side Projects', color: 'sticker-lilac'  },
]
