import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Writing } from '@/lib/writings'
import { excerptFromHtml, readTimeMinutes } from '@/lib/writings'
import { tagBySlug, slugify } from '@/lib/tags'
import type { SiteTag } from '@/lib/tags'
import { TagChip, MetadataLine } from '@/components/ui'
import { SearchBox } from '@/components/shared/SearchBox'
import { WritingEditControls } from '@/components/shared/WritingEditControls'

interface Props {
  params: Promise<{ username: string }>
  searchParams: Promise<{ tag?: string; q?: string; page?: string; company?: string }>
}

const PER_PAGE = 20

/* ── Context badge helpers ── */
type CtxCompany = {
  kind: 'company'
  name: string
  logo: string | null       // path e.g. /logos/hackthebox.svg
  logo_text: string | null
  brand_colour: string | null
  is_primary: boolean
}

type WritingCtx = {
  primary: CtxCompany | null
  secondaries: CtxCompany[]
  /** Key used for run-detection — changes when the primary context changes */
  runKey: string
}

function buildCtx(companies: CtxCompany[]): WritingCtx {
  if (companies.length === 0) {
    return { primary: null, secondaries: [], runKey: 'personal' }
  }

  // If exactly one has is_primary=true, use it; otherwise fall back to first
  const primary = companies.find((c) => c.is_primary) ?? companies[0]
  const secondaries = companies.filter((c) => c !== primary)
  return {
    primary,
    secondaries,
    runKey: `company:${primary.name}`,
  }
}

/* ── Context badge component (rendered as inline HTML string for server component) ── */
function CtxBadge({ co }: { co: CtxCompany }) {
  const bg = co.brand_colour ?? '#6b7280'
  const text = co.logo_text ?? co.name.slice(0, 2).toUpperCase()

  if (co.logo) {
    return (
      <span
        className="flex-shrink-0 w-10 h-10 overflow-hidden border border-black/10 flex items-center justify-center"
        style={{ background: bg }}
        title={co.name}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={co.logo} alt={co.name} className="w-7 h-7 object-contain" />
      </span>
    )
  }

  return (
    <span
      className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-white text-xs font-bold font-mono"
      style={{ background: bg }}
      title={co.name}
    >
      {text}
    </span>
  )
}

function PersonalBadge() {
  return (
    <span
      className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-lg bg-ink/10"
      title="Personal writing"
    >
      ✏️
    </span>
  )
}

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
  type CompanyInfo = { id: string; name: string; logo: string | null; logo_text: string | null; brand_colour: string | null }
  let activeCompany: CompanyInfo | null = null
  let companyWritingIds: string[] | null = null

  if (companySlug) {
    const { data: co } = await (supabase as any)
      .from('companies')
      .select('id, name, logo, logo_text, brand_colour')
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
      companyWritingIds = []
    }
  }

  // Build query
  let query = (supabase as any)
    .from('writings')
    .select('id, title, slug, tags, word_count, body_html, image_url, published_at, status', { count: 'exact' })
    .eq('user_id', profile.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range((page - 1) * PER_PAGE, page * PER_PAGE - 1)

  if (filterLabel) {
    query = query.contains('tags', [filterLabel])
  }

  if (companyWritingIds !== null) {
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

  // Fetch linked companies with is_primary + logo_text
  const writingIds = rows.map((w) => w.id).filter(Boolean) as string[]
  // Map: writing_id → CtxCompany[]
  const writingCtxMap = new Map<string, CtxCompany[]>()

  if (writingIds.length > 0) {
    const { data: links } = await (supabase as any)
      .from('writing_links')
      .select('writing_id, entity_id, is_primary')
      .eq('entity_type', 'company')
      .in('writing_id', writingIds) as { data: Array<{ writing_id: string; entity_id: string; is_primary: boolean }> | null }

    const companyIds = [...new Set((links ?? []).map((l) => l.entity_id))]
    if (companyIds.length > 0) {
      const { data: companies } = await (supabase as any)
        .from('companies')
        .select('id, name, logo, logo_text, brand_colour')
        .in('id', companyIds) as { data: Array<CompanyInfo> | null }

      const companyMap = new Map((companies ?? []).map((c) => [c.id, c]))

      for (const link of links ?? []) {
        const co = companyMap.get(link.entity_id)
        if (!co) continue
        const entry: CtxCompany = {
          kind: 'company',
          name: co.name,
          logo: co.logo,
          logo_text: co.logo_text,
          brand_colour: co.brand_colour,
          is_primary: link.is_primary,
        }
        const existing = writingCtxMap.get(link.writing_id) ?? []
        existing.push(entry)
        writingCtxMap.set(link.writing_id, existing)
      }
    }
  }

  // Build enriched rows with context
  const enriched = rows.map((w) => {
    const companies = w.id ? (writingCtxMap.get(w.id) ?? []) : []
    const ctx = buildCtx(companies)
    return { writing: w, ctx }
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        {activeCompany ? (
          <>
            <div className="flex items-center gap-3 mb-2">
              {activeCompany.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeCompany.logo}
                  alt={activeCompany.name}
                  width={32}
                  height={32}
                  className="border border-ink/10"
                />
              )}
              <h1 className="text-3xl font-semibold tracking-tight">
                {activeCompany.name}
              </h1>
            </div>
            <Link href={`/${username}/writings`} className="text-sm text-ink/40 hover:text-ink/70">
              ← All writings
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-semibold tracking-tight mb-1">
              {filterLabel ? `#${filterLabel}` : 'Writings'}
            </h1>
            {filterLabel && (
              <Link href={`/${username}/writings`} className="text-sm text-ink/40 hover:text-ink/70">
                ← All writings
              </Link>
            )}
          </>
        )}
      </div>

      {/* Search */}
      <form className="mb-6">
        <SearchBox
          defaultValue={q}
          placeholder="Search writings…"
          className="w-full border-2 border-ink/[var(--opacity-muted)] px-4 py-2.5 text-sm font-mono outline-none focus:border-ink/40 bg-[var(--bg-card)]"
        />
      </form>

      {/* Tag filter chips */}
      {siteTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {siteTags.map((t) => (
            <TagChip
              key={t.label}
              label={t.label}
              variant="sticker"
              color={t.color.replace('sticker-', '')}
              active={filterLabel === t.label}
              href={
                filterLabel === t.label
                  ? `/${username}/writings`
                  : `/${username}/writings/tags/${slugify(t.label)}`
              }
            />
          ))}
        </div>
      )}

      {/* Writing list — Option D: chronological with inline run headers */}
      {enriched.length === 0 ? (
        <p className="text-ink/40 py-12 text-center">
          {q ? `No results for "${q}"` : 'No writings yet.'}
        </p>
      ) : (
        <div>
          {enriched.map(({ writing: w, ctx }, i) => {
            const prevCtx = i > 0 ? enriched[i - 1].ctx : null
            const isNewRun = prevCtx === null || ctx.runKey !== prevCtx.runKey
            const nextCtx = i < enriched.length - 1 ? enriched[i + 1].ctx : null
            const isLastInRun = nextCtx === null || ctx.runKey !== nextCtx.runKey

            const connectorColour = ctx.primary?.brand_colour ?? 'var(--ink)'
            const borderColour = ctx.primary?.brand_colour ?? 'rgba(26,26,26,0.15)'
            const excerpt = w.body_html ? excerptFromHtml(w.body_html, 160) : null

            return (
              <div key={w.id}>
                {/* Inline run header — shown once at the start of each context run */}
                {isNewRun && ctx.primary && (
                  <div className="flex items-center gap-3 mb-4 mt-8 first:mt-0">
                    <CtxBadge co={ctx.primary} />
                    <div>
                      <p className="text-sm font-semibold text-ink/80">{ctx.primary.name}</p>
                      <Link
                        href={`/${username}/writings?company=${encodeURIComponent(ctx.primary.name.toLowerCase().replace(/\s+/g, '-'))}`}
                        className="text-xs text-ink/40 hover:text-ink/60"
                      >
                        View all →
                      </Link>
                    </div>
                  </div>
                )}

                {/* Personal run header */}
                {isNewRun && !ctx.primary && (
                  <div className="flex items-center gap-3 mb-4 mt-8 first:mt-0">
                    <PersonalBadge />
                    <p className="text-sm font-semibold text-ink/80">Personal</p>
                  </div>
                )}

                {/* Article row */}
                <div className="flex gap-0 relative">
                  {/* Connector line column */}
                  <div className="flex flex-col items-center flex-shrink-0 w-11 mr-3">
                    {/* Dot */}
                    <div
                      className="w-2 h-2 rounded-full mt-[6px] flex-shrink-0 z-10"
                      style={{ background: connectorColour, border: `2px solid ${connectorColour}` }}
                    />
                    {/* Line to next item in same run */}
                    {!isLastInRun && (
                      <div
                        className="flex-1 w-px mt-1"
                        style={{ background: connectorColour, opacity: 0.3 }}
                      />
                    )}
                  </div>

                  {/* Article card */}
                  <article
                    className="flex-1 min-w-0 pb-6 relative"
                    style={{ borderLeft: `2px solid ${borderColour}`, paddingLeft: '14px', marginLeft: '-2px' }}
                  >
                    {/* Owner edit menu */}
                    {isOwner && (
                      <div className="absolute top-0 right-0">
                        <WritingEditControls
                          writingId={w.id ?? ""}
                          initialData={{ title: w.title ?? "", tags: w.tags ?? [], status: (w as any).status ?? "published" }}
                          permalink={w.slug ? `/${username}/writings/${w.slug}` : undefined}
                          siteTags={siteTags}
                        />
                      </div>
                    )}

                    {/* Meta line */}
                    <div className="flex items-center gap-2 text-xs text-ink/40 mb-1 flex-wrap">
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
                      {/* Secondary company chip(s) */}
                      {ctx.secondaries.map((sec) => (
                        <span
                          key={sec.name}
                          className="px-1.5 py-0.5 text-[10px] font-semibold text-white"
                          style={{ background: sec.brand_colour ?? '#6b7280' }}
                        >
                          {sec.logo_text ?? sec.name.slice(0, 2).toUpperCase()}
                        </span>
                      ))}
                    </div>

                    {/* Title + thumbnail */}
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-[17px] font-semibold leading-snug mb-1.5">
                          <Link
                            href={`/${username}/writings/${w.slug}`}
                            className="hover:underline text-ink"
                          >
                            {w.title}
                          </Link>
                        </h2>
                        {excerpt && (
                          <p className="text-sm text-ink/50 leading-relaxed line-clamp-2 mb-2">
                            {excerpt}
                          </p>
                        )}
                        {w.tags && w.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {w.tags.map((tag) => {
                              const siteTag = siteTags.find((st) => st.label === tag)
                              return (
                                <TagChip
                                  key={tag}
                                  label={tag}
                                  variant={siteTag ? 'sticker' : 'default'}
                                  color={siteTag ? siteTag.color.replace('sticker-', '') : undefined}
                                  href={
                                    siteTag
                                      ? `/${username}/writings/tags/${slugify(tag)}`
                                      : `/${username}/writings?q=${encodeURIComponent(tag)}`
                                  }
                                />
                              )
                            })}
                          </div>
                        )}
                      </div>
                      {/* Thumbnail */}
                      {w.image_url && (
                        <div className="flex-shrink-0 w-[72px] h-12 overflow-hidden border border-ink/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={w.image_url}
                            alt={w.title ?? ''}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </article>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-3 mt-12 justify-center text-sm font-mono">
          {page > 1 && (
            <Link
              href={`/${username}/writings?page=${page - 1}${filterLabel ? `&tag=${tagSlug}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className="px-4 py-2 border-2 border-ink/[var(--opacity-muted)] hover:border-ink/40 transition-colors"
            >
              ← Previous
            </Link>
          )}
          <span className="self-center text-ink/40">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/${username}/writings?page=${page + 1}${filterLabel ? `&tag=${tagSlug}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className="px-4 py-2 border-2 border-ink/[var(--opacity-muted)] hover:border-ink/40 transition-colors"
            >
              Next →
            </Link>
          )}
        </div>
      )}

      {/* Owner shortcut */}
      {isOwner && (
        <div className="mt-12 pt-6 border-t border-ink/10 text-sm text-ink/40 font-mono flex gap-4">
          <Link href={`/${username}/admin/writings`} className="hover:text-ink/70">
            Manage writings →
          </Link>
          <Link href={`/${username}/admin/writings/new`} className="hover:text-ink/70">
            + New post
          </Link>
        </div>
      )}
    </div>
  )
}
