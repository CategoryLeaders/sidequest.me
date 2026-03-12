"use client";

/**
 * Photowall grid — fetches photos from the Supabase DB via /api/photos.
 * Previously read from static photowall-data; now DB-driven. [SQ.S-W-2603-0050]
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";

interface DbPhoto {
  id: string;
  caption: string | null;
  image_urls: string[];
  date: string | null;
  created_at: string;
}

interface PhotowallGridProps {
  userId: string;
  username: string;
}

const BATCH_SIZE = 30;

export default function PhotowallGrid({ userId, username }: PhotowallGridProps) {
  const [photos, setPhotos] = useState<DbPhoto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<DbPhoto | null>(null);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Initial load
  useEffect(() => {
    async function fetchPhotos() {
      setLoading(true);
      try {
        const res = await fetch(`/api/photos?user_id=${userId}&limit=${BATCH_SIZE}&offset=0`);
        if (!res.ok) throw new Error("Failed to fetch photos");
        const data = await res.json();
        setPhotos(data.photos ?? []);
        setTotal(data.total ?? 0);
        setOffset(BATCH_SIZE);
      } catch {
        // leave photos empty — empty state handles it
      } finally {
        setLoading(false);
      }
    }
    fetchPhotos();
  }, [userId]);

  // Load more on infinite scroll
  const loadMore = useCallback(async () => {
    if (loadingMore || photos.length >= total) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/photos?user_id=${userId}&limit=${BATCH_SIZE}&offset=${offset}`);
      if (!res.ok) throw new Error("Failed to fetch photos");
      const data = await res.json();
      setPhotos((prev) => [...prev, ...(data.photos ?? [])]);
      setOffset((prev) => prev + BATCH_SIZE);
    } catch {
      // silently ignore
    } finally {
      setLoadingMore(false);
    }
  }, [userId, offset, total, photos.length, loadingMore]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
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
        const idx = photos.indexOf(selected);
        if (idx > 0) { setSelected(photos[idx - 1]); setCarouselIdx(0); }
      }
      if (e.key === "ArrowRight") {
        const idx = photos.indexOf(selected);
        if (idx < photos.length - 1) { setSelected(photos[idx + 1]); setCarouselIdx(0); }
      }
    },
    [selected, photos]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // Lock body scroll when lightbox open
  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selected]);

  const openPost = (photo: DbPhoto) => {
    setSelected(photo);
    setCarouselIdx(0);
  };

  return (
    <>
      <main className="max-w-[1400px] mx-auto px-4 py-8">
        {/* Header */}
        <div
          className="mb-8 border-3 border-ink bg-bg p-6"
          style={{ boxShadow: "4px 4px 0 var(--ink)" }}
        >
          <h1 className="font-head font-[900] text-[2rem] uppercase tracking-tight leading-none mb-1">
            Photowall
          </h1>
          <p className="font-mono text-[0.75rem] opacity-60">
            {loading ? "Loading…" : `${total} post${total === 1 ? "" : "s"}`}
          </p>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-3 gap-[3px] md:gap-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square bg-ink/5 animate-pulse border-3 border-ink/10" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && photos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="font-head font-bold text-[1.1rem] uppercase opacity-30">
              No photos yet
            </p>
            <p className="font-mono text-[0.75rem] opacity-40">
              Photos posted by @{username} will appear here.
            </p>
          </div>
        )}

        {/* Grid */}
        {!loading && photos.length > 0 && (
          <div className="grid grid-cols-3 gap-[3px] md:gap-1">
            {photos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => openPost(photo)}
                className="relative aspect-square overflow-hidden border-3 border-ink bg-ink/5 cursor-pointer group"
                style={{ padding: 0 }}
              >
                <Image
                  src={photo.image_urls[0]}
                  alt={photo.caption || "Photo"}
                  fill
                  sizes="(max-width: 768px) 33vw, 300px"
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Multi-image indicator */}
                {photo.image_urls.length > 1 && (
                  <div className="absolute top-2 right-2 bg-ink/70 text-bg font-mono text-[0.65rem] px-1.5 py-0.5">
                    {photo.image_urls.length}
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/30 transition-colors duration-200 flex items-end">
                  {photo.caption && (
                    <p className="text-bg text-[0.7rem] font-body p-2 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {photo.caption}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Sentinel / footer */}
        {!loading && photos.length > 0 && (
          <div ref={sentinelRef} className="flex justify-center py-12">
            {loadingMore ? (
              <div className="font-mono text-[0.75rem] opacity-40">Loading more…</div>
            ) : photos.length >= total ? (
              <div className="font-mono text-[0.75rem] opacity-40">
                That&apos;s all {total} post{total === 1 ? "" : "s"} ✓
              </div>
            ) : null}
          </div>
        )}
      </main>

      {/* Lightbox */}
      {selected && (
        <Lightbox
          photo={selected}
          photos={photos}
          carouselIdx={carouselIdx}
          setCarouselIdx={setCarouselIdx}
          onClose={() => setSelected(null)}
          onPrev={() => {
            const idx = photos.indexOf(selected);
            if (idx > 0) { setSelected(photos[idx - 1]); setCarouselIdx(0); }
          }}
          onNext={() => {
            const idx = photos.indexOf(selected);
            if (idx < photos.length - 1) { setSelected(photos[idx + 1]); setCarouselIdx(0); }
          }}
        />
      )}
    </>
  );
}

function Lightbox({
  photo,
  photos,
  carouselIdx,
  setCarouselIdx,
  onClose,
  onPrev,
  onNext,
}: {
  photo: DbPhoto;
  photos: DbPhoto[];
  carouselIdx: number;
  setCarouselIdx: (i: number) => void;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const currentImage = photo.image_urls[carouselIdx] || photo.image_urls[0];
  const hasMultiple = photo.image_urls.length > 1;
  const postDate = photo.date
    ? new Date(photo.date + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
  const idx = photos.indexOf(photo);

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
        {/* Image area */}
        <div className="relative flex-1 min-h-[300px] md:min-h-[500px] bg-ink/5 flex items-center justify-center">
          <Image
            src={currentImage}
            alt={photo.caption || "Photo"}
            fill
            sizes="(max-width: 768px) 95vw, 600px"
            className="object-contain"
            priority
          />

          {/* Carousel controls */}
          {hasMultiple && (
            <>
              <button
                onClick={() => setCarouselIdx(Math.max(0, carouselIdx - 1))}
                className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-bg border-3 border-ink flex items-center justify-center font-head font-bold text-sm cursor-pointer ${carouselIdx === 0 ? "opacity-30" : "hover:bg-ink hover:text-bg"}`}
                disabled={carouselIdx === 0}
              >
                ‹
              </button>
              <button
                onClick={() => setCarouselIdx(Math.min(photo.image_urls.length - 1, carouselIdx + 1))}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-bg border-3 border-ink flex items-center justify-center font-head font-bold text-sm cursor-pointer ${carouselIdx === photo.image_urls.length - 1 ? "opacity-30" : "hover:bg-ink hover:text-bg"}`}
                disabled={carouselIdx === photo.image_urls.length - 1}
              >
                ›
              </button>
              {/* Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photo.image_urls.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCarouselIdx(i)}
                    className={`w-2 h-2 rounded-full border border-ink cursor-pointer ${i === carouselIdx ? "bg-ink" : "bg-bg/80"}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Nav between posts */}
          <button
            onClick={onPrev}
            disabled={idx === 0}
            className={`absolute left-2 bottom-3 md:bottom-auto md:top-3 w-7 h-7 bg-bg/80 border-2 border-ink flex items-center justify-center font-mono text-[0.7rem] cursor-pointer hover:bg-ink hover:text-bg ${idx === 0 ? "opacity-20" : ""}`}
            title="Previous post"
          >
            ←
          </button>
          <button
            onClick={onNext}
            disabled={idx === photos.length - 1}
            className={`absolute right-2 bottom-3 md:bottom-auto md:top-3 w-7 h-7 bg-bg/80 border-2 border-ink flex items-center justify-center font-mono text-[0.7rem] cursor-pointer hover:bg-ink hover:text-bg ${idx === photos.length - 1 ? "opacity-20" : ""}`}
            title="Next post"
          >
            →
          </button>
        </div>

        {/* Caption panel */}
        <div className="md:w-[280px] border-t-3 md:border-t-0 md:border-l-3 border-ink p-5 overflow-y-auto max-h-[200px] md:max-h-none">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-8 h-8 bg-bg border-3 border-ink flex items-center justify-center font-head font-bold text-sm cursor-pointer hover:bg-ink hover:text-bg z-10"
          >
            ✕
          </button>

          {postDate && (
            <p className="font-mono text-[0.65rem] uppercase tracking-wider opacity-50 mb-3">
              {postDate}
            </p>
          )}

          {photo.caption ? (
            <p className="font-body text-[0.85rem] leading-relaxed whitespace-pre-line">
              {photo.caption}
            </p>
          ) : (
            <p className="font-mono text-[0.75rem] opacity-30 italic">No caption</p>
          )}

          {hasMultiple && (
            <p className="font-mono text-[0.65rem] opacity-40 mt-4">
              {carouselIdx + 1} of {photo.image_urls.length} photos
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
