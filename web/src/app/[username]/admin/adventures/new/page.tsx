import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdventureEditorForm from '@/components/adventures/AdventureEditorForm'

export default async function NewAdventurePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${username}`)

  return <AdventureEditorForm username={username} />
}
