import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import WritingEditorForm from '@/components/writings/WritingEditorForm'
import { DEFAULT_SITE_TAGS } from '@/lib/tags'
import { getCompaniesForUser } from '@/lib/companies'
import { getProjectsForUser } from '@/lib/projects-data'
import { getAllCrowdfundingProjects } from '@/lib/crowdfunding'
import type { LikeDislike } from '@/types/profile-extras'

export default async function NewWritingPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${username}`)

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id, username, site_tags, likes, dislikes')
    .eq('username', username)
    .single() as { data: { id: string; username: string; site_tags: unknown; likes: unknown; dislikes: unknown } | null }

  if (!profile) notFound()
  if (profile.id !== user.id) redirect(`/${username}`)

  const siteTags = ((profile as any).site_tags ?? DEFAULT_SITE_TAGS) as Array<{ label: string }>
  const tagLabels = siteTags.map((t) => t.label)

  // Fetch linkable entities
  const [companies, projects, crowdfundingProjects] = await Promise.all([
    getCompaniesForUser(profile.id),
    getProjectsForUser(profile.id),
    getAllCrowdfundingProjects(profile.id),
  ])

  const likes = (profile.likes as LikeDislike[] | null) ?? []
  const dislikes = (profile.dislikes as LikeDislike[] | null) ?? []

  return (
    <WritingEditorForm
      username={username}
      availableTags={tagLabels}
      linkableEntities={{
        companies: companies.map((c) => ({ id: c.id, name: c.name, slug: c.slug, brandColour: c.brand_colour })),
        projects: projects.map((p) => ({ id: p.id, name: p.title, slug: p.slug })),
        crowdfunding: crowdfundingProjects.map((cf) => ({ id: cf.id, name: cf.title, slug: cf.slug })),
        likes: likes.filter((l) => l.id).map((l) => ({ id: l.id!, label: `${l.emoji} ${l.text}` })),
        dislikes: dislikes.filter((d) => d.id).map((d) => ({ id: d.id!, label: `${d.emoji} ${d.text}` })),
      }}
      existingLinks={[]}
    />
  )
}
