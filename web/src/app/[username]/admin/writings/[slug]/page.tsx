import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import WritingEditorForm from '@/components/writings/WritingEditorForm'
import { DEFAULT_SITE_TAGS } from '@/lib/tags'
import type { SiteTag } from '@/lib/tags'
import type { Writing } from '@/lib/writings'
import { getCompaniesForUser } from '@/lib/companies'
import { getProjectsForUser } from '@/lib/projects-data'
import { getAllCrowdfundingProjects } from '@/lib/crowdfunding'
import { getLinksForWriting } from '@/lib/writing-links'
import type { LikeDislike } from '@/types/profile-extras'

export default async function EditWritingPage({
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
    .select('id, username, site_tags, likes, dislikes')
    .eq('username', username)
    .single() as { data: { id: string; username: string; site_tags: unknown; likes: unknown; dislikes: unknown } | null }

  if (!profile) notFound()
  if (profile.id !== user.id) redirect(`/${username}`)

  const { data: writing } = await (supabase as any)
    .from('writings')
    .select('*')
    .eq('user_id', profile.id)
    .eq('slug', slug)
    .single() as { data: Writing | null }

  if (!writing) notFound()

  const siteTags = ((profile as any).site_tags ?? DEFAULT_SITE_TAGS) as SiteTag[]

  // Fetch linkable entities + existing links
  const [companies, projects, crowdfundingProjects, existingLinks] = await Promise.all([
    getCompaniesForUser(profile.id),
    getProjectsForUser(profile.id),
    getAllCrowdfundingProjects(profile.id),
    getLinksForWriting(writing.id),
  ])

  const likes = (profile.likes as LikeDislike[] | null) ?? []
  const dislikes = (profile.dislikes as LikeDislike[] | null) ?? []

  return (
    <WritingEditorForm
      username={username}
      writing={writing}
      availableTags={siteTags}
      linkableEntities={{
        companies: companies.map((c) => ({ id: c.id, name: c.name, slug: c.slug, brandColour: c.brand_colour })),
        projects: projects.map((p) => ({ id: p.id, name: p.title, slug: p.slug })),
        crowdfunding: crowdfundingProjects.map((cf) => ({ id: cf.id, name: (cf as any).short_name || cf.title, slug: cf.slug })),
        likes: likes.filter((l) => l.id).map((l) => ({ id: l.id!, label: `${l.emoji} ${l.text}` })),
        dislikes: dislikes.filter((d) => d.id).map((d) => ({ id: d.id!, label: `${d.emoji} ${d.text}` })),
      }}
      existingLinks={existingLinks.map((l) => ({ entity_type: l.entity_type, entity_id: l.entity_id, is_primary: l.is_primary }))}
    />
  )
}
