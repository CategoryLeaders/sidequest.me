"use client";

/**
 * Photowall grid — DB photos (new uploads) + static archive (imported Instagram posts).
 * DB photos appear first (newest), archive follows in chronological order.
 * [SQ.S-W-2603-0050]
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { posts as archivePosts } from "@/lib/photowall-data";
import { photowallUrl } from "@/lib/cdn";
import Image from "next/image";

/** Unified post type used for both DB and archive photos */
interface UnifiedPost {
  id: string;
  imageUrls: string[]; // always full URLs
  caption: string | null;
  date: string | null;
  source: "db" | "archive";
}

interface PhotowallGridProps {
  userId: string;
  username: string;
}

const BATCH_SIZE = 30;

/** Map archive posts to UnifiedPost */
function archiveToUnified(): UnifiedPost[] {
  return archivePosts.map((p) => ({
    id: `archive_${p.id}`,
    imageUrls: p.images.map((img) => photowallUrl(img)),
    caption: p.caption || null,
    date: p.date || null,
    source: "archive",
  }));
}

export default function PhotowallGrid({ userId, username }: PhotowallGridProps) {
  const [dbPhotos, setDbPhotos] = useState<UnifiedPost[]>([]);
  const [dbTotal, setDbTotal] = useState(0);
  const [dbOffset, setDbOffset] = useState(0);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbLoadingMore, setDbLoadingMore] = useState(false);

  // Archive is static — always available immediately
  const archive = archiveToUnified();

  // Visible count into the combined list
  const [visible, setVisible] = useState(BATCH_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [selected, setSelected] = useState<UnifiedPost | null>(null);
  const [carouselIdx, setCarouselIdx] = useState(0);

  // Fetch initial DB photos
  useEffect(() => {
    async function fetchDb() {
      setDbLoading(true);
      try {
        const res = await fetch(`/api/photos?user_id=${userId}&limit=${BATCH_SIZE}&offset=0`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const mapped: UnifiedPost[] = (data.photos ?? []).map(
          (p: { id: string; image_urls: string[]; caption: string | null; date: string | null }) => ({
            id: `db_${p.id}`,
            imageUrls: p.image_urls,
            caption: p.caption,
            date: p.date,
            source: "db" as const,
          })
        );
        setDbPhotos(mapped);
        setDbTotal(data.total ?? 0);
        setDbOffset(BATCH_SIZE);
      } catch {
        // silently leave dbPhotos empty
      } finally {
        setDbLoading(false);
      }
    }
    fetchDb();
  }, [userId]);

  // Merge: DB photos first, then archive
  const allPosts: UnifiedPost[] = [...dbPhotos, ...archive];
  const total = dbTotal + archive.length;
  const displayed = allPosts.slice(0, visible);

  // Load more — extend visible window, fetch more DB photos if needed
  const loadMore = useCallback(async () => {
    const nextVisible = Math.min(visible + BATCH_SIZE, allPosts.length);
    setVisible(nextVisible);

    // If we're close to the end of fetched DB photos, fetch the next batch
    const dbFetched = dbPhotos.length;
    if (nextVisible > dbFetched - 10 && dbFetched < dbTotal && !dbLoadingMore) {
      setDbLoadingMore(true);
      try {
        const res = await fetch(`/api/photos?user_id=${userId}&limit=${BATCH_SIZE}&offset=${dbOffset}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const mapped: UnifiedPost[] = (data.photos ?? []).map(
          (p: { id: string; image_urls: string[]; caption: string | null; date: string | null }) => ({
            id: `db_${p.id}`,
            imageUrls: p.image_urls,
            caption: p.caption,
            date: p.date,
            source: "db" as const,
          })
        );
        setDbPhotos((prev) => [...prev, ...mapped]);
        setDbOffset((prev) => prev + BATCH_SIZE);
      } catch {
        // ignore
      } finally {
        setDbLoadingMore(false);
      }
    }
  }, [visible, allPosts.length, dbPhotos.length, dbTotal, dbLoadingMore, userId, dbOffset]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: "600px" }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [loadMore]);

  // Keyboard nav for lightbox
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!selected) return;
      if (e.key === "Escape") setSelected(null);
      if (e.key === "ArrowLeft") {
        const idx = displayed.findIndex((p) => p.id === selected.id);
        if (idx > 0) { setSelected(displayed[idx - 1]); setCarouselIdx(0); }
      }
      if (e.key === "ArrowRight") {
        const idx = displayed.findIndex((p) => p.id === selected.id);
        if (idx < displayed.length - 1) { setSelected(displayed[idx + 1]); setCarouselIdx(0); }
      }
    },
    [selected, displayed]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selected]);

  const openPost = (post: UnifiedPost) => { setSelected(post); setCarouselIdx(0); };

  return (
    <>
      <main className="max-w-[1400px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 border-3 border-ink bg-bg p-6" style={{ boxShadow: "4px 4px 0 var(--ink)" }}>
          <h1 className="font-head font-[900] text-[2rem] uppercase tracking-tight leading-none mb-1">
            Photowall
          </h1>
          <p className="font-mono text-[0.75rem] opacity-60">
            {dbLoading ? "Loading…" : `${total} post${total === 1 ? "" : "s"}`}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-[3px] md:gap-1">
          {displayed.map((post) => (
            <button
              key={post.id}
              onClick={() => openPost(post)}
              className="relative aspect-square overflow-hidden border-3 border-ink bg-ink/5 cursor-pointer group"
              style={{ padding: 0 }}
            >
              <Image
                src={post.imageUrls[0]}
                alt={post.caption || "Photo"}
                fill
                sizes="(max-width: 768px) 33vw, 300px"
                className="object-cover transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
              />
              {post.imageUrls.length > 1 && (
                <div className="absolute top-2 right-2 bg-ink/70 text-bg font-mono text-[0.65rem] px-1.5 py-0.5">
                  {post.imageUrls.length}
                </div>
              )}
              <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/30 transition-colors duration-200 flex items-end">
                {post.caption && (
                  <p className="text-bg text-[0.7rem] font-body p-2 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {post.caption}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Sentinel */}
        <div ref={sentinelRef} className="flex justify-center py-12">
          {visible < total ? (
            <div className="font-mono text-[0.75rem] opacity-40">Loading more…</div>
          ) : (
            <div className="font-mono text-[0.75rem] opacity-40">
              That&apos;s all {total} posts ✓
            </div>
          )}
        </div>
      </main>

      {selected && (
        <Lightbox
          post={selected}
          displayed={displayed}
          carouselIdx={carouselIdx}
          setCarouselIdx={setCarouselIdx}
          onClose={() => setSelected(null)}
          onPrev={() => {
            const idx = displayed.findIndex((p) => p.id === selected.id);
            if (idx > 0) { setSelected(displayed[idx - 1]); setCarouselIdx(0); }
          }}
          onNext={() => {
            const idx = displayed.findIndex((p) => p.id === selected.id);
            if (idx < displayed.length - 1) { setSelected(displayed[idx + 1]); setCarouselIdx(0); }
          }}
        />
      )}
    </>
  );
}

function Lightbox({
  post,
  displayed,
  carouselIdx,
  setCarouselIdx,
  onClose,
  onPrev,
  onNext,
}: {
  post: UnifiedPost;
  displayed: UnifiedPost[];
  carouselIdx: number;
  setCarouselIdx: (i: number) => void;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const currentImage = post.imageUrls[carouselIdx] || post.imageUrls[0];
  const hasMultiple = post.imageUrls.length > 1;
  const postDate = post.date
    ? new Date(post.date + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric",
      })
    : "";
  const idx = displayed.findIndex((p) => p.id === post.id);

  return (
    <div
      className="fixed inset-0 z-[200] bg-ink/90 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative bg-bg border-3 border-ink max-w-[900px] w-[95vw] max-h-[90vh] flex flex-col md:flex-row overflow-hidden"
        style={{ boxShadow: "6px 6px 0 rgba(0,0,0,0.3)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex-1 min-h-[300px] md:min-h-[500px] bg-ink/5 flex items-center justify-center">
          <Image
            src={currentImage}
            alt={post.caption || "Photo"}
            fill
            sizes="(max-width: 768px) 95vw, 600px"
            className="object-contain"
            priority
          />

          {hasMultiple && (
            <>
              <button
                onClick={() => setCarouselIdx(Math.max(0, carouselIdx - 1))}
                disabled={carouselIdx === 0}
                className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-bg border-3 border-ink flex items-center justify-center font-head font-bold text-sm cursor-pointer ${carouselIdx === 0 ? "opacity-30" : "hover:bg-ink hover:text-bg"}`}
              >‹</button>
              <button
                onClick={() => setCarouselIdx(Math.min(post.imageUrls.length - 1, carouselIdx + 1))}
                disabled={carouselIdx === post.imageUrls.length - 1}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-bg border-3 border-ink flex items-center justify-center font-head font-bold text-sm cursor-pointer ${carouselIdx === post.imageUrls.length - 1 ? "opacity-30" : "hover:bg-ink hover:text-bg"}`}
              >›</button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {post.imageUrls.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCarouselIdx(i)}
                    className={`w-2 h-2 rounded-full border border-ink cursor-pointer ${i === carouselIdx ? "bg-ink" : "bg-bg/80"}`}
                  />
                ))}
              </div>
            </>
          )}

          <button onClick={onPrev} disabled={idx === 0}
            className={`absolute left-2 bottom-3 md:bottom-auto md:top-3 w-7 h-7 bg-bg/80 border-2 border-ink flex items-center justify-center font-mono text-[0.7rem] cursor-pointer hover:bg-ink hover:text-bg ${idx === 0 ? "opacity-20" : ""}`}
            title="Previous post">←</button>
          <button onClick={onNext} disabled={idx === displayed.length - 1}
            className={`absolute right-2 bottom-3 md:bottom-auto md:top-3 w-7 h-7 bg-bg/80 border-2 border-ink flex items-center justify-center font-mono text-[0.7rem] cursor-pointer hover:bg-ink hover:text-bg ${idx === displayed.length - 1 ? "opacity-20" : ""}`}
            title="Next post">→</button>
        </div>

        <div className="md:w-[280px] border-t-3 md:border-t-0 md:border-l-3 border-ink p-5 overflow-y-auto max-h-[200px] md:max-h-none">
          <button onClick={onClose}
            className="absolute top-2 right-2 w-8 h-8 bg-bg border-3 border-ink flex items-center justify-center font-head font-bold text-sm cursor-pointer hover:bg-ink hover:text-bg z-10">
            ✕
          </button>

          {postDate && (
            <p className="font-mono text-[0.65rem] uppercase tracking-wider opacity-50 mb-3">{postDate}</p>
          )}

          {post.caption ? (
            <p className="font-body text-[0.85rem] leading-relaxed whitespace-pre-line">{post.caption}</p>
          ) : (
            <p className="font-mono text-[0.75rem] opacity-30 italic">No caption</p>
          )}

          {hasMultiple && (
            <p className="font-mono text-[0.65rem] opacity-40 mt-4">
              {carouselIdx + 1} of {post.imageUrls.length} photos
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
