import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { Writing } from '@/lib/writings'
import { readTimeMinutes, excerptFromHtml } from '@/lib/writings'
import { slugify } from '@/lib/tags'
import type { SiteTag } from '@/lib/tags'
import { getLinksForWriting } from '@/lib/writing-links'

interface Props {
  params: Promise<{ username: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, slug } = await params
  const supabase = await createClient()

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single() as { data: { id: string } | null }

  if (!profile) return {}

  const { data: w } = await (supabase as any)
    .from('writings')
    .select('title, body_html, canonical_url, tags')
    .eq('user_id', profile.id)
    .eq('slug', slug)
    .eq('status', 'published')
    .single() as { data: Partial<Writing> | null }

  if (!w) return {}

  const description = w.body_html ? excerptFromHtml(w.body_html, 160) : undefined

  return {
    title: w.title,
    description,
    alternates: w.canonical_url ? { canonical: w.canonical_url } : undefined,
    openGraph: {
      title: w.title ?? undefined,
      description,
      type: 'article',
      authors: [username],
    },
  }
}

export default async function WritingPostPage({ params }: Props) {
  const { username, slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id, username, site_tags')
    .eq('username', username)
    .single() as { data: { id: string; username: string; site_tags: unknown } | null }

  if (!profile) notFound()

  const isOwner = user?.id === profile.id

  // Owner can see any status; public only sees published
  let query = (supabase as any)
    .from('writings')
    .select('*')
    .eq('user_id', profile.id)
    .eq('slug', slug)

  if (!isOwner) query = query.eq('status', 'published')

  const { data: writing } = await query.single() as { data: Writing | null }

  if (!writing) notFound()

  const siteTags = ((profile as any).site_tags ?? []) as SiteTag[]
  const readTime = readTimeMinutes(writing.word_count)

  // Fetch writing links and resolve company/project names
  const writingLinks = await getLinksForWriting(writing.id)
  const linkedCompanyIds = writingLinks.filter((l) => l.entity_type === 'company').map((l) => l.entity_id)
  const linkedProjectIds = writingLinks.filter((l) => l.entity_type === 'project').map((l) => l.entity_id)
  const linkedCrowdfundingIds = writingLinks.filter((l) => l.entity_type === 'crowdfunding').map((l) => l.entity_id)

  let linkedCompanies: Array<{ id: string; name: string; slug: string; logo: string | null; brand_colour: string | null }> = []
  let linkedProjects: Array<{ id: string; title: string; slug: string }> = []
  let linkedCrowdfunding: Array<{ id: string; title: string; slug: string }> = []

  if (linkedCompanyIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('companies')
      .select('id, name, slug, logo, brand_colour')
      .in('id', linkedCompanyIds) as { data: Array<{ id: string; name: string; slug: string; logo: string | null; brand_colour: string | null }> | null }
    linkedCompanies = data ?? []
  }
  if (linkedProjectIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('projects')
      .select('id, title, slug')
      .in('id', linkedProjectIds) as { data: Array<{ id: string; title: string; slug: string }> | null }
    linkedProjects = data ?? []
  }
  if (linkedCrowdfundingIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('crowdfunding_projects')
      .select('id, title, slug')
      .in('id', linkedCrowdfundingIds) as { data: Array<{ id: string; title: string; slug: string }> | null }
    linkedCrowdfunding = data ?? []
  }

  const hasLinks = linkedCompanies.length > 0 || linkedProjects.length > 0 || linkedCrowdfunding.length > 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-8 flex items-center gap-2">
        <Link href={`/${username}`} className="hover:text-gray-700">{username}</Link>
        <span>/</span>
        <Link href={`/${username}/writings`} className="hover:text-gray-700">writings</Link>
        {writing.status !== 'published' && (
          <>
            <span>/</span>
            <span className="text-yellow-600 font-medium">{writing.status}</span>
          </>
        )}
      </nav>

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight leading-tight mb-4">
          {writing.title}
        </h1>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          {writing.published_at && (
            <time dateTime={writing.published_at}>
              {new Date(writing.published_at).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </time>
          )}
          <span>·</span>
          <span>{readTime} min read</span>
          <span>·</span>
          <span>{writing.word_count.toLocaleString()} words</span>
        </div>
        {writing.external_url && (
          <a
            href={writing.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            View original at {new URL(writing.external_url).hostname.replace(/^www\./, '')}
          </a>
        )}
        {writing.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {writing.tags.map((tag) => {
              const siteTag = siteTags.find((st) => st.label === tag)
              return (
                <Link
                  key={tag}
                  href={
                    siteTag
                      ? `/${username}/writings/tags/${slugify(tag)}`
                      : `/${username}/writings?q=${encodeURIComponent(tag)}`
                  }
                  className="text-xs text-gray-400 border border-gray-200 px-2.5 py-1 rounded-full hover:border-gray-400 hover:text-gray-700 transition-colors"
                >
                  {tag}
                </Link>
              )
            })}
          </div>
        )}
        {/* Related to */}
        {hasLinks && (
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Related to</span>
            {linkedCompanies.map((c) => (
              <Link
                key={c.id}
                href={`/${username}/professional`}
                className="inline-flex items-center gap-1.5 text-xs border px-2.5 py-1 rounded-full hover:opacity-80 transition-colors no-underline"
                style={{
                  borderColor: c.brand_colour ?? '#e5e7eb',
                  color: c.brand_colour ?? '#4b5563',
                }}
              >
                {c.logo && (
                  <Image src={c.logo} alt={c.name} width={14} height={14} className="rounded-sm" />
                )}
                {c.name}
              </Link>
            ))}
            {linkedProjects.map((p) => (
              <Link
                key={p.id}
                href={`/${username}/projects`}
                className="inline-flex items-center gap-1.5 text-xs border border-gray-200 px-2.5 py-1 rounded-full hover:border-gray-400 transition-colors no-underline text-gray-600"
              >
                {p.title}
              </Link>
            ))}
            {linkedCrowdfunding.map((cf) => (
              <Link
                key={cf.id}
                href={`/${username}/projects?tab=backed`}
                className="inline-flex items-center gap-1.5 text-xs border border-orange/30 px-2.5 py-1 rounded-full hover:border-orange/60 transition-colors no-underline text-orange"
              >
                🎯 {cf.title}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Hero image */}
      {writing.image_url && (
        <div className="mb-8 -mx-4 sm:mx-0 sm:rounded-lg overflow-hidden">
          <Image
            src={writing.image_url}
            alt={writing.title}
            width={1200}
            height={630}
            className="w-full h-auto"
            priority
          />
        </div>
      )}

      {/* Body */}
      <article
        className="prose prose-gray max-w-none
          prose-headings:font-semibold
          prose-a:text-inherit prose-a:underline prose-a:underline-offset-2
          prose-code:before:content-none prose-code:after:content-none
          prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-gray-900 prose-pre:text-gray-100
          prose-blockquote:border-gray-300 prose-blockquote:text-gray-500"
        dangerouslySetInnerHTML={{ __html: writing.body_html ?? '' }}
      />

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-gray-100">
        <Link
          href={`/${username}/writings`}
          className="text-sm text-gray-400 hover:text-gray-700"
        >
          ← All writings
        </Link>

        {isOwner && (
          <Link
            href={`/${username}/admin/writings/${slug}`}
            className="ml-6 text-sm text-gray-400 hover:text-gray-700"
          >
            Edit post →
          </Link>
        )}
      </footer>
    </div>
  )
}
