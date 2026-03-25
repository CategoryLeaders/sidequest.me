import { NextResponse } from 'next/server'
import { apiRequireAuth, isAuthError } from '@/lib/auth/require'

// Generate a cryptographically random API key and return its SHA-256 hash
async function generateKey(): Promise<{ rawKey: string; keyHash: string; keyPrefix: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const rawKey = 'sq_' + Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const encoder = new TextEncoder()
  const data = encoder.encode(rawKey)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const keyHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const keyPrefix = rawKey.slice(0, 10) // "sq_" + 7 hex chars

  return { rawKey, keyHash, keyPrefix }
}

// POST /api/api-keys — create a new key
export async function POST(request: Request) {
  const auth = await apiRequireAuth()
  if (isAuthError(auth)) return auth
  const { user, supabase } = auth

  const { label } = await request.json() as { label?: string }
  if (!label?.trim()) return NextResponse.json({ error: 'Label is required' }, { status: 400 })

  const { rawKey, keyHash, keyPrefix } = await generateKey()

  const { data, error } = await (supabase as any)
    .from('api_keys')
    .insert({ user_id: user.id, label: label.trim(), key_hash: keyHash, key_prefix: keyPrefix })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Return the raw key exactly once — never stored
  return NextResponse.json({
    id:     data.id,
    key:    rawKey,
    prefix: keyPrefix,
    label:  label.trim(),
  }, { status: 201 })
}
