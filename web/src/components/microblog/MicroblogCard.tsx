/* ── MicroblogCard — feed card for microblog posts ── [SQ.S-W-2603-0062] */

import Link from "next/link";
import Image from "next/image";
import type { MicroblogPostWithCounts } from "@/lib/microblogs";
import { relativeTime, getPostDate } from "@/lib/microblogs";
import { ReactionBar } from "./ReactionBar";

interface Props {
  post: MicroblogPostWithCounts;
  username: string;
}

export function MicroblogCard({ post, username }: Props) {
  const postDate = getPostDate(post);
  const permalink = `/${username}/thoughts/${post.short_id}`;

  return (
    <article className="border-3 border-ink p-5 bg-[var(--bg-card)] relative group">
      {/* Type indicator */}
      <div className="flex items-center gap-2 mb-3">
        <span className="sticker sticker-orange text-[0.55rem] !px-2 !py-0.5 !border-2">
          Microblog
        </span>
        {post.source !== "native" && (
          <span className="text-[0.55rem] font-mono opacity-30">
            via {post.source === "facebook_import" ? "Facebook" : "Telegram"}
          </span>
        )}
        {post.pinned && (
          <span className="text-[0.55rem] font-mono opacity-40 ml-auto">
            📌 Pinned
          </span>
        )}
      </div>

      {/* Body */}
      {post.body_html ? (
        <div
          className="text-[0.92rem] leading-relaxed mb-3 prose-sm prose-a:text-[var(--orange)] prose-a:underline"
          dangerouslySetInnerHTML={{ __html: post.body_html }}
        />
      ) : (
        <p className="text-[0.92rem] leading-relaxed mb-3 whitespace-pre-wrap">
          {post.body}
        </p>
      )}

      {/* Images */}
      {post.images.length > 0 && (
        <div
          className={`grid gap-2 mb-3 ${
            post.images.length === 1
              ? "grid-cols-1"
              : post.images.length === 2
                ? "grid-cols-2"
                : "grid-cols-2"
          }`}
        >
          {post.images.slice(0, 4).map((img, i) => (
            <div
              key={i}
              className="border-2 border-ink overflow-hidden relative aspect-[4/3]"
            >
              <Image
                src={img.url}
                alt={img.alt_text ?? ""}
                fill
                className="object-cover"
                sizes="(max-width: 800px) 50vw, 400px"
              />
            </div>
          ))}
        </div>
      )}

      {/* Link preview */}
      {post.link_url && post.link_preview && (
        <a
          href={post.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block border-2 border-ink/30 p-3 mb-3 bg-ink/[0.03] hover:bg-ink/[0.06] transition-colors no-underline"
        >
          <span className="text-[0.65rem] font-mono opacity-40 block mb-1">
            {post.link_preview.domain}
          </span>
          <span className="text-[0.85rem] font-bold block mb-0.5">
            {post.link_preview.title}
          </span>
          {post.link_preview.description && (
            <span className="text-[0.78rem] opacity-60 block line-clamp-2">
              {post.link_preview.description}
            </span>
          )}
        </a>
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/${username}/thoughts/tags/${encodeURIComponent(tag.toLowerCase())}`}
              className="inline-block text-[0.6rem] px-2 py-0.5 border border-dashed border-ink/25 text-ink/45 bg-ink/[0.04] font-mono hover:border-ink/40 hover:text-ink/60 transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Paired writing link */}
      {post.paired_writing_id && (
        <Link
          href={`/${username}/writings/${post.paired_writing_id}`}
          className="text-[0.78rem] text-[var(--orange)] font-mono mb-3 block hover:underline"
        >
          Read more →
        </Link>
      )}

      {/* Footer: timestamp + engagement */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-ink/10">
        <div className="flex items-center gap-3">
          <Link
            href={permalink}
            className="text-[0.6rem] font-mono opacity-40 hover:opacity-70 transition-opacity no-underline"
          >
            <time
              dateTime={postDate}
              title={new Date(postDate).toLocaleString("en-GB")}
            >
              {relativeTime(postDate)}
            </time>
          </Link>
          {post.edited_at && (
            <span
              className="text-[0.55rem] font-mono opacity-30"
              title={`Edited ${new Date(post.edited_at).toLocaleString("en-GB")}`}
            >
              edited
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Reactions */}
          {post.reactions_enabled && post.reaction_counts.length > 0 && (
            <ReactionBar counts={post.reaction_counts} />
          )}

          {/* Comment count */}
          {post.comments_enabled && post.comment_count > 0 && (
            <Link
              href={`${permalink}#comments`}
              className="text-[0.65rem] font-mono opacity-40 hover:opacity-70 transition-opacity no-underline"
            >
              💬 {post.comment_count}
            </Link>
          )}

          {/* Share link */}
          <button
            className="text-[0.65rem] font-mono opacity-30 hover:opacity-60 transition-opacity"
            title="Copy link"
          >
            🔗
          </button>
        </div>
      </div>
    </article>
  );
}
