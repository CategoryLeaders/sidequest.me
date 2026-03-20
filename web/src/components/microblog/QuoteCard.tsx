/* ── QuoteCard — feed card for quote posts ── [SQ.S-W-2603-0064] */

import Link from "next/link";
import type { Quote } from "@/lib/thoughts-types";
import { relativeTime } from "@/lib/microblogs";

interface Props {
  quote: Quote;
  username: string;
}

export function QuoteCard({ quote, username }: Props) {
  const permalink = `/${username}/thoughts/${quote.short_id}`;
  const postDate = quote.published_at ?? quote.created_at;

  return (
    <article className="border-3 border-ink p-5 bg-[var(--bg-card)]">
      {/* Type badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="sticker sticker-lilac text-[0.55rem] !px-2 !py-0.5 !border-2">
          💬 Quote
        </span>
        {quote.pinned && (
          <span className="text-[0.55rem] font-mono opacity-40 ml-auto">📌 Pinned</span>
        )}
      </div>

      {/* Large quotation mark + quote text */}
      <div className="relative pl-6 mb-3">
        <span className="absolute left-0 top-0 text-[2.5rem] leading-none opacity-15 font-head font-[900]">
          &ldquo;
        </span>
        <blockquote className="text-[1.05rem] leading-relaxed font-[500] italic">
          {quote.quote_text}
        </blockquote>
      </div>

      {/* Source attribution */}
      <div className="mb-3 pl-6 text-[0.78rem] opacity-60">
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
        <p className="text-[0.82rem] opacity-60 leading-relaxed mb-3 pl-3 border-l-2 border-ink/15">
          {quote.commentary}
        </p>
      )}

      {/* Tags */}
      {quote.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {quote.tags.map((tag) => (
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

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-ink/10">
        <Link
          href={permalink}
          className="text-[0.6rem] font-mono opacity-40 hover:opacity-70 transition-opacity no-underline"
        >
          <time dateTime={postDate} title={new Date(postDate).toLocaleString("en-GB")}>
            {relativeTime(postDate)}
          </time>
        </Link>
      </div>
    </article>
  );
}
