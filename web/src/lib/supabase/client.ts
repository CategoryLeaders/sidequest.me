import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { COOKIE_DOMAIN } from './config'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ...(COOKIE_DOMAIN ? [{ cookieOptions: { domain: COOKIE_DOMAIN } }] : [])
  )
}
