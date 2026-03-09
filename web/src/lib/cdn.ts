/**
 * CDN configuration for external image hosting (Bunny.net).
 *
 * Set NEXT_PUBLIC_CDN_URL in your environment / Vercel project settings.
 * Falls back to local /photowall/ path for local dev with images present.
 *
 * Examples:
 *   NEXT_PUBLIC_CDN_URL=https://images.sidequest.me   (custom subdomain)
 *   NEXT_PUBLIC_CDN_URL=https://sidequest-photos.b-cdn.net  (Bunny default)
 */

const CDN_BASE = process.env.NEXT_PUBLIC_CDN_URL ?? "";

/**
 * Returns the full URL for a photowall image.
 *   - With CDN configured:  https://images.sidequest.me/photowall/17886292656384976.jpg
 *   - Without CDN (local):  /photowall/17886292656384976.jpg
 */
export function photowallUrl(filename: string): string {
  if (CDN_BASE) {
    return `${CDN_BASE}/photowall/${filename}`;
  }
  return `/photowall/${filename}`;
}
