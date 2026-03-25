import { notFound } from 'next/navigation'
import { requireOwner } from '@/lib/auth/require'
import { createClient } from '@/lib/supabase/server'
import AdventureEditorForm from '@/components/adventures/AdventureEditorForm'
import type { Adventure } from '@/lib/adventures'

export default async function EditAdventurePage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>
}) {
  const { username, slug } = await params
  const { profile } = await requireOwner(username)

  const supabase = await createClient()
  const { data: adventure } = await (supabase as any)
    .from('adventures')
    .select('*')
    .eq('user_id', profile.id)
    .eq('slug', slug)
    .single() as { data: Adventure | null }

  if (!adventure) notFound()

  return <AdventureEditorForm username={username} adventure={adventure} />
}
