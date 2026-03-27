/**
 * Cookie domain for Supabase auth cookies.
 * In production, set to .sidequest.me to share the session across subdomains
 * (sidequest.me, my.sidequest.me, api.sidequest.me, etc.)
 * In development (localhost), leave undefined so the browser uses the default.
 */
export const COOKIE_DOMAIN: string | undefined =
  process.env.NODE_ENV === 'production' ? '.sidequest.me' : undefined
