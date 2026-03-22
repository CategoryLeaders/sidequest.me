/* ── UpdateStream — renders crowdfunding project updates with snippet+expand ── */
"use client";

import { useState } from "react";
import type { CrowdfundingUpdate } from "@/lib/crowdfunding";

interface Props {
  updates: CrowdfundingUpdate[];
}

/**
 * Strips sensitive content from update bodies:
 * - Survey links (typeform, google forms, surveymonkey, etc.)
 * - Tracking pixels and 1x1 images
 * - Personal addresses / phone numbers
 * - "Click here to manage your pledge" type links
 */
function sanitiseText(text: string): string {
  let clean = text;
  // Remove survey URLs
  clean = clean.replace(
    /https?:\/\/[^\s]*(?:typeform|surveymonkey|google\.com\/forms|docs\.google\.com\/forms|surveysparrow|jotform)[^\s]*/gi,
    "[survey link removed]"
  );
  // Remove pledge management links
  clean = clean.replace(
    /https?:\/\/[^\s]*(?:manage[_-]?pledge|update[_-]?pledge|manage[_-]?your|backerkit\.com\/[^\s]*\/manage)[^\s]*/gi,
    "[pledge link removed]"
  );
  // Remove unsubscribe / email preference links
  clean = clean.replace(
    /https?:\/\/[^\s]*(?:unsubscribe|email[_-]?pref|opt[_-]?out|manage[_-]?subscription)[^\s]*/gi,
    ""
  );
  // Remove tracking pixel references
  clean = clean.replace(
    /https?:\/\/[^\s]*(?:track|pixel|beacon|open\.php|t\.co\/[^\s]*\?track)[^\s]*/gi,
    ""
  );
  // Remove phone numbers (UK & intl format)
  clean = clean.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g, "[phone removed]");
  // Collapse multiple blank lines
  clean = clean.replace(/\n{3,}/g, "\n\n");
  return clean.trim();
}

function sanitiseHtml(html: string): string {
  let clean = html;
  // Remove 1x1 tracking pixels
  clean = clean.replace(/<img[^>]+(?:width|height)\s*=\s*["']1["'][^>]*>/gi, "");
  // Remove survey links — replace <a> tags containing survey URLs
  clean = clean.replace(
    /<a[^>]*href=["'][^"']*(?:typeform|surveymonkey|google\.com\/forms|surveysparrow|jotform)[^"']*["'][^>]*>.*?<\/a>/gi,
    "<em>[survey link removed]</em>"
  );
  // Remove pledge management links
  clean = clean.replace(
    /<a[^>]*href=["'][^"']*(?:manage[_-]?pledge|update[_-]?pledge|backerkit\.com\/[^"']*\/manage)[^"']*["'][^>]*>.*?<\/a>/gi,
    ""
  );
  // Remove unsubscribe blocks
  clean = clean.replace(
    /<[^>]*(?:unsubscribe|email[_-]?pref|opt[_-]?out)[^>]*>.*?<\/[^>]*>/gi,
    ""
  );
  return clean;
}

const SNIPPET_LENGTH = 200;

function UpdateCard({ update }: { update: CrowdfundingUpdate }) {
  const [expanded, setExpanded] = useState(false);

  const cleanText = update.body_text ? sanitiseText(update.body_text) : null;
  const cleanHtml = update.body_html ? sanitiseHtml(update.body_html) : null;

  const needsTruncation = cleanText && cleanText.length > SNIPPET_LENGTH;
  const snippet = cleanText
    ? cleanText.slice(0, SNIPPET_LENGTH) + (needsTruncation ? "…" : "")
    : null;

  const dateStr = new Date(update.received_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <article className="border-2 border-ink/10 p-4 bg-[var(--bg-card)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-head font-bold text-[0.82rem] leading-snug truncate">
            {update.subject || "Update"}
          </h4>
          {update.sender_name && (
            <span className="font-mono text-[0.55rem] opacity-40">
              from {update.sender_name}
            </span>
          )}
        </div>
        <time
          dateTime={update.received_at}
          className="font-mono text-[0.55rem] opacity-35 whitespace-nowrap mt-0.5"
        >
          {dateStr}
        </time>
      </div>

      {/* Body — snippet or full */}
      {!expanded && snippet ? (
        <p className="text-[0.8rem] leading-relaxed opacity-60 whitespace-pre-wrap">
          {snippet}
        </p>
      ) : cleanHtml ? (
        <div
          className="text-[0.8rem] leading-relaxed opacity-70 update-body"
          dangerouslySetInnerHTML={{ __html: cleanHtml }}
        />
      ) : cleanText ? (
        <p className="text-[0.8rem] leading-relaxed opacity-70 whitespace-pre-wrap">
          {cleanText}
        </p>
      ) : (
        <p className="text-[0.75rem] opacity-30 italic">No content</p>
      )}

      {/* Expand/collapse toggle */}
      {needsTruncation && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="font-mono text-[0.65rem] font-bold uppercase text-[var(--orange)] mt-2 hover:opacity-70 transition-opacity"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          {expanded ? "Show less ↑" : "Read more ↓"}
        </button>
      )}
    </article>
  );
}

export default function UpdateStream({ updates }: Props) {
  if (updates.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="font-mono text-[0.7rem] opacity-30 uppercase">
          No updates yet
        </p>
        <p className="text-[0.75rem] opacity-40 mt-1">
          Updates from the project creator will appear here once email forwarding is set up.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {updates.map((update) => (
        <UpdateCard key={update.id} update={update} />
      ))}
    </div>
  );
}
