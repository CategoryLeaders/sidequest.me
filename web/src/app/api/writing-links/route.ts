import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PUT /api/writing-links
 * Sync writing links — replaces all links for a given writing.
 * Body: { writing_id: string, links: Array<{ entity_type: string, entity_id: string, is_primary?: boolean }> }
 */
export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    writing_id: string
    links: Array<{ entity_type: string; entity_id: string; is_primary?: boolean }>
  }

  if (!body.writing_id) {
    return NextResponse.json({ error: 'writing_id required' }, { status: 400 })
  }

  // Verify ownership
  const { data: writing } = await (supabase as any)
    .from('writings')
    .select('id, user_id')
    .eq('id', body.writing_id)
    .single() as { data: { id: string; user_id: string } | null }

  if (!writing || writing.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Delete existing links
  await (supabase as any)
    .from('writing_links')
    .delete()
    .eq('writing_id', body.writing_id)

  // Insert new links (if any)
  if (body.links.length > 0) {
    const rows = body.links.map((l) => ({
      writing_id: body.writing_id,
      entity_type: l.entity_type,
      entity_id: l.entity_id,
      is_primary: l.is_primary ?? false,
    }))

    const { error } = await (supabase as any)
      .from('writing_links')
      .insert(rows)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
