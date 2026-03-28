/* ── BookmarkCard — feed card for bookmark posts ── [SQ.S-W-2603-0064] */

import Link from "next/link";
import type { Bookmark } from "@/lib/thoughts-types";
import { relativeTime } from "@/lib/microblogs";
import {
  CardShell,
  CardFooter,
  TypeBadge,
  TagChip,
  MetadataLine,
  ActionMenu,
} from "@/components/ui";

interface Props {
  bookmark: Bookmark;
  username: string;
  isOwner?: boolean;
}

export function BookmarkCard({ bookmark, username, isOwner }: Props) {
  const permalink = `/${username}/thoughts/${bookmark.short_id}`;
  const postDate = bookmark.published_at ?? bookmark.created_at;

  return (
    <CardShell variant="standard" className="relative">
      {isOwner && (
        <ActionMenu
          shareUrl={permalink}
          className="absolute top-3 right-3"
        />
      )}
      {/* Type badge */}
      <div className="flex items-center gap-2 mb-3">
        <TypeBadge type="bookmark" />
        {bookmark.pinned && (
          <span className="text-[var(--text-2xs)] font-mono opacity-40 ml-auto">📌 Pinned</span>
        )}
      </div>

      {/* OG Preview */}
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block border-2 border-ink/[var(--opacity-dim)] p-4 mb-3 bg-ink/[var(--opacity-faint)] hover:bg-ink/[var(--opacity-subtle)] transition-colors no-underline"
      >
        {bookmark.og_favicon_url && (
          <div className="flex items-center gap-2 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bookmark.og_favicon_url} alt="" className="w-4 h-4" />
            <span className="text-[var(--text-xs)] font-mono opacity-40">
              {bookmark.og_domain}
            </span>
          </div>
        )}
        {!bookmark.og_favicon_url && bookmark.og_domain && (
          <span className="text-[var(--text-xs)] font-mono opacity-40 block mb-2">
            {bookmark.og_domain}
          </span>
        )}
        {bookmark.og_title && (
          <span className="text-[var(--text-base)] font-bold block mb-1">
            {bookmark.og_title}
          </span>
        )}
        {bookmark.og_description && (
          <span className="text-[var(--text-sm)] opacity-60 block line-clamp-2">
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

      {/* Commentary */}
      {bookmark.commentary && (
        <p className="text-[0.85rem] italic opacity-70 leading-relaxed mb-3 pl-3 border-l-2 border-ink/[var(--opacity-muted)]">
          {bookmark.commentary}
        </p>
      )}

      {/* Tags */}
      {bookmark.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {bookmark.tags.map((tag) => (
            <TagChip
              key={tag}
              label={tag}
              href={`/${username}/thoughts/tags/${encodeURIComponent(tag.toLowerCase())}`}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <CardFooter
        left={
          <MetadataLine
            items={[
              {
                label: (
                  <Link
                    href={permalink}
                    className="opacity-100 hover:opacity-70 transition-opacity no-underline"
                  >
                    <time
                      dateTime={postDate}
                      title={new Date(postDate).toLocaleString("en-GB")}
                    >
                      {relativeTime(postDate)}
                    </time>
                  </Link>
                ),
              },
            ]}
          />
        }
      />
    </CardShell>
  );
}
