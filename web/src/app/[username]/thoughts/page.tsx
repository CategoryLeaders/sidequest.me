/* ── Thoughts — unified stream of all content types ── [SQ.S-W-2603-0062] */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Writing } from '@/lib/writings'
import { excerptFromHtml, readTimeMinutes } from '@/lib/writings'
import { tagBySlug, slugify } from '@/lib/tags'
import type { SiteTag } from '@/lib/tags'
import { getPublishedPosts } from '@/lib/microblogs'
import type { MicroblogPostWithCounts } from '@/lib/microblogs'
import type { Bookmark, Quote, Question } from '@/lib/thoughts-types'
import { MicroblogCard, ChangelogCard, BookmarkCard, QuoteCard, QuestionCard } from '@/components/microblog'
import ThoughtsComposer from '@/components/thoughts/ThoughtsComposer'
import SubscribeButton from '@/components/SubscribeButton'
import { CardShell, TypeBadge, TagChip, MetadataLine } from '@/components/ui'

interface Props {
  params: Promise<{ username: string }>
  searchParams: Promise<{ tag?: string; q?: string; page?: string; type?: string }>
}

const PER_PAGE = 20
const tagRotations = ['-0.5deg', '0.7deg', '-0.3deg', '0.5deg', '0.4deg', '-0.6deg']

// ─── Unified stream item ────────────────────────────────────────────────────

type StreamItem =
  | { type: 'writing'; data: Partial<Writing>; publishedAt: string }
  | { type: 'microblog'; data: MicroblogPostWithCounts; publishedAt: string }
  | { type: 'bookmark'; data: Bookmark; publishedAt: string }
  | { type: 'quote'; data: Quote; publishedAt: string }
  | { type: 'question'; data: Question; publishedAt: string }

export default async function ThoughtsPage({ params, searchParams }: Props) {
  const { username } = await params
  const { tag: tagSlug, q, page: pageStr, type: typeFilter } = await searchParams
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

  // Resolve tag filter — site tag if matched, otherwise treat the slug as a direct tag name
  const matchedTag = tagSlug ? tagBySlug(siteTags, tagSlug) : null
  const filterLabel = matchedTag?.label ?? tagSlug ?? null

  // Type filter validation
  const validTypes = ['microblog', 'writing', 'bookmark', 'quote', 'question']
  const activeType = typeFilter && validTypes.includes(typeFilter) ? typeFilter : null

  // ── Fetch all content types in parallel ───────────────────────────────────

  const fetchWritings = async () => {
    if (activeType && activeType !== 'writing') return []
    let query = (supabase as any)
      .from('writings')
      .select('id, title, slug, tags, word_count, body_html, published_at, external_url')
      .eq('user_id', profile.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
    if (filterLabel) query = query.contains('tags', [filterLabel])
    if (q) query = query.textSearch('fts', q.trim(), { type: 'websearch' })
    const { data } = await query
    return (data ?? []) as Partial<Writing>[]
  }

  const fetchMicroblogs = async () => {
    if (activeType && activeType !== 'microblog') return []
    if (q) return [] // text search only for writings for now
    return getPublishedPosts(profile.id, { tag: filterLabel ?? undefined, limit: 100 })
  }

  const fetchBookmarks = async () => {
    if (activeType && activeType !== 'bookmark') return []
    if (q) return []
    let query = (supabase as any)
      .from('bookmarks')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .order('published_at', { ascending: false })
      .limit(100)
    if (filterLabel) query = query.contains('tags', [filterLabel])
    const { data } = await query
    return (data ?? []) as Bookmark[]
  }

  const fetchQuotes = async () => {
    if (activeType && activeType !== 'quote') return []
    if (q) return []
    let query = (supabase as any)
      .from('quotes')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .order('published_at', { ascending: false })
      .limit(100)
    if (filterLabel) query = query.contains('tags', [filterLabel])
    const { data } = await query
    return (data ?? []) as Quote[]
  }

  const fetchQuestions = async () => {
    if (activeType && activeType !== 'question') return []
    if (q) return []
    let query = (supabase as any)
      .from('questions')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .order('published_at', { ascending: false })
      .limit(100)
    if (filterLabel) query = query.contains('tags', [filterLabel])
    const { data } = await query
    return (data ?? []) as Question[]
  }

  const [writings, microblogPosts, bookmarks, quotes, questions] = await Promise.all([
    fetchWritings(),
    fetchMicroblogs(),
    fetchBookmarks(),
    fetchQuotes(),
    fetchQuestions(),
  ])

  // ── Merge into unified stream ─────────────────────────────────────────────

  const stream: StreamItem[] = []

  for (const w of writings) {
    stream.push({ type: 'writing', data: w, publishedAt: w.published_at ?? '1970-01-01' })
  }
  for (const mb of microblogPosts) {
    stream.push({ type: 'microblog', data: mb, publishedAt: mb.source_created_at ?? mb.published_at ?? mb.created_at })
  }
  for (const bk of bookmarks) {
    stream.push({ type: 'bookmark', data: bk, publishedAt: bk.published_at ?? bk.created_at })
  }
  for (const qt of quotes) {
    stream.push({ type: 'quote', data: qt, publishedAt: qt.published_at ?? qt.created_at })
  }
  for (const qn of questions) {
    stream.push({ type: 'question', data: qn, publishedAt: qn.published_at ?? qn.created_at })
  }

  // Sort by published date, newest first
  stream.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

  // Paginate the merged stream
  const total = stream.length
  const totalPages = Math.ceil(total / PER_PAGE)
  const pageItems = stream.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  // ── Build query string helper ─────────────────────────────────────────────
  const buildQs = (overrides: Record<string, string | undefined>) => {
    const p: Record<string, string> = {}
    if (tagSlug) p.tag = tagSlug
    if (q) p.q = q
    if (activeType) p.type = activeType
    Object.entries(overrides).forEach(([k, v]) => { if (v) p[k] = v; else delete p[k] })
    const qs = new URLSearchParams(p).toString()
    return qs ? `?${qs}` : ''
  }

  return (
    <main className="max-w-[800px] mx-auto px-8 py-12 relative">
      <div
        className="doodle doodle-circle"
        style={{ width: 80, height: 80, top: 20, right: -25 }}
      />

      <h1 className="font-head font-[900] text-[clamp(1.8rem,4vw,2.8rem)] uppercase leading-[0.95] mb-2">
        {filterLabel ? `#${filterLabel}` : 'Thoughts'}
      </h1>
      <p className="text-[0.95rem] opacity-60 mb-6">
        {filterLabel ? (
          <Link href={`/${username}/thoughts`} className="text-ink/50 hover:text-ink transition-colors border-b-2 border-ink/20 hover:border-ink/50 font-mono text-[0.8rem]">
            &larr; All thoughts
          </Link>
        ) : (
          'Short-form updates, long-form articles, and everything in between.'
        )}
      </p>

      {/* Subscribe button (non-owner only) */}
      {!isOwner && (
        <div className="mb-6">
          <SubscribeButton profileId={profile.id} />
        </div>
      )}

      {/* Owner composer */}
      {isOwner && <ThoughtsComposer username={username} />}

      {/* Type filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Link
          href={`/${username}/thoughts${buildQs({ type: undefined, page: undefined })}`}
          className={`font-mono text-[0.7rem] px-3 py-1.5 border-2 border-ink transition-all ${!activeType ? 'bg-ink text-[var(--bg)] font-bold' : 'bg-transparent text-ink/50 hover:text-ink'}`}
        >
          All
        </Link>
        {[
          { key: 'microblog', label: 'Microblogs' },
          { key: 'writing', label: 'Writings' },
          { key: 'bookmark', label: 'Bookmarks' },
          { key: 'quote', label: 'Quotes' },
          { key: 'question', label: 'Questions' },
        ].map(({ key, label }) => (
          <Link
            key={key}
            href={`/${username}/thoughts${buildQs({ type: activeType === key ? undefined : key, page: undefined })}`}
            className={`font-mono text-[0.7rem] px-3 py-1.5 border-2 border-ink transition-all ${activeType === key ? 'bg-ink text-[var(--bg)] font-bold' : 'bg-transparent text-ink/50 hover:text-ink'}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Search */}
      <form className="mb-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search thoughts..."
          className="w-full border-3 border-ink px-4 py-2.5 text-[0.88rem] font-mono outline-none bg-[var(--bg-card)] focus:border-[var(--orange)] transition-colors placeholder:text-ink/30"
        />
      </form>

      {/* Tag filter chips */}
      {siteTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {siteTags.map((t) => {
            const isActive = filterLabel === t.label
            return (
              <TagChip
                key={t.label}
                label={t.label}
                href={
                  isActive
                    ? `/${username}/thoughts`
                    : `/${username}/thoughts/tags/${slugify(t.label)}`
                }
                variant="sticker"
                color={t.color.replace('sticker-', '')}
                active={isActive}
                className={isActive ? '' : 'opacity-70 hover:opacity-100'}
              />
            )
          })}
        </div>
      )}

      {/* Unified stream */}
      {pageItems.length === 0 ? (
        <p className="text-ink/40 py-12 text-center font-mono text-[0.85rem]">
          {q ? `No results for "${q}"` : 'No thoughts yet.'}
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {pageItems.map((item) => {
            if (item.type === 'microblog') {
              if (item.data.post_type === 'changelog') {
                return (
                  <ChangelogCard
                    key={`cl-${item.data.id}`}
                    post={item.data}
                    username={username}
                    isOwner={isOwner}
                  />
                )
              }
              return (
                <MicroblogCard
                  key={`mb-${item.data.id}`}
                  post={item.data}
                  username={username}
                  isOwner={isOwner}
                />
              )
            }

            if (item.type === 'bookmark') {
              return (
                <BookmarkCard
                  key={`bk-${item.data.id}`}
                  bookmark={item.data}
                  username={username}
                  isOwner={isOwner}
                />
              )
            }

            if (item.type === 'quote') {
              return (
                <QuoteCard
                  key={`qt-${item.data.id}`}
                  quote={item.data}
                  username={username}
                  isOwner={isOwner}
                />
              )
            }

            if (item.type === 'question') {
              return (
                <QuestionCard
                  key={`qn-${item.data.id}`}
                  question={item.data}
                  username={username}
                  isOwner={isOwner}
                />
              )
            }

            // Writing card (existing design)
            const w = item.data
            const excerpt = w.body_html ? excerptFromHtml(w.body_html, 250) : ''
            const readTime = w.word_count ? readTimeMinutes(w.word_count) : null
            const colorMap: Record<string, string> = {
              'sticker-orange': 'var(--orange)',
              'sticker-green': 'var(--green)',
              'sticker-blue': 'var(--blue)',
              'sticker-yellow': 'var(--yellow)',
              'sticker-lilac': 'var(--lilac)',
              'sticker-pink': 'var(--pink)',
            }
            const borderColor = (() => {
              if (!w.tags || w.tags.length === 0) return 'var(--lilac)'
              const matchedSiteTags = w.tags
                .filter((t) => t !== 'Writing')
                .map((t) => siteTags.find((st) => st.label === t))
                .filter(Boolean) as SiteTag[]
              if (matchedSiteTags.length === 0) {
                const writingTag = siteTags.find((st) => st.label === 'Writing')
                return writingTag ? (colorMap[writingTag.color] ?? 'var(--lilac)') : 'var(--lilac)'
              }
              const pick = matchedSiteTags[Math.floor(Math.random() * matchedSiteTags.length)]
              return colorMap[pick.color] ?? 'var(--lilac)'
            })()

            return (
              <CardShell
                key={`w-${w.id}`}
                variant="standard"
                className="!p-6"
                style={{ borderLeftWidth: 6, borderLeftColor: borderColor }}
              >
                {/* Tags as sticker badges */}
                {w.tags && w.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {w.tags.map((tag, j) => {
                      const siteTag = siteTags.find((st) => st.label === tag)
                      const isSiteTag = !!siteTag
                      return (
                        <TagChip
                          key={tag}
                          label={tag}
                          href={
                            isSiteTag
                              ? `/${username}/thoughts/tags/${slugify(tag)}`
                              : `/${username}/thoughts?q=${encodeURIComponent(tag)}`
                          }
                          variant={isSiteTag ? 'sticker' : 'default'}
                          color={isSiteTag ? siteTag.color.replace('sticker-', '') : undefined}
                          className=""
                          style={{
                            transform: `rotate(${tagRotations[j % tagRotations.length]})`,
                          }}
                        />
                      )
                    })}
                  </div>
                )}

                {/* Writing type badge */}
                <div className="mb-2">
                  <TypeBadge type="writing" />
                </div>

                <h2 className="font-head font-bold text-[var(--text-lg)] uppercase mb-2">
                  <Link
                    href={`/${username}/writings/${w.slug}`}
                    className="text-ink no-underline hover:text-[var(--orange)] transition-colors"
                  >
                    {w.title}
                  </Link>
                  {w.external_url && (
                    <a
                      href={w.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block ml-2 align-middle opacity-30 hover:opacity-70 transition-opacity"
                      title={`Originally published at ${new URL(w.external_url).hostname.replace(/^www\./, '')}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a>
                  )}
                </h2>

                {excerpt && (
                  <p className="text-[var(--text-base)] opacity-70 leading-snug mb-3 line-clamp-3">
                    {excerpt}
                  </p>
                )}

                <MetadataLine
                  items={[
                    ...(w.published_at
                      ? [{
                          label: (
                            <time dateTime={w.published_at}>
                              {new Date(w.published_at).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </time>
                          ),
                        }]
                      : []),
                    ...(readTime ? [{ label: `${readTime} min read` }] : []),
                  ]}
                />
              </CardShell>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-3 mt-10 justify-center items-center">
          {page > 1 && (
            <Link
              href={`/${username}/thoughts${buildQs({ page: String(page - 1) })}`}
              className="sticker sticker-orange text-[0.7rem] !px-4 !py-2 !border-2"
            >
              &larr; Previous
            </Link>
          )}
          <span className="font-mono text-[0.7rem] opacity-40">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/${username}/thoughts${buildQs({ page: String(page + 1) })}`}
              className="sticker sticker-orange text-[0.7rem] !px-4 !py-2 !border-2"
            >
              Next &rarr;
            </Link>
          )}
        </div>
      )}

      {/* Owner shortcuts */}
      {isOwner && (
        <div className="mt-10 pt-6 border-t-3 border-ink/10 flex gap-4 font-mono text-[0.7rem]">
          <Link href={`/${username}/admin/writings`} className="text-ink/40 hover:text-ink transition-colors border-b-2 border-ink/20 hover:border-ink/40">
            Manage writings &rarr;
          </Link>
          <Link href={`/${username}/admin/writings/new`} className="text-ink/40 hover:text-ink transition-colors border-b-2 border-ink/20 hover:border-ink/40">
            + New writing
          </Link>
        </div>
      )}
    </main>
  )
}
