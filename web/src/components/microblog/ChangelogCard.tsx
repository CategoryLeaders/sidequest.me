/* ── ChangelogCard — feed card for changelog posts ── */
"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { MicroblogPostWithCounts } from "@/lib/microblogs";
import { relativeTime, getPostDate } from "@/lib/microblogs-utils";
import {
  CardShell,
  CardFooter,
  TypeBadge,
  TagChip,
  MetadataLine,
  EngagementBar,
} from "@/components/ui";
import { ThreeDotMenu } from "@/components/shared/ThreeDotMenu";
import { EditModal } from "@/components/shared/EditModal";
import type { SiteTag } from "@/lib/tags";

interface Props {
  post: MicroblogPostWithCounts;
  username: string;
  isOwner?: boolean;
  siteTags?: SiteTag[];
}

export function ChangelogCard({ post, username, isOwner, siteTags }: Props) {
  const router = useRouter();
  const postDate = getPostDate(post);
  const permalink = `/${username}/thoughts/${post.short_id}`;
  const [editOpen, setEditOpen] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const handleSaved = useCallback(() => {
    setShowSaved(true);
    setTimeout(() => { setShowSaved(false); router.refresh(); }, 1500);
  }, [router]);

  return (
    <CardShell variant="standard" className="group relative">
      {isOwner && (
        <div className="absolute top-3 right-3">
          <ThreeDotMenu
            contentType="microblog"
            contentId={post.id}
            permalink={permalink}
            onEdit={() => setEditOpen(true)}
            onDeleted={() => router.refresh()}
          />
        </div>
      )}

      {/* Type badge */}
      <div className="flex items-center gap-2 mb-4">
        <TypeBadge type="changelog" />
        {post.pinned && (
          <span className="text-[var(--text-2xs)] font-mono opacity-40 ml-auto">
            📌 Pinned
          </span>
        )}
      </div>

      {/* Title */}
      {post.title && (
        <h3 className="text-[var(--text-lg)] font-head font-bold leading-snug mb-3">
          {post.title}
        </h3>
      )}

      {/* Changelog items */}
      {post.changelog_items && post.changelog_items.length > 0 ? (
        <ul className="space-y-2.5 mb-3 list-none p-0">
          {post.changelog_items.map((item, idx) => (
            <li key={idx} className="flex gap-2.5">
              <span className="text-[var(--orange)] font-mono text-[0.9rem] mt-0.5 shrink-0">•</span>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--text-base)] leading-relaxed">{item.text}</p>
                {item.image?.url && (
                  <div className="mt-2 border-2 border-ink/10 overflow-hidden inline-block max-w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image.url}
                      alt=""
                      className="max-h-60 max-w-full object-contain block"
                    />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[var(--text-base)] leading-relaxed mb-3 whitespace-pre-wrap">
          {post.body}
        </p>
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
              ...(post.edited_at
                ? [
                    {
                      label: (
                        <span title={`Edited ${new Date(post.edited_at).toLocaleString("en-GB")}`}>
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
            commentCount={post.comments_enabled ? post.comment_count : undefined}
            commentHref={`${permalink}#comments`}
            shareUrl={permalink}
          />
        }
      />

      {isOwner && (
        <EditModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          contentType="microblog"
          contentId={post.id}
          initialData={{
            post_type: post.post_type,
            title: post.title,
            changelog_items: post.changelog_items,
            tags: post.tags,
            visibility: post.visibility,
          }}
          onSaved={handleSaved}
          siteTags={siteTags}
        />
      )}

      {showSaved && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 300,
            background: "var(--ink)",
            color: "var(--bg)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            fontWeight: 700,
            padding: "10px 18px",
            border: "2px solid var(--ink)",
          }}
        >
          ✓ Saved
        </div>
      )}
    </CardShell>
  );
}
