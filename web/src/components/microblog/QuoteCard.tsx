/* ── QuoteCard — feed card for quote posts ── [SQ.S-W-2603-0064] */
"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Quote } from "@/lib/thoughts-types";
import { relativeTime } from "@/lib/microblogs-utils";
import {
  CardShell,
  CardFooter,
  TypeBadge,
  TagChip,
  MetadataLine,
} from "@/components/ui";
import { ThreeDotMenu } from "@/components/shared/ThreeDotMenu";
import { EditModal } from "@/components/shared/EditModal";

interface Props {
  quote: Quote;
  username: string;
  isOwner?: boolean;
}

export function QuoteCard({ quote, username, isOwner }: Props) {
  const router = useRouter();
  const permalink = `/${username}/thoughts/${quote.short_id}`;
  const postDate = quote.published_at ?? quote.created_at;
  const [editOpen, setEditOpen] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const handleSaved = useCallback(() => {
    setShowSaved(true);
    setTimeout(() => { setShowSaved(false); router.refresh(); }, 1500);
  }, [router]);

  return (
    <CardShell variant="standard" className="relative">
      {isOwner && (
        <div className="absolute top-3 right-3">
          <ThreeDotMenu
            contentType="quote"
            contentId={quote.id}
            onEdit={() => setEditOpen(true)}
            onDeleted={() => router.refresh()}
          />
        </div>
      )}
      {/* Type badge */}
      <div className="flex items-center gap-2 mb-3">
        <TypeBadge type="quote" />
        {quote.pinned && (
          <span className="text-[var(--text-2xs)] font-mono opacity-40 ml-auto">📌 Pinned</span>
        )}
      </div>

      {/* Large quotation mark + quote text */}
      <div className="mb-4 text-center">
        <blockquote
          className="text-[1.35rem] font-[400] italic opacity-60"
          style={{ fontFamily: "var(--font-quote)", lineHeight: 1.6, textAlign: "center" }}
        >
          {quote.quote_text}
        </blockquote>
      </div>

      {/* Source attribution — right-aligned */}
      <div className="mb-3 text-[var(--text-sm)] opacity-60 text-right">
        <span>— </span>
        <span className="font-bold">{quote.source_name}</span>
        {quote.source_work && (
          <span>
            {", "}
            {quote.source_url ? (
              <a
                href={quote.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-80"
              >
                {quote.source_work}
              </a>
            ) : (
              <em>{quote.source_work}</em>
            )}
          </span>
        )}
        {quote.source_year && <span> ({quote.source_year})</span>}
      </div>

      {/* Commentary */}
      {quote.commentary && (
        <p className="text-[var(--text-base)] leading-relaxed mb-3">
          {quote.commentary}
        </p>
      )}

      {/* Tags */}
      {quote.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {quote.tags.map((tag) => (
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

      {isOwner && (
        <EditModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          contentType="quote"
          contentId={quote.id}
          initialData={{
            quote_text: quote.quote_text,
            source_name: quote.source_name,
            source_work: quote.source_work,
            commentary: quote.commentary,
            tags: quote.tags,
            visibility: quote.visibility,
          }}
          onSaved={handleSaved}
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
