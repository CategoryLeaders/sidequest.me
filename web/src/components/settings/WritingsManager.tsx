"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { readTimeMinutes } from "@/lib/writings";

interface WritingRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  tags: string[];
  word_count: number;
  published_at: string | null;
  updated_at: string;
}

interface WritingsManagerProps {
  username: string;
}

export default function WritingsManager({ username }: WritingsManagerProps) {
  const [writings, setWritings] = useState<WritingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"published" | "drafts">("published");

  useEffect(() => {
    fetch("/api/writings")
      .then((r) => r.json())
      .then((data) => {
        setWritings(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const published = writings
    .filter((w) => w.status !== "draft")
    .sort((a, b) => (b.published_at || b.updated_at).localeCompare(a.published_at || a.updated_at));

  const drafts = writings
    .filter((w) => w.status === "draft")
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  const rows = tab === "published" ? published : drafts;

  if (loading) {
    return <p className="font-mono text-[0.78rem] opacity-40">Loading writings…</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="font-mono text-[0.68rem] opacity-50">
          {published.length} published · {drafts.length} drafts
        </p>
        <Link
          href={`https://sidequest.me/${username}/admin/writings/new`}
          className="px-4 py-1.5 border-3 border-ink bg-bg-card font-head font-bold text-[0.68rem] uppercase hover:bg-ink hover:text-bg transition-colors no-underline"
        >
          + New post
        </Link>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-0 border-b border-ink/15 mb-4">
        <button
          type="button"
          onClick={() => setTab("published")}
          className={`py-2 px-4 font-mono text-[0.65rem] font-bold uppercase tracking-[0.03em] cursor-pointer border-b-2 transition-all ${
            tab === "published" ? "text-ink border-orange" : "text-ink-muted border-transparent hover:text-ink"
          }`}
        >
          Published ({published.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("drafts")}
          className={`py-2 px-4 font-mono text-[0.65rem] font-bold uppercase tracking-[0.03em] cursor-pointer border-b-2 transition-all ${
            tab === "drafts" ? "text-ink border-orange" : "text-ink-muted border-transparent hover:text-ink"
          }`}
        >
          Drafts ({drafts.length})
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="font-mono text-[0.78rem] opacity-40 py-6 text-center">
          {tab === "drafts" ? "No drafts." : "No published posts yet."}
        </p>
      ) : (
        <div className="divide-y divide-ink/10">
          {rows.map((w) => (
            <div key={w.id} className="py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <Link
                  href={`https://sidequest.me/${username}/admin/writings/${w.slug}`}
                  className="font-head font-bold text-[0.82rem] text-ink hover:text-orange no-underline line-clamp-1 transition-colors"
                >
                  {w.title}
                </Link>
                <p className="font-mono text-[0.62rem] opacity-40 mt-0.5">
                  {w.word_count ? `${w.word_count} words · ${readTimeMinutes(w.word_count)} min · ` : ""}
                  {w.status === "published" && w.published_at
                    ? new Date(w.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                    : `Updated ${new Date(w.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
                </p>
              </div>
              <Link
                href={`https://sidequest.me/${username}/admin/writings/${w.slug}`}
                className="font-mono text-[0.6rem] text-ink-muted hover:text-ink px-2 py-1 border-2 border-ink/20 hover:border-ink/50 transition-colors no-underline flex-shrink-0"
              >
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}