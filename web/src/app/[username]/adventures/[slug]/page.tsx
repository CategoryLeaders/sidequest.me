import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Adventure, AdventurePost, Chapter, LayoutTheme, Waypoint } from '@/lib/adventures'
import { THEME_META, STATUS_META } from '@/lib/adventures'
import { excerptFromHtml } from '@/lib/writings'
import AdventureMapWrapper from '@/components/adventures/AdventureMapWrapper'
import IndianaJonesMapWrapper from '@/components/adventures/IndianaJonesMapWrapper'
import MapModeToggle from '@/components/adventures/MapModeToggle'

interface Props {
  params: Promise<{ username: string; slug: string }>
}

export default async function AdventurePage({ params }: Props) {
  const { username, slug } = await params
  const supabase = await createClient()

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id, username')
    .eq('username', username)
    .single() as { data: { id: string; username: string } | null }

  if (!profile) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === profile.id

  // Fetch adventure
  const { data: adventure } = await (supabase as any)
    .from('adventures')
    .select('*')
    .eq('user_id', profile.id)
    .eq('slug', slug)
    .single() as { data: Adventure | null }

  if (!adventure) notFound()

  // Draft adventures: only visible to owner
  if (adventure.status === 'draft' && !isOwner) notFound()

  // Fetch posts
  const { data: posts } = await (supabase as any)
    .from('adventure_posts')
    .select('*')
    .eq('adventure_id', adventure.id)
    .order('posted_at', { ascending: true }) as { data: AdventurePost[] | null }

  const allPosts = posts ?? []
  const chapters = (adventure.chapters ?? []) as Chapter[]
  const theme = adventure.layout_theme as LayoutTheme
  const themeMeta = THEME_META[theme]
  const statusMeta = STATUS_META[adventure.status as keyof typeof STATUS_META]

  // Fetch linked writings for article_link posts
  const articlePostIds = allPosts
    .filter((p) => p.post_type === 'article_link' && p.linked_writing_id)
    .map((p) => p.linked_writing_id!)

  let linkedWritings: Map<string, { title: string; slug: string; image_url: string | null; body_html: string | null }> = new Map()
  if (articlePostIds.length > 0) {
    const { data: writings } = await (supabase as any)
      .from('writings')
      .select('id, title, slug, image_url, body_html')
      .in('id', articlePostIds) as { data: Array<{ id: string; title: string; slug: string; image_url: string | null; body_html: string | null }> | null }

    for (const w of writings ?? []) {
      linkedWritings.set(w.id, w)
    }
  }

  const formatDate = (d: string) => {
    const date = new Date(d)
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatDateTime = (d: string) => {
    const date = new Date(d)
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      + ' · '
      + date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  // Route summary
  const routeNames = (adventure.route ?? []).filter((w: { name: string }) => w.name.trim()).map((w: { name: string }) => w.name.trim())

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Draft banner — owner only */}
      {adventure.status === 'draft' && isOwner && (
        <div className="mb-6 px-4 py-3 bg-yellow/20 border-3 border-yellow font-mono text-[0.75rem] flex items-center justify-between">
          <span>👁️ <strong>Preview mode</strong> — this adventure is a draft and only visible to you.</span>
          <Link
            href={`/${username}/admin/adventures/${slug}`}
            className="font-head font-bold text-[0.7rem] uppercase text-ink no-underline hover:text-orange transition-colors"
          >
            Edit →
          </Link>
        </div>
      )}

      {/* Hero */}
      {adventure.cover_image_url && (
        <div className="w-full h-64 md:h-80 mb-6 overflow-hidden border-3 border-ink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={adventure.cover_image_url} alt={adventure.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className={`font-mono text-[0.6rem] font-bold uppercase px-2 py-0.5 ${
            adventure.status === 'live' ? 'bg-orange/20 text-orange' :
            adventure.status === 'upcoming' ? 'bg-yellow/20 text-ink' :
            adventure.status === 'complete' ? 'bg-green/20 text-green' :
            'bg-ink/10 text-ink-muted'
          }`}>
            {statusMeta.label}
          </span>
          <span className="font-mono text-[0.6rem] text-ink-muted">{themeMeta.icon} {themeMeta.label}</span>
        </div>

        <h1 className="font-head font-[900] text-[clamp(1.8rem,4vw,2.8rem)] uppercase leading-[0.95] mb-3">
          {adventure.title}
        </h1>

        {adventure.description && (
          <p className="text-[0.95rem] opacity-60 mb-3">{adventure.description}</p>
        )}

        <div className="flex flex-wrap gap-4 font-mono text-[0.7rem] text-ink-muted">
          {adventure.location_name && (
            <span>📍 {adventure.location_name}</span>
          )}
          {routeNames.length > 1 && (
            <span>🗺️ {routeNames.join(' → ')}</span>
          )}
          {adventure.start_date && (
            <span>
              📅 {formatDate(adventure.start_date)}
              {adventure.end_date && ` — ${formatDate(adventure.end_date)}`}
            </span>
          )}
          <span>📝 {allPosts.length} posts</span>
        </div>
      </div>

      {/* Owner edit link */}
      {isOwner && (
        <div className="mb-6">
          <Link
            href={`/${username}/admin/adventures/${slug}`}
            className="font-mono text-[0.65rem] text-ink-muted hover:text-orange no-underline transition-colors"
          >
            ✏️ Edit this adventure
          </Link>
        </div>
      )}

      {/* Journey map for non-map themes (shows the route overview) */}
      {theme !== 'map' && routeNames.length > 1 && (
        <div className="mb-8 border-3 border-ink overflow-hidden">
          <IndianaJonesMapWrapper waypoints={(adventure.route ?? []) as Waypoint[]} className="h-[250px]" />
        </div>
      )}

      {/* ══════ LAYOUT THEME RENDERING ══════ */}

      {/* ── Journal Timeline ── */}
      {theme === 'journal' && (() => {
        // Group posts by chapter, inserting chapter headers
        let lastChapter: number | null | undefined = -999
        return (
          <div className="relative pl-8 border-l-2 border-ink/10">
            {allPosts.map((post) => {
              const showChapterHeader = chapters.length > 0 && post.chapter_index !== lastChapter
              const chapterNode = showChapterHeader && post.chapter_index !== null && post.chapter_index !== undefined && chapters[post.chapter_index] ? (
                <div key={`ch-${post.chapter_index}`} className="mb-6 -ml-8 pl-8 relative">
                  <div className="absolute -left-[9px] top-2 w-5 h-5 rounded-full bg-orange border-2 border-bg flex items-center justify-center">
                    <span className="text-[8px] font-bold text-bg">{post.chapter_index + 1}</span>
                  </div>
                  <div className="pb-2 border-b-2 border-ink/10">
                    <span className="font-mono text-[0.6rem] text-orange uppercase">Chapter {post.chapter_index + 1}</span>
                    <h3 className="font-head font-[900] text-[1.1rem] uppercase">{chapters[post.chapter_index].title}</h3>
                  </div>
                </div>
              ) : null
              lastChapter = post.chapter_index
              return (
                <div key={post.id}>
                  {chapterNode}
                  <div className="mb-8 relative">
                    <div className={`absolute -left-[25px] top-1 w-3 h-3 rounded-full border-2 ${
                      post.post_type === 'photo' ? 'bg-yellow border-yellow' :
                      post.post_type === 'checkin' ? 'bg-orange border-orange' :
                      post.post_type === 'article_link' ? 'bg-green border-green' :
                      'bg-ink/30 border-ink/30'
                    }`} />
                    <div className="font-mono text-[0.6rem] text-ink-muted uppercase mb-2">
                      {formatDateTime(post.posted_at)}
                      {post.location_name && <span className="text-orange ml-2">📍 {post.location_name}</span>}
                    </div>
                    {/* Article link: writing preview card */}
                    {post.post_type === 'article_link' && post.linked_writing_id && linkedWritings.has(post.linked_writing_id) ? (() => {
                      const w = linkedWritings.get(post.linked_writing_id!)!
                      const excerpt = w.body_html ? excerptFromHtml(w.body_html, 180) : null
                      return (
                        <Link href={`/${username}/writings/${w.slug}`} className="block no-underline group/card">
                          <div className="border-3 border-ink/15 bg-bg-card overflow-hidden hover:border-ink/30 transition-colors">
                            {w.image_url && (
                              <div className="w-full h-40 overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={w.image_url} alt={w.title} className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300" />
                              </div>
                            )}
                            <div className="p-4">
                              <h4 className="font-head font-bold text-[0.95rem] uppercase leading-tight mb-1 group-hover/card:text-orange transition-colors">{w.title}</h4>
                              {excerpt && <p className="text-[0.78rem] opacity-50 leading-relaxed line-clamp-2">{excerpt}</p>}
                              <span className="font-mono text-[0.6rem] text-orange uppercase mt-2 inline-block">Read story →</span>
                            </div>
                          </div>
                        </Link>
                      )
                    })() : (
                      <>
                        {post.body && <p className="text-[0.92rem] leading-relaxed mb-2">{post.body}</p>}
                        {post.photos && (post.photos as { url: string }[]).length > 0 && (
                          <div className="flex gap-2 flex-wrap mt-2">
                            {(post.photos as { url: string; caption?: string }[]).map((photo, i) => (
                              <div key={i} className="border-2 border-ink/10 overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={photo.url} alt={photo.caption ?? ''} className="max-w-[300px] h-auto" />
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* ── Magazine (chapter-based) ── */}
      {theme === 'magazine' && (
        <div className="space-y-12">
          {chapters.map((ch, ci) => {
            const chapterPosts = allPosts.filter((p) => p.chapter_index === ci)
            if (chapterPosts.length === 0) return null
            return (
              <div key={ci}>
                <div className="mb-4 pb-2 border-b-3 border-ink">
                  <span className="font-mono text-[0.6rem] text-orange uppercase">Chapter {ci + 1}</span>
                  <h2 className="font-head font-[900] text-[1.4rem] uppercase">{ch.title}</h2>
                </div>
                <div className="space-y-6">
                  {chapterPosts.map((post) => (
                    <div key={post.id}>
                      {post.body && <p className="text-[0.92rem] leading-relaxed mb-2">{post.body}</p>}
                      {post.photos && (post.photos as { url: string }[]).length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-2">
                          {(post.photos as { url: string; caption?: string }[]).map((photo, i) => (
                            <div key={i} className="border-2 border-ink/10 overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={photo.url} alt={photo.caption ?? ''} className="max-w-full h-auto" />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="font-mono text-[0.55rem] text-ink-muted mt-2">
                        {formatDateTime(post.posted_at)}
                        {post.location_name && <span className="text-orange ml-2">📍 {post.location_name}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Card Stream ── */}
      {theme === 'stream' && (
        <div className="columns-1 md:columns-2 gap-4">
          {allPosts.map((post) => (
            <div key={post.id} className="break-inside-avoid mb-4 border-3 border-ink/15 p-4 bg-bg-card">
              <div className="font-mono text-[0.55rem] text-orange uppercase mb-2">
                {post.post_type === 'photo' ? '📸 Photo' : post.post_type === 'checkin' ? '📍 Check-in' : '💬 Post'}
              </div>
              {post.photos && (post.photos as { url: string }[]).length > 0 && (
                <div className="mb-3">
                  {(post.photos as { url: string; caption?: string }[]).map((photo, i) => (
                    <div key={i} className="overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.url} alt={photo.caption ?? ''} className="w-full h-auto" />
                    </div>
                  ))}
                </div>
              )}
              {post.body && <p className="text-[0.88rem] leading-relaxed mb-2">{post.body}</p>}
              <div className="font-mono text-[0.55rem] text-ink-muted">
                {post.chapter_index !== null && post.chapter_index !== undefined && chapters[post.chapter_index] && (
                  <span className="text-orange mr-2">Ch.{post.chapter_index + 1}: {chapters[post.chapter_index].title}</span>
                )}
                {formatDateTime(post.posted_at)}
                {post.location_name && <span className="ml-2">📍 {post.location_name}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Map-First ── */}
      {theme === 'map' && (() => {
        const waypoints = (adventure.route ?? []) as Waypoint[]
        const hasCoords = waypoints.some((w) => w.lat && w.lng)
        const locations = [...new Set(allPosts.filter((p) => p.location_name).map((p) => p.location_name!))]
        const noLocation = allPosts.filter((p) => !p.location_name)
        return (
          <div className="space-y-8">
            {/* Map — Journey (Indiana Jones) + Detailed toggle */}
            {waypoints.length > 1 && (
              <MapModeToggle waypoints={waypoints} hasCoords={hasCoords} />
            )}

            {/* Posts grouped by chapter (with location context) */}
            {chapters.length > 0 ? (
              chapters.map((ch, ci) => {
                const chPosts = allPosts.filter((p) => p.chapter_index === ci)
                if (chPosts.length === 0) return null
                return (
                  <div key={ci}>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-ink/10">
                      <span className="text-orange font-mono text-[0.6rem] font-bold">📍 {ci + 1}</span>
                      <span className="font-head font-bold text-[0.9rem] uppercase">{ch.title}</span>
                      <span className="font-mono text-[0.55rem] text-ink-muted ml-auto">{chPosts.length} posts</span>
                    </div>
                    <div className="space-y-4 pl-4 border-l-2 border-orange/20">
                      {chPosts.map((post) => (
                        <div key={post.id}>
                          {post.body && <p className="text-[0.88rem] leading-relaxed mb-1">{post.body}</p>}
                          {post.photos && (post.photos as { url: string }[]).length > 0 && (
                            <div className="flex gap-2 flex-wrap mt-1">
                              {(post.photos as { url: string; caption?: string }[]).map((photo, i) => (
                                <div key={i} className="w-32 h-32 border-2 border-ink/10 overflow-hidden">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={photo.url} alt={photo.caption ?? ''} className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                          {post.location_name && (
                            <div className="font-mono text-[0.55rem] text-orange mt-1">📍 {post.location_name}</div>
                          )}
                          <div className="font-mono text-[0.5rem] text-ink-muted mt-1">{formatDateTime(post.posted_at)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })
            ) : (
              /* Fallback: group by location name */
              locations.map((loc) => {
                const locPosts = allPosts.filter((p) => p.location_name === loc)
                return (
                  <div key={loc}>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-ink/10">
                      <span className="text-orange">📍</span>
                      <span className="font-head font-bold text-[0.9rem] uppercase">{loc}</span>
                      <span className="font-mono text-[0.55rem] text-ink-muted ml-auto">{locPosts.length} posts</span>
                    </div>
                    <div className="space-y-4 pl-4 border-l-2 border-orange/20">
                      {locPosts.map((post) => (
                        <div key={post.id}>
                          {post.body && <p className="text-[0.88rem] leading-relaxed mb-1">{post.body}</p>}
                          <div className="font-mono text-[0.5rem] text-ink-muted mt-1">{formatDateTime(post.posted_at)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })
            )}

            {noLocation.length > 0 && !chapters.length && (
              <div>
                <div className="font-head font-bold text-[0.85rem] uppercase text-ink-muted mb-3 pb-2 border-b-2 border-ink/10">Other posts</div>
                <div className="space-y-4 pl-4">
                  {noLocation.map((post) => (
                    <div key={post.id}>
                      {post.body && <p className="text-[0.88rem] leading-relaxed">{post.body}</p>}
                      <div className="font-mono text-[0.5rem] text-ink-muted mt-1">{formatDateTime(post.posted_at)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {/* ── Dashboard ── */}
      {theme === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
          <div className="space-y-4">
            {allPosts.map((post) => (
              <div key={post.id} className="border-3 border-ink/15 p-4 bg-bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-[0.55rem] font-bold text-orange uppercase">
                    {post.post_type === 'photo' ? '📸 Photo' : post.post_type === 'checkin' ? '📍 Check-in' : '💬 Post'}
                  </span>
                  <span className="font-mono text-[0.5rem] text-ink-muted ml-auto">{formatDateTime(post.posted_at)}</span>
                </div>
                {post.body && <p className="text-[0.88rem] leading-relaxed mb-2">{post.body}</p>}
                {post.photos && (post.photos as { url: string }[]).length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {(post.photos as { url: string; caption?: string }[]).map((photo, i) => (
                      <div key={i} className="w-20 h-20 border-2 border-ink/10 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.url} alt={photo.caption ?? ''} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                {post.location_name && (
                  <div className="font-mono text-[0.55rem] text-orange mt-2">📍 {post.location_name}</div>
                )}
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="border-3 border-ink/15 p-4 bg-bg-card">
              <div className="font-mono text-[0.6rem] uppercase text-ink-muted mb-3">Quick stats</div>
              <div className="grid grid-cols-2 gap-3">
                <div><span className="font-head font-[900] text-[1.2rem] text-orange">{allPosts.length}</span><br/><span className="font-mono text-[0.55rem] text-ink-muted">Posts</span></div>
                <div><span className="font-head font-[900] text-[1.2rem] text-orange">{allPosts.filter(p => p.photos && (p.photos as unknown[]).length > 0).length}</span><br/><span className="font-mono text-[0.55rem] text-ink-muted">Photo posts</span></div>
                <div><span className="font-head font-[900] text-[1.2rem] text-orange">{[...new Set(allPosts.filter(p => p.location_name).map(p => p.location_name))].length}</span><br/><span className="font-mono text-[0.55rem] text-ink-muted">Locations</span></div>
                {chapters.length > 0 && (
                  <div><span className="font-head font-[900] text-[1.2rem] text-orange">{chapters.length}</span><br/><span className="font-mono text-[0.55rem] text-ink-muted">Chapters</span></div>
                )}
              </div>
            </div>
            {routeNames.length > 1 && (
              <div className="border-3 border-ink/15 p-4 bg-bg-card">
                <div className="font-mono text-[0.6rem] uppercase text-ink-muted mb-2">Route</div>
                <div className="font-mono text-[0.7rem] leading-relaxed">{routeNames.join(' → ')}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {allPosts.length === 0 && (
        <p className="font-mono text-[0.78rem] opacity-40 text-center py-12">
          No posts in this adventure yet.
          {isOwner && (
            <> <Link href={`/${username}/admin/adventures/${slug}`} className="text-orange no-underline">Add some →</Link></>
          )}
        </p>
      )}
    </div>
  )
}
