/* ── BookmarkCard — feed card for bookmark posts ── [SQ.S-W-2603-0064] */

import Link from "next/link";
import type { Bookmark } from "@/lib/thoughts-types";
import { relativeTime } from "@/lib/microblogs";
import { ContentActions } from "@/components/shared/ContentActions";

interface Props {
  bookmark: Bookmark;
  username: string;
  isOwner?: boolean;
}

export function BookmarkCard({ bookmark, username, isOwner = false }: Props) {
  const permalink = `/${username}/thoughts/${bookmark.short_id}`;
  const postDate = bookmark.published_at ?? bookmark.created_at;

  return (
    <article
      className="border-3 border-ink bg-[var(--bg-card)] overflow-hidden"
      style={{ boxShadow: '4px 4px 0 #1a1a1a' }}
    >
      {/* Header: type badge + date */}
      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-ink/8">
        <span
          className="font-mono text-[0.58rem] font-bold uppercase tracking-widest"
          style={{ color: '#2d6a4f' }}
        >
          🔖 Bookmark
        </span>
        {bookmark.pinned && (
          <span className="font-mono text-[0.55rem] text-ink/35">📌</span>
        )}
        {isOwner && (
          <span className="ml-auto">
            <ContentActions
              contentType="bookmark"
              contentId={bookmark.id}
              editData={{
                commentary: bookmark.commentary,
                og_title: bookmark.og_title,
                og_description: bookmark.og_description,
                tags: bookmark.tags,
                visibility: bookmark.visibility,
              }}
            />
          </span>
        )}
        <Link
          href={permalink}
          className={`font-mono text-[0.6rem] text-ink/35 hover:text-ink/60 transition-colors no-underline${isOwner ? '' : ' ml-auto'}`}
        >
          <time dateTime={postDate} title={new Date(postDate).toLocaleString("en-GB")}>
            {new Date(postDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </time>
          <span className="ml-1.5 opacity-70">{relativeTime(postDate)}</span>
        </Link>
      </div>

      {/* OG Preview */}
      <div className="px-5 pt-3 pb-1">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block border-2 border-ink/30 p-4 bg-ink/[0.03] hover:bg-ink/[0.06] transition-colors no-underline"
        >
          {bookmark.og_favicon_url && (
            <div className="flex items-center gap-2 mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bookmark.og_favicon_url} alt="" className="w-4 h-4" />
              <span className="text-[0.65rem] font-mono opacity-40">
                {bookmark.og_domain}
              </span>
            </div>
          )}
          {!bookmark.og_favicon_url && bookmark.og_domain && (
            <span className="text-[0.65rem] font-mono opacity-40 block mb-2">
              {bookmark.og_domain}
            </span>
          )}
          {bookmark.og_title && (
            <span className="text-[0.88rem] font-bold block mb-1">
              {bookmark.og_title}
            </span>
          )}
          {bookmark.og_description && (
            <span className="text-[0.78rem] opacity-60 block line-clamp-2">
              {bookmark.og_description}
            </span>
          )}
          {bookmark.og_image_url && (
            <div className="mt-2 border border-ink/10 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bookmark.og_image_url}
                alt=""
                className="w-full h-32 object-cover"
              />
            </div>
          )}
        </a>
      </div>

      {/* Commentary */}
      {bookmark.commentary && (
        <p className="text-[0.85rem] italic opacity-70 leading-relaxed mx-5 mt-3 pl-3 border-l-2 border-ink/15">
          {bookmark.commentary}
        </p>
      )}

      {/* Tags */}
      {bookmark.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-5 pt-3">
          {bookmark.tags.map((tag) => (
            <Link
              key={tag}
              href={`/${username}/thoughts/tags/${encodeURIComponent(tag.toLowerCase())}`}
              className="inline-block text-[0.6rem] px-2 py-0.5 border border-dashed border-ink/25 text-ink/45 bg-ink/[0.04] font-mono hover:border-ink/40 hover:text-ink/60 transition-colors no-underline"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-end px-5 pt-3 pb-4 mt-1 border-t border-ink/10">
        <button
          className="text-[0.65rem] font-mono opacity-25 hover:opacity-55 transition-opacity"
          title="Copy link"
        >
          🔗
        </button>
      </div>
    </article>
  );
}
