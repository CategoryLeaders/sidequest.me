/* ── MicroblogCard — feed card for microblog posts ── [SQ.S-W-2603-0062] */

import Link from "next/link";
import type { MicroblogPostWithCounts } from "@/lib/microblogs";
import { relativeTime, getPostDate } from "@/lib/microblogs";
import {
  CardShell,
  CardFooter,
  TypeBadge,
  TagChip,
  MetadataLine,
  EngagementBar,
  ImageGrid,
  ActionMenu,
} from "@/components/ui";

interface Props {
  post: MicroblogPostWithCounts;
  username: string;
  isOwner?: boolean;
}

export function MicroblogCard({ post, username, isOwner }: Props) {
  const postDate = getPostDate(post);
  const permalink = `/${username}/thoughts/${post.short_id}`;

  return (
    <CardShell variant="standard" className="group relative">
      {isOwner && (
        <ActionMenu
          shareUrl={permalink}
          className="absolute top-3 right-3"
        />
      )}
      {/* Type indicator */}
      <div className="flex items-center gap-2 mb-3">
        <TypeBadge type="microblog" />
        {post.source !== "native" && (
          <span className="text-[var(--text-2xs)] font-mono opacity-30">
            via {post.source === "facebook_import" ? "Facebook" : "Telegram"}
          </span>
        )}
        {post.pinned && (
          <span className="text-[var(--text-2xs)] font-mono opacity-40 ml-auto">
            📌 Pinned
          </span>
        )}
      </div>

      {/* Body */}
      {post.body_html ? (
        <div
          className="text-[var(--text-base)] leading-relaxed mb-3 prose-sm prose-a:text-[var(--orange)] prose-a:underline"
          dangerouslySetInnerHTML={{ __html: post.body_html }}
        />
      ) : (
        <p className="text-[var(--text-base)] leading-relaxed mb-3 whitespace-pre-wrap">
          {post.body}
        </p>
      )}

      {/* Images */}
      {post.images.length > 0 && (
        <ImageGrid
          images={post.images.map((img) => ({
            url: img.url,
            alt: img.alt_text ?? "",
          }))}
          maxVisible={4}
          className="mb-3"
        />
      )}

      {/* Link preview */}
      {post.link_url && post.link_preview && (
        <a
          href={post.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block border-2 border-ink/[var(--opacity-dim)] p-3 mb-3 bg-ink/[var(--opacity-faint)] hover:bg-ink/[var(--opacity-subtle)] transition-colors no-underline"
        >
          <span className="text-[var(--text-xs)] font-mono opacity-40 block mb-1">
            {post.link_preview.domain}
          </span>
          <span className="text-[0.85rem] font-bold block mb-0.5">
            {post.link_preview.title}
          </span>
          {post.link_preview.description && (
            <span className="text-[var(--text-sm)] opacity-60 block line-clamp-2">
              {post.link_preview.description}
            </span>
          )}
        </a>
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.tags.map((tag) => (
            <TagChip
              key={tag}
              label={tag}
              href={`/${username}/thoughts/tags/${encodeURIComponent(tag.toLowerCase())}`}
            />
          ))}
        </div>
      )}

      {/* Paired writing link */}
      {post.paired_writing_id && (
        <Link
          href={`/${username}/writings/${post.paired_writing_id}`}
          className="text-[var(--text-sm)] text-[var(--orange)] font-mono mb-3 block hover:underline"
        >
          Read more →
        </Link>
      )}

      {/* Footer: timestamp + engagement */}
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
              ...(post.edited_at
                ? [
                    {
                      label: (
                        <span
                          title={`Edited ${new Date(post.edited_at).toLocaleString("en-GB")}`}
                        >
                          edited
                        </span>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        }
        right={
          <EngagementBar
            reactions={
              post.reactions_enabled && post.reaction_counts.length > 0
                ? post.reaction_counts.map((r) => ({
                    emoji: r.emoji,
                    count: r.count,
                  }))
                : undefined
            }
            commentCount={
              post.comments_enabled ? post.comment_count : undefined
            }
            commentHref={`${permalink}#comments`}
            shareUrl={permalink}
          />
        }
      />
    </CardShell>
  );
}
