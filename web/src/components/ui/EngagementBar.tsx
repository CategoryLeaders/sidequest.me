/* ── EngagementBar — reactions + comments + share ── */
"use client";

import { useState } from "react";
import Link from "next/link";

interface ReactionCount {
  emoji: string;
  count: number;
}

interface Props {
  reactions?: ReactionCount[];
  commentCount?: number;
  commentHref?: string;
  shareUrl?: string;
  className?: string;
}

export function EngagementBar({
  reactions,
  commentCount,
  commentHref,
  shareUrl,
  className = "",
}: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (!shareUrl) return;
    const fullUrl = `${window.location.origin}${shareUrl}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: do nothing
    }
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Reactions */}
      {reactions && reactions.length > 0 && (
        <span className="inline-flex items-center gap-1 text-[var(--text-xs)] font-mono opacity-50">
          {reactions
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map((r) => (
              <span key={r.emoji} title={`${r.emoji} ${r.count}`}>
                {r.emoji}
              </span>
            ))}
          <span className="opacity-60">
            {reactions.reduce((sum, r) => sum + r.count, 0)}
          </span>
        </span>
      )}

      {/* Comment count */}
      {commentCount !== undefined && commentCount > 0 && commentHref && (
        <Link
          href={commentHref}
          className="text-[var(--text-xs)] font-mono opacity-40 hover:opacity-70 transition-opacity no-underline"
        >
          💬 {commentCount}
        </Link>
      )}

      {/* Share link */}
      {shareUrl && (
        <button
          onClick={handleShare}
          className="text-[var(--text-xs)] font-mono opacity-30 hover:opacity-60 transition-opacity"
          title={copied ? "Copied!" : "Copy link"}
        >
          {copied ? "✓" : "🔗"}
        </button>
      )}
    </div>
  );
}
