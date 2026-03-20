"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { WhatsNewItem } from "@/lib/whats-new";
import type { FeedEventType } from "@/lib/feed-events";

// ─── Type pill colours (CSS variable references) ───────────────────────────

const PILL_BG: Partial<Record<FeedEventType, string>> = {
  microblog_published: "var(--orange)",
  writing_published:   "var(--blue)",
  bookmark_published:  "var(--green)",
  quote_published:     "var(--lilac)",
  question_published:  "var(--yellow)",
  question_resolved:   "var(--green)",
  photo_added:         "var(--pink)",
  project_created:     "var(--orange)",
  project_updated:     "var(--orange)",
  project_backed:      "var(--pink)",
  adventure_published: "var(--green)",
  career_updated:      "var(--blue)",
  profile_updated:     "var(--lilac)",
  reshared:            "var(--yellow)",
};

const PILL_COLOR: Partial<Record<FeedEventType, string>> = {
  microblog_published: "var(--on-orange)",
  writing_published:   "var(--on-blue)",
  bookmark_published:  "var(--on-green)",
  quote_published:     "var(--on-lilac)",
  question_published:  "var(--on-yellow)",
  question_resolved:   "var(--on-green)",
  photo_added:         "var(--on-pink)",
  project_created:     "var(--on-orange)",
  project_updated:     "var(--on-orange)",
  project_backed:      "var(--on-pink)",
  adventure_published: "var(--on-green)",
  career_updated:      "var(--on-blue)",
  profile_updated:     "var(--on-lilac)",
  reshared:            "var(--on-yellow)",
};

// ─── Relative time ──────────────────────────────────────────────────────────

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function absoluteTime(isoString: string): string {
  return new Date(isoString).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Per-type card body ──────────────────────────────────────────────────────

function CardBody({ item }: { item: WhatsNewItem }) {
  switch (item.eventType) {
    case "microblog_published":
      return (
        <div>
          {item.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt=""
              className="w-full h-48 object-cover border-b border-[var(--ink)] mb-3"
              style={{ borderBottomWidth: 2 }}
            />
          )}
          <p className="text-[0.9rem] leading-relaxed" style={{ opacity: 0.8 }}>
            {item.description}
          </p>
        </div>
      );

    case "writing_published":
      return (
        <div>
          {item.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-48 object-cover mb-3"
              style={{ borderBottom: "2px solid var(--ink)" }}
            />
          )}
          <h3
            className="font-head font-[900] text-[1.05rem] uppercase leading-tight mb-1"
            style={{ fontFamily: "var(--font-head)" }}
          >
            {item.title}
          </h3>
          {item.description && (
            <p className="text-[0.85rem] leading-snug mt-1" style={{ opacity: 0.65 }}>
              {item.description}
            </p>
          )}
          {item.readingTime && (
            <span
              className="mt-2 inline-block text-[0.65rem] uppercase"
              style={{ fontFamily: "var(--font-mono)", opacity: 0.45 }}
            >
              · {item.readingTime}
            </span>
          )}
        </div>
      );

    case "bookmark_published":
      return (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            {item.faviconUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.faviconUrl} alt="" className="w-4 h-4" />
            )}
            {item.domain && (
              <span
                className="text-[0.72rem]"
                style={{ fontFamily: "var(--font-mono)", opacity: 0.55 }}
              >
                {item.domain}
              </span>
            )}
          </div>
          <h3
            className="font-head font-[900] text-[0.95rem] uppercase leading-tight mb-1"
            style={{ fontFamily: "var(--font-head)" }}
          >
            {item.title}
          </h3>
          {item.description && (
            <p
              className="text-[0.82rem] leading-snug italic"
              style={{ opacity: 0.6 }}
            >
              {item.description}
            </p>
          )}
        </div>
      );

    case "quote_published":
      return (
        <div>
          <blockquote
            className="pl-3 mb-2"
            style={{ borderLeft: "3px solid var(--ink)" }}
          >
            <p className="text-[0.95rem] leading-relaxed" style={{ opacity: 0.85 }}>
              {item.title}
            </p>
          </blockquote>
          {item.description && (
            <p
              className="text-[0.72rem]"
              style={{ fontFamily: "var(--font-mono)", opacity: 0.55 }}
            >
              {item.description}
            </p>
          )}
        </div>
      );

    case "question_published":
    case "question_resolved":
      return (
        <div>
          <p className="text-[0.9rem] leading-relaxed mb-2">{item.title}</p>
          {item.resolved && (
            <span
              className="inline-block px-2 py-0.5 text-[0.6rem] font-bold uppercase"
              style={{
                background: "var(--green)",
                color: "var(--on-green)",
                border: "1.5px solid var(--ink)",
                fontFamily: "var(--font-head)",
              }}
            >
              Resolved ✓
            </span>
          )}
        </div>
      );

    case "project_created":
    case "project_updated":
      return (
        <div>
          <h3
            className="font-[900] text-[1rem] uppercase leading-tight mb-1"
            style={{ fontFamily: "var(--font-head)" }}
          >
            {item.title}
          </h3>
          {item.description && (
            <p className="text-[0.82rem] leading-snug mb-2" style={{ opacity: 0.7 }}>
              {item.description}
            </p>
          )}
          {item.projectStatus && (
            <span
              className="inline-block px-2 py-0.5 text-[0.6rem] font-bold uppercase"
              style={{
                background: "var(--yellow)",
                color: "var(--on-yellow)",
                border: "1.5px solid var(--ink)",
                fontFamily: "var(--font-head)",
              }}
            >
              {item.projectStatus}
            </span>
          )}
        </div>
      );

    case "project_backed":
      return (
        <div>
          <h3
            className="font-[900] text-[1rem] uppercase leading-tight mb-1"
            style={{ fontFamily: "var(--font-head)" }}
          >
            {item.title}
          </h3>
          {item.description && (
            <p className="text-[0.82rem] leading-snug" style={{ opacity: 0.7 }}>
              {item.description}
            </p>
          )}
        </div>
      );

    case "career_updated":
      return (
        <p className="text-[0.9rem] leading-relaxed" style={{ opacity: 0.8 }}>
          {item.title}
          {item.description && (
            <span className="block text-[0.8rem] mt-0.5" style={{ opacity: 0.6 }}>
              {item.description}
            </span>
          )}
        </p>
      );

    case "profile_updated":
      return (
        <p className="text-[0.85rem]" style={{ opacity: 0.65 }}>
          {item.description || item.title}
        </p>
      );

    default:
      return (
        <div>
          {item.title && (
            <p className="text-[0.9rem] leading-relaxed mb-1" style={{ opacity: 0.8 }}>
              {item.title}
            </p>
          )}
          {item.description && (
            <p className="text-[0.8rem]" style={{ opacity: 0.55 }}>
              {item.description}
            </p>
          )}
          {item.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt="" className="w-full h-40 object-cover mt-2" />
          )}
        </div>
      );
  }
}

// ─── Single feed card ────────────────────────────────────────────────────────

function FeedCard({ item }: { item: WhatsNewItem }) {
  const bg = PILL_BG[item.eventType] ?? "var(--orange)";
  const fg = PILL_COLOR[item.eventType] ?? "var(--on-orange)";

  return (
    <Link
      href={item.link}
      className="block no-underline text-ink"
      style={{
        border: "3px solid var(--ink)",
        background: "var(--bg-card)",
        borderRadius: 0,
        overflow: "hidden",
        transition: "transform 0.12s ease, box-shadow 0.12s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = "translate(-3px, -3px)";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "3px 3px 0 var(--ink)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = "";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "";
      }}
    >
      {/* Card header: type pill + timestamp */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: "2px solid var(--ink)" }}
      >
        {/* Type pill */}
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[0.62rem] font-bold uppercase"
          style={{
            background: bg,
            color: fg,
            fontFamily: "var(--font-head)",
            border: "1.5px solid var(--ink)",
          }}
        >
          {item.icon} {item.badgeLabel}
        </span>

        {/* Relative timestamp */}
        <span
          className="text-[0.68rem]"
          style={{ fontFamily: "var(--font-mono)", opacity: 0.5 }}
          title={absoluteTime(item.publishedAt)}
          suppressHydrationWarning
        >
          {relativeTime(item.publishedAt)}
        </span>
      </div>

      {/* Card body */}
      <div className="px-4 py-3">
        <CardBody item={item} />
      </div>
    </Link>
  );
}

// ─── Main feed component ─────────────────────────────────────────────────────

interface Props {
  initialItems: WhatsNewItem[];
  username: string;
}

export default function WhatsNewFeed({ initialItems, username }: Props) {
  const [items, setItems] = useState<WhatsNewItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [exhausted, setExhausted] = useState(initialItems.length < 6);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef<number>(initialItems.length);

  const loadMore = useCallback(async () => {
    if (loading || exhausted) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/feed/${username}?offset=${offsetRef.current}&limit=10`
      );
      const { items: newItems } = await res.json() as { items: WhatsNewItem[] };
      if (!newItems || newItems.length === 0) {
        setExhausted(true);
      } else {
        setItems((prev) => [...prev, ...newItems]);
        offsetRef.current += newItems.length;
        if (newItems.length < 10) setExhausted(true);
      }
    } catch {
      // silently fail — user can scroll back up and try again
    } finally {
      setLoading(false);
    }
  }, [loading, exhausted, username]);

  // IntersectionObserver on the sentinel div
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  if (items.length === 0) {
    return (
      <p
        className="py-12 text-center text-[0.85rem]"
        style={{ fontFamily: "var(--font-mono)", opacity: 0.4 }}
      >
        Nothing new yet — check back soon.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <FeedCard key={item.id} item={item} />
      ))}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-1" aria-hidden />

      {/* Loading indicator */}
      {loading && (
        <p
          className="text-center py-4 text-[0.75rem] uppercase"
          style={{ fontFamily: "var(--font-mono)", opacity: 0.4 }}
        >
          Loading…
        </p>
      )}

      {/* End-of-feed marker */}
      {exhausted && items.length > 6 && (
        <p
          className="text-center py-4 text-[0.7rem] uppercase"
          style={{ fontFamily: "var(--font-mono)", opacity: 0.3 }}
        >
          ✦ You&apos;re all caught up ✦
        </p>
      )}
    </div>
  );
}
