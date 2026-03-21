import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import type { Writing } from '@/lib/writings'
import { excerptFromHtml, readTimeMinutes } from '@/lib/writings'
import { tagBySlug, slugify } from '@/lib/tags'
import type { SiteTag } from '@/lib/tags'

interface Props {
  params: Promise<{ username: string }>
  searchParams: Promise<{ tag?: string; q?: string; page?: string; company?: string }>
}

const PER_PAGE = 20

export default async function WritingsIndexPage({ params, searchParams }: Props) {
  const { username } = await params
  const { tag: tagSlug, q, page: pageStr, company: companySlug } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))

  const supabase = await createClient()

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id, username, site_tags')
    .eq('username', username)
    .single() as { data: { id: string; username: string; site_tags: unknown } | null }

  if (!profile) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === profile.id

  const siteTags = ((profile as any).site_tags ?? []) as SiteTag[]

  // Resolve tag filter
  const matchedTag = tagSlug ? tagBySlug(siteTags, tagSlug) : null
  if (tagSlug && !matchedTag) notFound()
  const filterLabel = matchedTag?.label ?? null

  // Resolve company filter
  type CompanyInfo = { id: string; name: string; logo: string | null; brand_colour: string | null }
  let activeCompany: CompanyInfo | null = null
  let companyWritingIds: string[] | null = null

  if (companySlug) {
    const { data: co } = await (supabase as any)
      .from('companies')
      .select('id, name, logo, brand_colour')
      .eq('user_id', profile.id)
      .eq('slug', companySlug)
      .single() as { data: CompanyInfo | null }

    if (co) {
      activeCompany = co
      const { data: links } = await (supabase as any)
        .from('writing_links')
        .select('writing_id')
        .eq('entity_type', 'company')
        .eq('entity_id', co.id) as { data: { writing_id: string }[] | null }
      companyWritingIds = (links ?? []).map((l) => l.writing_id)
    } else {
      // Unknown company slug — show empty list rather than all writings
      companyWritingIds = []
    }
  }

  // Build query
  let query = (supabase as any)
    .from('writings')
    .select('id, title, slug, tags, word_count, body_html, published_at', { count: 'exact' })
    .eq('user_id', profile.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range((page - 1) * PER_PAGE, page * PER_PAGE - 1)

  if (filterLabel) {
    query = query.contains('tags', [filterLabel])
  }

  if (companyWritingIds !== null) {
    // Filter to only writings linked to the active company
    // If the array is empty, force no results with a guaranteed non-match
    const ids = companyWritingIds.length > 0 ? companyWritingIds : ['00000000-0000-0000-0000-000000000000']
    query = query.in('id', ids)
  }

  if (q) {
    query = query.textSearch('fts', q.trim(), { type: 'websearch' })
  }

  const { data: writings, count } = await query as {
    data: Partial<Writing>[] | null
    count: number | null
  }

  const rows = writings ?? []
  const total = count ?? 0
  const totalPages = Math.ceil(total / PER_PAGE)

  // Fetch linked companies for professional writings (for logo display)
  const writingIds = rows.map((w) => w.id).filter(Boolean) as string[]
  let writingCompanyMap: Map<string, Array<{ name: string; logo: string | null; brand_colour: string | null }>> = new Map()

  if (writingIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: links } = await (supabase as any)
      .from('writing_links')
      .select('writing_id, entity_id')
      .eq('entity_type', 'company')
      .in('writing_id', writingIds) as { data: Array<{ writing_id: string; entity_id: string }> | null }

    const companyIds = [...new Set((links ?? []).map((l) => l.entity_id))]
    if (companyIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: companies } = await (supabase as any)
        .from('companies')
        .select('id, name, logo, brand_colour')
        .in('id', companyIds) as { data: Array<{ id: string; name: string; logo: string | null; brand_colour: string | null }> | null }

      const companyMap = new Map((companies ?? []).map((c) => [c.id, c]))

      for (const link of links ?? []) {
        const co = companyMap.get(link.entity_id)
        if (!co) continue
        const existing = writingCompanyMap.get(link.writing_id) ?? []
        existing.push({ name: co.name, logo: co.logo, brand_colour: co.brand_colour })
        writingCompanyMap.set(link.writing_id, existing)
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        {activeCompany ? (
          <>
            <div className="flex items-center gap-3 mb-2">
              {activeCompany.logo && (
                <Image
                  src={activeCompany.logo}
                  alt={activeCompany.name}
                  width={32}
                  height={32}
                  className="rounded-sm border border-gray-100"
                />
              )}
              <h1 className="text-3xl font-semibold tracking-tight">
                {activeCompany.name}
              </h1>
            </div>
            <Link href={`/${username}/writings`} className="text-sm text-gray-400 hover:text-gray-700">
              ← All writings
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-semibold tracking-tight mb-1">
              {filterLabel ? `#${filterLabel}` : 'Writings'}
            </h1>
            {filterLabel && (
              <Link href={`/${username}/writings`} className="text-sm text-gray-400 hover:text-gray-700">
                ← All writings
              </Link>
            )}
          </>
        )}
      </div>

      {/* Search */}
      <form className="mb-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search writings…"
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-400 bg-bg-card"
        />
      </form>

      {/* Tag filter chips */}
      {siteTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {siteTags.map((t) => (
            <Link
              key={t.label}
              href={
                filterLabel === t.label
                  ? `/${username}/writings`
                  : `/${username}/writings/tags/${slugify(t.label)}`
              }
              className={`px-3 py-1 rounded-full text-sm border transition-all ${
                filterLabel === t.label
                  ? 'border-black bg-black text-white'
                  : 'border-gray-200 text-gray-500 hover:border-gray-400'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      )}

      {/* Writing list */}
      {rows.length === 0 ? (
        <p className="text-gray-400 py-12 text-center">
          {q ? `No results for "${q}"` : 'No writings yet.'}
        </p>
      ) : (
        <div className="space-y-10">
          {rows.map((w) => {
            const linkedCos = w.id ? writingCompanyMap.get(w.id) ?? [] : []
            const accentColour = linkedCos.length > 0 ? linkedCos[0].brand_colour : null
            return (
              <article
                key={w.id}
                className={accentColour ? 'pl-4 border-l-3' : ''}
                style={accentColour ? { borderLeftColor: accentColour } : undefined}
              >
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                  {w.published_at && (
                    <time dateTime={w.published_at}>
                      {new Date(w.published_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </time>
                  )}
                  {w.word_count ? (
                    <>
                      <span>·</span>
                      <span>{readTimeMinutes(w.word_count)} min read</span>
                    </>
                  ) : null}
                </div>
                <div className="flex items-start gap-3">
                  {/* Show per-row logos only in mixed/unfiltered view; in company view the header already shows the logo */}
                  {linkedCos.length > 0 && !activeCompany && (
                    <div className="flex -space-x-1 mt-1 shrink-0">
                      {linkedCos.map((co) =>
                        co.logo ? (
                          <Image
                            key={co.name}
                            src={co.logo}
                            alt={co.name}
                            width={24}
                            height={24}
                            className="rounded-sm border border-gray-100"
                            title={co.name}
                          />
                        ) : (
                          <span
                            key={co.name}
                            className="w-6 h-6 rounded-sm border border-gray-100 flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ backgroundColor: co.brand_colour ?? '#6b7280' }}
                            title={co.name}
                          >
                            {co.name.charAt(0)}
                          </span>
                        )
                      )}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold mb-2">
                      <Link
                        href={`/${username}/writings/${w.slug}`}
                        className="hover:underline"
                      >
                        {w.title}
                      </Link>
                    </h2>
                    {w.body_html && (
                      <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
                        {excerptFromHtml(w.body_html, 250)}
                      </p>
                    )}
                    {w.tags && w.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {w.tags.map((tag) => {
                          const siteTag = siteTags.find((st) => st.label === tag)
                          return (
                            <Link
                              key={tag}
                              href={
                                siteTag
                                  ? `/${username}/writings/tags/${slugify(tag)}`
                                  : `/${username}/writings?q=${encodeURIComponent(tag)}`
                              }
                              className="text-xs text-gray-400 hover:text-gray-700"
                            >
                              #{tag}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-3 mt-12 justify-center text-sm">
          {page > 1 && (
            <Link
              href={`/${username}/writings?page=${page - 1}${filterLabel ? `&tag=${tagSlug}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:border-gray-400"
            >
              ← Previous
            </Link>
          )}
          <span className="self-center text-gray-400">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/${username}/writings?page=${page + 1}${filterLabel ? `&tag=${tagSlug}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:border-gray-400"
            >
              Next →
            </Link>
          )}
        </div>
      )}

      {/* Owner shortcut */}
      {isOwner && (
        <div className="mt-12 pt-6 border-t border-gray-100 text-sm text-gray-400 flex gap-4">
          <Link href={`/${username}/admin/writings`} className="hover:text-gray-700">
            Manage writings →
          </Link>
          <Link href={`/${username}/admin/writings/new`} className="hover:text-gray-700">
            + New post
          </Link>
        </div>
      )}
    </div>
  )
}
