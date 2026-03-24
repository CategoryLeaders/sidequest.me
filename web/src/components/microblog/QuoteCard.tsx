/* ── QuoteCard — feed card for quote posts ── [SQ.S-W-2603-0064] */

import Link from "next/link";
import type { Quote } from "@/lib/thoughts-types";
import { relativeTime } from "@/lib/microblogs";
import { ContentActions } from "@/components/shared/ContentActions";

interface Props {
  quote: Quote;
  username: string;
  isOwner?: boolean;
}

export function QuoteCard({ quote, username, isOwner = false }: Props) {
  const permalink = `/${username}/thoughts/${quote.short_id}`;
  const postDate = quote.published_at ?? quote.created_at;

  return (
    <article
      className="border-3 border-ink bg-[var(--bg-card)] overflow-hidden relative"
      style={{ boxShadow: '4px 4px 0 #1a1a1a' }}
    >
      {isOwner && (
        <div className="absolute top-2 right-2 z-10">
          <ContentActions
            contentType="quote"
            contentId={quote.id}
            editData={{
              quote_text: quote.quote_text,
              source_name: quote.source_name,
              source_work: quote.source_work,
              source_url: quote.source_url,
              commentary: quote.commentary,
              tags: quote.tags,
              visibility: quote.visibility,
            }}
          />
        </div>
      )}
      {/* Header: type badge + date */}
      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-ink/8">
        <span
          className="font-mono text-[0.58rem] font-bold uppercase tracking-widest"
          style={{ color: '#7b3fa0' }}
        >
          💬 Quote
        </span>
        {quote.pinned && (
          <span className="font-mono text-[0.55rem] text-ink/35">📌</span>
        )}
        <Link
          href={permalink}
          className="font-mono text-[0.6rem] text-ink/35 hover:text-ink/60 transition-colors no-underline ml-auto"
        >
          <time dateTime={postDate} title={new Date(postDate).toLocaleString("en-GB")}>
            {new Date(postDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </time>
          <span className="ml-1.5 opacity-70">{relativeTime(postDate)}</span>
        </Link>
      </div>

      {/* Large quotation mark + quote text */}
      <div className="relative px-5 pt-5 pb-1">
        <span className="absolute left-3 top-4 text-[2.5rem] leading-none opacity-10 font-head font-[900]">
          &ldquo;
        </span>
        <blockquote className="text-[1.05rem] leading-relaxed font-[500] italic pl-5">
          {quote.quote_text}
        </blockquote>
      </div>

      {/* Source attribution */}
      <div className="pl-10 px-5 pb-1 text-[0.78rem] opacity-60">
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
        <p className="text-[0.82rem] opacity-60 leading-relaxed mx-5 mt-2 mb-1 pl-3 border-l-2 border-ink/15">
          {quote.commentary}
        </p>
      )}

      {/* Tags */}
      {quote.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-5 pt-3">
          {quote.tags.map((tag) => (
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
