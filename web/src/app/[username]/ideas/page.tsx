import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Writing } from '@/lib/writings'
import { excerptFromHtml, readTimeMinutes } from '@/lib/writings'
import { tagBySlug, slugify } from '@/lib/tags'
import type { SiteTag } from '@/lib/tags'

interface Props {
  params: Promise<{ username: string }>
  searchParams: Promise<{ tag?: string; q?: string; page?: string }>
}

const PER_PAGE = 20
const tagRotations = ['-0.5deg', '0.7deg', '-0.3deg', '0.5deg', '0.4deg', '-0.6deg']

export default async function IdeasPage({ params, searchParams }: Props) {
  const { username } = await params
  const { tag: tagSlug, q, page: pageStr } = await searchParams
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

  return (
    <main className="max-w-[800px] mx-auto px-8 py-12 relative">
      <div
        className="doodle doodle-circle"
        style={{ width: 80, height: 80, top: 20, right: -25 }}
      />

      <h1 className="font-head font-[900] text-[clamp(1.8rem,4vw,2.8rem)] uppercase leading-[0.95] mb-2">
        {filterLabel ? `#${filterLabel}` : 'Ideas, Thoughts & Writings'}
      </h1>
      <p className="text-[0.95rem] opacity-60 mb-6">
        {filterLabel ? (
          <Link href={`/${username}/ideas`} className="text-ink/50 hover:text-ink transition-colors border-b-2 border-ink/20 hover:border-ink/50 font-mono text-[0.8rem]">
            &larr; All ideas, thoughts &amp; writings
          </Link>
        ) : (
          'Long-form articles and short-form hot takes.'
        )}
      </p>

      {/* Search */}
      <form className="mb-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search writings..."
          className="w-full border-3 border-ink px-4 py-2.5 text-[0.88rem] font-mono outline-none bg-[var(--bg-card)] focus:border-[var(--orange)] transition-colors placeholder:text-ink/30"
        />
      </form>

      {/* Tag filter chips */}
      {siteTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {siteTags.map((t, i) => {
            const isActive = filterLabel === t.label
            return (
              <Link
                key={t.label}
                href={
                  isActive
                    ? `/${username}/ideas`
                    : `/${username}/ideas/tags/${slugify(t.label)}`
                }
                className={`sticker ${t.color} text-[0.65rem] !px-3 !py-1.5 !border-2 transition-all ${
                  isActive ? 'ring-2 ring-ink ring-offset-2 scale-105' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  transform: isActive ? 'scale(1.05)' : `rotate(${tagRotations[i % tagRotations.length]})`,
                }}
              >
                {t.label}
              </Link>
            )
          })}
        </div>
      )}

      {/* Writings list */}
      {rows.length === 0 ? (
        <p className="text-ink/40 py-12 text-center font-mono text-[0.85rem]">
          {q ? `No results for "${q}"` : 'No writings yet.'}
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {rows.map((w) => {
            const excerpt = w.body_html ? excerptFromHtml(w.body_html, 250) : ''
            const readTime = w.word_count ? readTimeMinutes(w.word_count) : null
            const borderColor = w.tags && w.tags.length > 0
              ? (() => {
                  const firstTag = siteTags.find((st) => st.label === w.tags![0])
                  if (!firstTag) return 'var(--lilac)'
                  const colorMap: Record<string, string> = {
                    'sticker-orange': 'var(--orange)',
                    'sticker-green': 'var(--green)',
                    'sticker-blue': 'var(--blue)',
                    'sticker-yellow': 'var(--yellow)',
                    'sticker-lilac': 'var(--lilac)',
                    'sticker-pink': 'var(--pink)',
                  }
                  return colorMap[firstTag.color] ?? 'var(--lilac)'
                })()
              : 'var(--lilac)'

            return (
              <article
                key={w.id}
                className="border-3 border-ink p-6 bg-[var(--bg-card)]"
                style={{ borderLeftWidth: 6, borderLeftColor: borderColor }}
              >
                {/* Tags as sticker badges */}
                {w.tags && w.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {w.tags.map((tag, j) => {
                      const siteTag = siteTags.find((st) => st.label === tag)
                      const isSiteTag = !!siteTag
                      return (
                        <Link
                          key={tag}
                          href={
                            isSiteTag
                              ? `/${username}/ideas/tags/${slugify(tag)}`
                              : `/${username}/ideas?q=${encodeURIComponent(tag)}`
                          }
                          className={
                            isSiteTag
                              ? `sticker ${siteTag.color} text-[0.6rem] !px-2.5 !py-1 !border-2`
                              : 'inline-block text-[0.6rem] px-2.5 py-1 border border-dashed border-ink/15 text-ink/30 bg-ink/[0.03] font-mono rounded-sm hover:border-ink/30 hover:text-ink/50 transition-colors'
                          }
                          style={{
                            transform: `rotate(${tagRotations[j % tagRotations.length]})`,
                          }}
                        >
                          {isSiteTag ? tag : `#${tag}`}
                        </Link>
                      )
                    })}
                  </div>
                )}

                <h2 className="font-head font-bold text-[1.1rem] uppercase mb-2">
                  <Link
                    href={`/${username}/writings/${w.slug}`}
                    className="text-ink no-underline hover:text-[var(--orange)] transition-colors"
                  >
                    {w.title}
                  </Link>
                </h2>

                {excerpt && (
                  <p className="text-[0.88rem] opacity-70 leading-snug mb-3 line-clamp-3">
                    {excerpt}
                  </p>
                )}

                <div className="flex items-center gap-2 text-[0.6rem] font-mono opacity-40">
                  {w.published_at && (
                    <time dateTime={w.published_at}>
                      {new Date(w.published_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </time>
                  )}
                  {readTime && (
                    <>
                      <span>&middot;</span>
                      <span>{readTime} min read</span>
                    </>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-3 mt-10 justify-center items-center">
          {page > 1 && (
            <Link
              href={`/${username}/ideas?page=${page - 1}${tagSlug ? `&tag=${tagSlug}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
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
              href={`/${username}/ideas?page=${page + 1}${tagSlug ? `&tag=${tagSlug}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
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
            + New post
          </Link>
        </div>
      )}
    </main>
  )
}
