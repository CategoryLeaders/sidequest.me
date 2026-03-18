/**
 * Site Tags — shared types and helpers.
 * [SQ.S-W-2603-0055]
 */

export type TagShape = 'sticker' | 'pill' | 'square' | 'outline' | 'hashtag' | 'underline'

export const TAG_SHAPES: TagShape[] = ['sticker', 'pill', 'square', 'outline', 'hashtag', 'underline']

export const TAG_SHAPE_LABELS: Record<TagShape, string> = {
  sticker:   'Sticker',
  pill:      'Pill',
  square:    'Square',
  outline:   'Outline',
  hashtag:   'Hashtag',
  underline: 'Underline',
}

/** Sticker-specific shape for the background form. Only applies when shape='sticker'. */
export type StickerForm = 'rectangle' | 'rounded' | 'circle' | 'diamond' | 'star' | 'banner' | 'torn'

export const STICKER_FORMS: StickerForm[] = ['rectangle', 'rounded', 'circle', 'diamond', 'star', 'banner', 'torn']

export const STICKER_FORM_LABELS: Record<StickerForm, string> = {
  rectangle: 'Rectangle',
  rounded:   'Rounded',
  circle:    'Circle',
  diamond:   'Diamond',
  star:      'Star',
  banner:    'Banner',
  torn:      'Torn Edge',
}

/** Texture/effect applied to the sticker. */
export type StickerTexture = 'flat' | 'tape' | 'shadow' | 'glossy' | 'matte'

export const STICKER_TEXTURES: StickerTexture[] = ['flat', 'tape', 'shadow', 'glossy', 'matte']

export const STICKER_TEXTURE_LABELS: Record<StickerTexture, string> = {
  flat:   'Flat',
  tape:   'Tape',
  shadow: 'Shadow',
  glossy: 'Glossy',
  matte:  'Matte',
}

export interface SiteTag {
  label: string
  color: StickerColor
  icon?: string            // emoji icon (e.g. '⛵', '🏳️‍⚧️', '💼')
  shape?: TagShape         // visual shape — defaults to 'sticker' if unset
  stickerForm?: StickerForm   // sticker background shape (only when shape='sticker')
  stickerTexture?: StickerTexture  // sticker texture/effect
  rotation?: number        // tilt in degrees (e.g. -3, 2, 0). null/0 = no tilt
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

/** Maximum number of tags a profile can define. */
export const MAX_SITE_TAGS = 50

// ─── Display settings ────────────────────────────────────────────────────────

export type SiteTagsDisplayMode = 'preference' | 'volume' | 'random'

export interface SiteTagsDisplay {
  /** How to order tags on the profile home page. */
  mode: SiteTagsDisplayMode
  /** How many tags to show. 0 = show all. */
  limit: number
}

export const DEFAULT_SITE_TAGS_DISPLAY: SiteTagsDisplay = {
  mode: 'preference',
  limit: 0,
}

/**
 * Apply display settings to a tag array.
 * - 'preference': keep stored order (already sorted by user)
 * - 'volume':     sort descending by photo count (pass volumeMap)
 * - 'random':     Fisher-Yates shuffle
 * Then trim to `display.limit` (0 = no trim).
 */
export function applyDisplaySettings(
  tags: SiteTag[],
  display: SiteTagsDisplay,
  volumeMap?: Record<string, number>,
): SiteTag[] {
  let result = [...tags]

  if (display.mode === 'volume' && volumeMap) {
    result.sort((a, b) => (volumeMap[b.label] ?? 0) - (volumeMap[a.label] ?? 0))
  } else if (display.mode === 'random') {
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
  }
  // 'preference' keeps the stored array order

  const limit = display.limit
  if (limit > 0 && result.length > limit) {
    result = result.slice(0, limit)
  }

  return result
}
