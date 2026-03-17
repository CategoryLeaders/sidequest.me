import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdventureEditorForm from '@/components/adventures/AdventureEditorForm'
import type { Adventure } from '@/lib/adventures'

export default async function EditAdventurePage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>
}) {
  const { username, slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${username}`)

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id, username')
    .eq('username', username)
    .single() as { data: { id: string; username: string } | null }

  if (!profile) notFound()
  if (profile.id !== user.id) redirect(`/${username}`)

  const { data: adventure } = await (supabase as any)
    .from('adventures')
    .select('*')
    .eq('user_id', profile.id)
    .eq('slug', slug)
    .single() as { data: Adventure | null }

  if (!adventure) notFound()

  return <AdventureEditorForm username={username} adventure={adventure} />
}
