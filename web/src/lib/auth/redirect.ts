/**
 * Validates a redirect path to prevent open-redirect attacks.
 * Only allows relative paths starting with "/" (not "//").
 *
 * Used by: auth callback, login page, post-login route.
 * Single source of truth — do not duplicate this logic.
 */
export function safeRedirectPath(raw: string | null, fallback = '/'): string {
  if (!raw) return fallback
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw
  return fallback
}
