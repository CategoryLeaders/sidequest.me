/* ── MicroblogCard — BD-2 mashup redesign ── [SQ.S-W-2603-0062] */

import Link from 'next/link'
import type { MicroblogPostWithCounts } from '@/lib/microblogs'
import { relativeTime, getPostDate } from '@/lib/microblogs'
import { ReactionBar } from './ReactionBar'
import { ExpandableBody } from './ExpandableBody'
import { MicroblogImageMosaic } from './MicroblogImageMosaic'
import { ContentActions } from '@/components/shared/ContentActions'

interface Props {
  post: MicroblogPostWithCounts
  username: string
  isOwner?: boolean
}

// ── Context configuration ─────────────────────────────────────────────────────
const CTX = {
  adventure: {
    icon: '🗺',
    label: 'Adventure',
    bannerBg: '#1a3d2e',
    bannerText: '#a8d5a2',
    barBorder: '#2a7a4a',
    barBg: 'rgba(42,122,74,0.05)',
    chipText: '#2a7a4a',
    leftBorder: '#2a7a4a',
  },
  project: {
    icon: '⚙️',
    label: 'Project',
    bannerBg: '#1a2840',
    bannerText: '#a8c4e0',
    barBorder: '#2a4a7a',
    barBg: 'rgba(42,74,122,0.05)',
    chipText: '#2a4a7a',
    leftBorder: '#2a4a7a',
  },
  writing: {
    icon: '✍️',
    label: 'Writing',
    bannerBg: '#2a1a3d',
    bannerText: '#c4a8e0',
    barBorder: '#6a2a8a',
    barBg: 'rgba(106,42,138,0.05)',
    chipText: '#6a2a8a',
    leftBorder: '#6a2a8a',
  },
  job_role: {
    icon: '💼',
    label: 'Role',
    bannerBg: '#2a1a1a',
    bannerText: '#e0c4a8',
    barBorder: '#8a4a2a',
    barBg: 'rgba(138,74,42,0.05)',
    chipText: '#8a4a2a',
    leftBorder: '#8a4a2a',
  },
} as const

type CtxType = keyof typeof CTX

function ctxHref(username: string, type: string, id: string | null): string | null {
  if (!id) return null
  if (type === 'adventure') return `/${username}/adventures/${id}`
  if (type === 'project') return `/${username}/projects/${id}`
  if (type === 'writing') return `/${username}/writings/${id}`
  return null
}

function sourceLabel(source: string): string | null {
  if (source === 'facebook_import') return 'Facebook'
  if (source === 'telegram_channel_import' || source === 'telegram_group_import') return 'Telegram'
  return null
}

// ── Dark date strip under images ──────────────────────────────────────────────
function DateStrip({
  postDate,
  locationName,
  source,
  permalink,
  editedAt,
}: {
  postDate: string
  locationName: string | null
  source: string
  permalink: string
  editedAt: string | null
}) {
  const src = sourceLabel(source)
  return (
    <div
      className="flex items-center gap-2 flex-wrap px-4 py-2 font-mono text-[0.68rem]"
      style={{ background: '#1a1a1a', color: '#bbb' }}
    >
      <Link
        href={permalink}
        className="hover:text-white transition-colors no-underline"
        style={{ color: '#bbb' }}
      >
        <time dateTime={postDate} title={new Date(postDate).toLocaleString('en-GB')}>
          {new Date(postDate).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </time>
        <span className="ml-1.5 opacity-50">{relativeTime(postDate)}</span>
      </Link>
      {locationName && (
        <>
          <span style={{ color: '#444' }}>·</span>
          <span style={{ color: '#999' }}>📍 {locationName}</span>
        </>
      )}
      {editedAt && (
        <>
          <span style={{ color: '#444' }}>·</span>
          <span
            style={{ color: '#666' }}
            title={`Edited ${new Date(editedAt).toLocaleString('en-GB')}`}
          >
            edited
          </span>
        </>
      )}
      {src && (
        <span className="ml-auto" style={{ color: '#555' }}>
          via {src}
        </span>
      )}
    </div>
  )
}

// ── Shared footer ─────────────────────────────────────────────────────────────
function CardFooter({
  post,
  permalink,
  padX = 'px-4',
}: {
  post: MicroblogPostWithCounts
  permalink: string
  padX?: string
}) {
  return (
    <div className={`flex items-center justify-between ${padX} pt-3 pb-4 mt-1 border-t border-ink/10`}>
      <div className="flex items-center gap-3">
        {post.reactions_enabled && post.reaction_counts.length > 0 && (
          <ReactionBar counts={post.reaction_counts} />
        )}
        {post.comments_enabled && post.comment_count > 0 && (
          <Link
            href={`${permalink}#comments`}
            className="text-[0.65rem] font-mono opacity-40 hover:opacity-70 transition-opacity no-underline"
          >
            💬 {post.comment_count}
          </Link>
        )}
      </div>
      <button
        className="text-[0.65rem] font-mono opacity-25 hover:opacity-55 transition-opacity"
        title="Copy link"
      >
        🔗
      </button>
    </div>
  )
}

// ── Shared extras (link preview, writing link, tags) ─────────────────────────
function CardExtras({
  post,
  username,
  padX = 'px-4',
}: {
  post: MicroblogPostWithCounts
  username: string
  padX?: string
}) {
  return (
    <>
      {post.link_url && (
        <div className={`${padX} pt-3`}>
          <a
            href={post.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block border-2 border-ink/20 p-3 bg-ink/[0.03] hover:bg-ink/[0.06] transition-colors no-underline"
          >
            {post.link_preview ? (
              <div className="flex gap-3 items-start">
                {post.link_preview.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.link_preview.image}
                    alt=""
                    className="w-16 h-16 object-cover flex-shrink-0 border border-ink/10"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-[0.6rem] font-mono opacity-40 block mb-0.5">
                    {post.link_preview.domain}
                  </span>
                  <span className="text-[0.82rem] font-bold block mb-0.5">
                    {post.link_preview.title}
                  </span>
                  {post.link_preview.description && (
                    <span className="text-[0.75rem] opacity-55 block line-clamp-2">
                      {post.link_preview.description}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <span className="text-[0.78rem] font-mono text-[var(--orange)] break-all">
                {post.link_url}
              </span>
            )}
          </a>
        </div>
      )}

      {post.paired_writing_id && (post as any).paired_writing_slug && (
        <div className={`${padX} pt-3`}>
          <Link
            href={`/${username}/writings/${(post as any).paired_writing_slug}`}
            className="text-[0.78rem] text-[var(--orange)] font-mono hover:underline block no-underline"
          >
            Read more →
          </Link>
        </div>
      )}

      {post.tags.length > 0 && (
        <div className={`flex flex-wrap gap-1.5 ${padX} pt-3`}>
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/${username}/thoughts/tags/${encodeURIComponent(tag.toLowerCase())}`}
              className="text-[0.6rem] px-2 py-0.5 border border-dashed border-ink/25 text-ink/45 bg-ink/[0.04] font-mono hover:border-ink/40 hover:text-ink/60 transition-colors no-underline"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

// ── Inline context chip ───────────────────────────────────────────────────────
function InlineCtxChip({
  ctxCfg,
  ctxLink,
  ctxDisplayName,
}: {
  ctxCfg: { bannerBg: string; bannerText: string; icon: string }
  ctxLink: string
  ctxDisplayName: string
}) {
  return (
    <Link
      href={ctxLink}
      className="no-underline hover:opacity-75 transition-opacity"
      style={{
        background: ctxCfg.bannerBg,
        color: ctxCfg.bannerText,
        padding: '2px 7px',
        fontSize: '0.52rem',
        fontFamily: 'monospace',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
      }}
    >
      <span>{ctxCfg.icon}</span>
      <span>{ctxDisplayName}</span>
    </Link>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function MicroblogCard({ post, username, isOwner = false }: Props) {
  const postDate = getPostDate(post)
  const permalink = `/${username}/thoughts/${post.short_id}`
  const hasImages = post.images.length > 0

  const ctxType = post.context_type as CtxType | null
  const ctxCfg = ctxType && CTX[ctxType] ? CTX[ctxType] : null
  const ctxLink = ctxType ? ctxHref(username, ctxType, post.context_id) : null
  const ctxDisplayName =
    ctxType === 'adventure' ? 'Adventure'
    : ctxType === 'project' ? 'Project'
    : ctxType === 'writing' ? 'Writing'
    : ctxCfg?.label ?? ''

  // ── CHANGELOG POSTS ─────────────────────────────────────────────────────────
  if (post.post_type === 'changelog') {
    const items = (post.changelog_items ?? []) as { text: string; image?: { url: string } }[]
    return (
      <article
        className="border-3 border-ink bg-[var(--bg-card)] overflow-hidden"
        style={{ boxShadow: '4px 4px 0 #1a1a1a' }}
      >
        {/* Header: type badge + context chip + date */}
        <div className="flex items-center gap-2 flex-wrap px-4 pt-3 pb-2.5 border-b-2 border-ink/10">
          <span className="font-mono text-[0.58rem] font-bold uppercase tracking-widest text-[var(--orange)]">📋 Changelog</span>
          {ctxCfg && ctxLink && (
            <InlineCtxChip ctxCfg={ctxCfg} ctxLink={ctxLink} ctxDisplayName={ctxDisplayName} />
          )}
          {isOwner && (
            <ContentActions
              contentType="microblog"
              contentId={post.id}
              editData={{ body: post.body, tags: post.tags, visibility: post.visibility }}
            />
          )}
          <span className="ml-auto font-mono text-[0.6rem] text-ink/35">
            {new Date(postDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            <span className="ml-1 opacity-70"> · {relativeTime(postDate)}</span>
          </span>
        </div>

        {/* Title */}
        <div className="px-4 pt-3 pb-1">
          <Link href={permalink} className="no-underline group">
            <h3 className="font-head font-[900] text-[1.05rem] uppercase leading-tight group-hover:text-[var(--orange)] transition-colors">
              {post.title}
            </h3>
          </Link>
        </div>

        {/* Change items */}
        <div className="px-4 py-3 space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2.5">
              <span className="text-[var(--orange)] font-mono text-[0.8rem] mt-0.5 shrink-0">•</span>
              <div className="flex-1 min-w-0">
                <p className="text-[0.85rem] leading-relaxed">{item.text}</p>
                {item.image?.url && (
                  <div className="mt-2 border-2 border-ink/10 overflow-hidden inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image.url}
                      alt=""
                      className="max-h-64 max-w-full object-contain block"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-4 pb-3">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/${username}/thoughts/tags/${encodeURIComponent(tag.toLowerCase())}`}
                className="text-[0.6rem] px-2 py-0.5 border border-dashed border-ink/25 text-ink/45 bg-ink/[0.04] font-mono hover:border-ink/40 hover:text-ink/60 transition-colors no-underline"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        <CardFooter post={post} permalink={permalink} />
      </article>
    )
  }

  // ── IMAGE POSTS ─────────────────────────────────────────────────────────────
  if (hasImages) {
    return (
      <article
        className="border-3 border-ink bg-[var(--bg-card)] overflow-hidden"
        style={{ boxShadow: '4px 4px 0 #1a1a1a' }}
      >
        {/* Header: type badge + context chip + date + owner */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-ink/8">
          <span className="font-mono text-[0.58rem] font-bold uppercase tracking-widest text-[var(--orange)]">📷 Photo</span>
          {ctxCfg && ctxLink && (
            <InlineCtxChip ctxCfg={ctxCfg} ctxLink={ctxLink} ctxDisplayName={ctxDisplayName} />
          )}
          {post.pinned && (
            <span className="font-mono text-[0.48rem] uppercase tracking-wider px-2 py-0.5 bg-[var(--orange)] text-white">
              📌 Pinned
            </span>
          )}
          {isOwner && (
            <span className="ml-auto">
              <ContentActions
                contentType="microblog"
                contentId={post.id}
                editData={{
                  body: post.body,
                  body_html: post.body_html,
                  media: post.images,
                  link_url: post.link_url,
                  location_name: post.location_name,
                  paired_writing_id: post.paired_writing_id ?? "",
                  tags: post.tags,
                  visibility: post.visibility,
                }}
              />
            </span>
          )}
          <span className={`font-mono text-[0.6rem] text-ink/35${isOwner ? '' : ' ml-auto'}`}>
            {new Date(postDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Full-bleed image mosaic */}
        <MicroblogImageMosaic images={post.images} />

        {/* Dark date + location strip */}
        <DateStrip
          postDate={postDate}
          locationName={post.location_name}
          source={post.source}
          permalink={permalink}
          editedAt={post.edited_at ?? null}
        />

        {/* Body */}
        {(post.body_html || post.body) && (
          <div className="px-4 pt-4 pb-1">
            <ExpandableBody
              bodyHtml={post.body_html}
              bodyText={post.body}
              textSize="text-[0.92rem]"
            />
          </div>
        )}

        <CardExtras post={post} username={username} padX="px-4" />
        <CardFooter post={post} permalink={permalink} padX="px-4" />
      </article>
    )
  }

  // ── TEXT-ONLY POSTS ──────────────────────────────────────────────────────────
  const leftBorderColor = ctxCfg ? ctxCfg.leftBorder : '#ff6b35'

  return (
    <article
      className="border-3 border-ink bg-[var(--bg-card)] overflow-hidden relative"
      style={{
        boxShadow: '4px 4px 0 #1a1a1a',
        borderLeftWidth: '6px',
        borderLeftColor: leftBorderColor,
      }}
    >
      {/* Header: type badge + context chip + location + date + metadata */}
      <div className="flex items-center flex-wrap gap-2 px-5 py-2.5 border-b border-ink/8">
        <span className="font-mono text-[0.58rem] font-bold uppercase tracking-widest text-[var(--orange)]">💭 Thought</span>
        {ctxCfg && ctxLink && (
          <InlineCtxChip ctxCfg={ctxCfg} ctxLink={ctxLink} ctxDisplayName={ctxDisplayName} />
        )}
        {post.location_name && (
          <span className="font-mono text-[0.58rem] text-ink/40">📍 {post.location_name}</span>
        )}
        <Link
          href={permalink}
          className="font-mono text-[0.6rem] text-ink/35 hover:text-ink/60 transition-colors no-underline ml-auto"
        >
          <time dateTime={postDate} title={new Date(postDate).toLocaleString('en-GB')}>
            {new Date(postDate).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </time>
          <span className="ml-1.5 opacity-70">{relativeTime(postDate)}</span>
        </Link>
        {post.pinned && <span className="font-mono text-[0.55rem] text-ink/35">📌</span>}
        {isOwner && (
          <span>
            <ContentActions
              contentType="microblog"
              contentId={post.id}
              editData={{
                body: post.body,
                body_html: post.body_html,
                link_url: post.link_url,
                location_name: post.location_name,
                tags: post.tags,
                visibility: post.visibility,
              }}
            />
          </span>
        )}
        {post.edited_at && (
          <span
            className="font-mono text-[0.55rem] text-ink/25"
            title={`Edited ${new Date(post.edited_at).toLocaleString('en-GB')}`}
          >
            edited
          </span>
        )}
        {sourceLabel(post.source) && (
          <span className="font-mono text-[0.55rem] text-ink/25">
            via {sourceLabel(post.source)}
          </span>
        )}
      </div>

      {/* Body — larger text for text-only posts */}
      <div className="px-5 pt-4 pb-1">
        <ExpandableBody
          bodyHtml={post.body_html}
          bodyText={post.body}
          textSize="text-[1rem]"
        />
      </div>

      <CardExtras post={post} username={username} padX="px-5" />
      <CardFooter post={post} permalink={permalink} padX="px-5" />
    </article>
  )
}
