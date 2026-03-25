import { NextResponse } from 'next/server'
import { apiRequireAuth, isAuthError } from '@/lib/auth/require'

// DELETE /api/api-keys/[id] — revoke (soft delete)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const auth = await apiRequireAuth()
  if (isAuthError(auth)) return auth
  const { user, supabase } = auth

  // Verify ownership
  const { data: existing } = await (supabase as any)
    .from('api_keys')
    .select('user_id')
    .eq('id', id)
    .single() as { data: { user_id: string } | null }

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await (supabase as any)
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ revoked: true })
}
