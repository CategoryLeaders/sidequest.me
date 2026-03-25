import { requireOwner } from '@/lib/auth/require'
import WritingEditorForm from '@/components/writings/WritingEditorForm'
import { DEFAULT_SITE_TAGS } from '@/lib/tags'
import type { SiteTag } from '@/lib/tags'
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
  const { profile } = await requireOwner(username)

  const siteTags = ((profile as Record<string, unknown>).site_tags ?? DEFAULT_SITE_TAGS) as SiteTag[]

  // Fetch linkable entities
  const [companies, projects, crowdfundingProjects] = await Promise.all([
    getCompaniesForUser(profile.id),
    getProjectsForUser(profile.id),
    getAllCrowdfundingProjects(profile.id),
  ])

  const likes = ((profile as Record<string, unknown>).likes as LikeDislike[] | null) ?? []
  const dislikes = ((profile as Record<string, unknown>).dislikes as LikeDislike[] | null) ?? []

  return (
    <WritingEditorForm
      username={username}
      availableTags={siteTags}
      linkableEntities={{
        companies: companies.map((c) => ({ id: c.id, name: c.name, slug: c.slug, brandColour: c.brand_colour })),
        projects: projects.map((p) => ({ id: p.id, name: p.title, slug: p.slug })),
        crowdfunding: crowdfundingProjects.map((cf) => ({ id: cf.id, name: (cf as Record<string, unknown>).short_name as string || cf.title, slug: cf.slug })),
        likes: likes.filter((l) => l.id).map((l) => ({ id: l.id!, label: `${l.emoji} ${l.text}` })),
        dislikes: dislikes.filter((d) => d.id).map((d) => ({ id: d.id!, label: `${d.emoji} ${d.text}` })),
      }}
      existingLinks={[]}
    />
  )
}
