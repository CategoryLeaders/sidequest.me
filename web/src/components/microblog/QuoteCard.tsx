/* ── QuoteCard — feed card for quote posts ── [SQ.S-W-2603-0064] */

import Link from "next/link";
import type { Quote } from "@/lib/thoughts-types";
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
  quote: Quote;
  username: string;
  isOwner?: boolean;
}

export function QuoteCard({ quote, username, isOwner }: Props) {
  const permalink = `/${username}/thoughts/${quote.short_id}`;
  const postDate = quote.published_at ?? quote.created_at;

  return (
    <CardShell variant="standard" className="relative">
      {isOwner && (
        <ActionMenu
          shareUrl={permalink}
          editHref={`/${username}/admin/quotes/${quote.id}`}
          className="absolute top-3 right-3"
        />
      )}
      {/* Type badge */}
      <div className="flex items-center gap-2 mb-3">
        <TypeBadge type="quote" />
        {quote.pinned && (
          <span className="text-[var(--text-2xs)] font-mono opacity-40 ml-auto">📌 Pinned</span>
        )}
      </div>

      {/* Large quotation mark + quote text */}
      <div className="relative pl-6 mb-3">
        <span className="absolute left-0 top-0 text-[2.5rem] leading-none opacity-25 font-head font-[900]">
          &ldquo;
        </span>
        <blockquote
          className="text-[var(--text-md)] font-[300] italic"
          style={{ fontFamily: "var(--font-quote)", lineHeight: 1.625, textAlign: "left" }}
        >
          {quote.quote_text}
        </blockquote>
      </div>

      {/* Source attribution */}
      <div className="mb-3 pl-6 text-[var(--text-sm)] opacity-60">
        <span className="font-bold">{quote.source_name}</span>
        {quote.source_work && (
          <span>
            {" — "}
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
        <p className="text-[0.82rem] opacity-60 leading-relaxed mb-3 pl-3 border-l-2 border-ink/[var(--opacity-muted)]">
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
    </CardShell>
  );
}
