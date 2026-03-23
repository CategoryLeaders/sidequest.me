"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { STATUS_META, THEME_META } from "@/lib/adventures";
import type { Adventure, AdventureStatus, LayoutTheme } from "@/lib/adventures";

interface AdventuresManagerProps {
  username: string;
}

export default function AdventuresManager({ username }: AdventuresManagerProps) {
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/adventures")
      .then((r) => r.json())
      .then((data) => {
        setAdventures(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="font-mono text-[0.78rem] opacity-40">Loading adventures…</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="font-mono text-[0.68rem] opacity-50">
          {adventures.length} {adventures.length === 1 ? "adventure" : "adventures"}
        </p>
        <Link
          href={`https://sidequest.me/${username}/admin/adventures/new`}
          className="px-4 py-1.5 border-3 border-ink bg-bg-card font-head font-bold text-[0.68rem] uppercase hover:bg-ink hover:text-bg transition-colors no-underline"
        >
          + New adventure
        </Link>
      </div>

      {adventures.length === 0 ? (
        <p className="font-mono text-[0.78rem] opacity-40 py-6 text-center">
          No adventures yet.{" "}
          <Link href={`https://sidequest.me/${username}/admin/adventures/new`} className="text-orange no-underline">
            Create your first →
          </Link>
        </p>
      ) : (
        <div className="divide-y divide-ink/10">
          {adventures.map((a) => {
            const sm = STATUS_META[a.status as AdventureStatus] ?? STATUS_META.draft;
            const tm = THEME_META[a.layout_theme as LayoutTheme] ?? THEME_META.journal;
            return (
              <div key={a.id} className="py-3 flex items-start gap-3">
                {a.cover_image_url && (
                  <div className="w-16 h-11 flex-shrink-0 border-2 border-ink/10 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.cover_image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`font-mono text-[0.55rem] font-bold uppercase px-1.5 py-0.5 ${
                      a.status === "live" ? "bg-orange/20 text-orange" :
                      a.status === "upcoming" ? "bg-yellow/20 text-yellow" :
                      a.status === "complete" ? "bg-green/20 text-green" :
                      "bg-ink/10 text-ink-muted"
                    }`}>
                      {sm.label}
                    </span>
                    <span className="font-mono text-[0.55rem] opacity-40">{tm.icon} {tm.label}</span>
                  </div>
                  <Link
                    href={`https://sidequest.me/${username}/admin/adventures/${a.slug}`}
                    className="font-head font-bold text-[0.82rem] text-ink hover:text-orange no-underline line-clamp-1 transition-colors"
                  >
                    {a.title}
                  </Link>
                  <p className="font-mono text-[0.62rem] opacity-40 mt-0.5">
                    {a.location_name && `📍 ${a.location_name} · `}
                    {a.start_date && new Date(a.start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    {a.end_date && ` — ${new Date(a.end_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
                  </p>
                </div>
                <Link
                  href={`https://sidequest.me/${username}/admin/adventures/${a.slug}`}
                  className="font-mono text-[0.6rem] text-ink-muted hover:text-ink px-2 py-1 border-2 border-ink/20 hover:border-ink/50 transition-colors no-underline flex-shrink-0"
                >
                  Edit
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}