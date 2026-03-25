import { requireOwner } from '@/lib/auth/require'
import AdventureEditorForm from '@/components/adventures/AdventureEditorForm'

export default async function NewAdventurePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  await requireOwner(username)

  return <AdventureEditorForm username={username} />
}
