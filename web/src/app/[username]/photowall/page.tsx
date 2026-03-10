"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { posts, type PhotoPost } from "@/lib/photowall-data";
import { photowallUrl } from "@/lib/cdn";
import Image from "next/image";

const BATCH_SIZE = 30;

export default function PhotowallPage() {
  const [visible, setVisible] = useState(BATCH_SIZE);
  const [selected, setSelected] = useState<PhotoPost | null>(null);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible((v) => Math.min(v + BATCH_SIZE, posts.length));
        }
      },
      { rootMargin: "600px" }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, []);

  // Keyboard nav for lightbox
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!selected) return;
      if (e.key === "Escape") setSelected(null);
      if (e.key === "ArrowLeft") {
        const idx = posts.indexOf(selected);
        if (idx > 0) {
          setSelected(posts[idx - 1]);
          setCarouselIdx(0);
        }
      }
      if (e.key === "ArrowRight") {
        const idx = posts.indexOf(selected);
        if (idx < posts.length - 1) {
          setSelected(posts[idx + 1]);
          setCarouselIdx(0);
        }
      }
    },
    [selected]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // Lock body scroll when lightbox open
  useEffect(() => {
    if (selected) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [selected]);

  const openPost = (post: PhotoPost) => {
    setSelected(post);
    setCarouselIdx(0);
  };

  const displayed = posts.slice(0, visible);

  return (
    <>
      <main className="max-w-[1400px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 border-3 border-ink bg-bg p-6"
             style={{ boxShadow: "4px 4px 0 var(--ink)" }}>
          <h1 className="font-head font-[900] text-[2rem] uppercase tracking-tight leading-none mb-1">
            Photowall
          </h1>
          <p className="font-mono text-[0.75rem] opacity-60">
            {posts.length} posts · Mostly cats, food & travel
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
                src={photowallUrl(post.images[0])}
                alt={post.caption || "Instagram post"}
                fill
                sizes="(max-width: 768px) 33vw, 300px"
                className="object-cover transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
              />
              {/* Multi-image indicator */}
              {post.images.length > 1 && (
                <div className="absolute top-2 right-2 bg-ink/70 text-bg font-mono text-[0.65rem] px-1.5 py-0.5">
                  {post.images.length}
                </div>
              )}
              {/* Hover overlay */}
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

        {/* Load more sentinel */}
        {visible < posts.length && (
          <div ref={sentinelRef} className="flex justify-center py-12">
            <div className="font-mono text-[0.75rem] opacity-40">
              Loading more...
            </div>
          </div>
        )}

        {visible >= posts.length && (
          <div className="flex justify-center py-12">
            <div className="font-mono text-[0.75rem] opacity-40">
              That&apos;s all {posts.length} posts ✓
            </div>
          </div>
        )}
      </main>

      {/* Lightbox */}
      {selected && (
        <Lightbox
          post={selected}
          carouselIdx={carouselIdx}
          setCarouselIdx={setCarouselIdx}
          onClose={() => setSelected(null)}
          onPrev={() => {
            const idx = posts.indexOf(selected);
            if (idx > 0) { setSelected(posts[idx - 1]); setCarouselIdx(0); }
          }}
          onNext={() => {
            const idx = posts.indexOf(selected);
            if (idx < posts.length - 1) { setSelected(posts[idx + 1]); setCarouselIdx(0); }
          }}
        />
      )}
    </>
  );
}

function Lightbox({
  post,
  carouselIdx,
  setCarouselIdx,
  onClose,
  onPrev,
  onNext,
}: {
  post: PhotoPost;
  carouselIdx: number;
  setCarouselIdx: (i: number) => void;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const currentImage = post.images[carouselIdx] || post.images[0];
  const hasMultiple = post.images.length > 1;
  const postDate = post.date
    ? new Date(post.date + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

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
            src={photowallUrl(currentImage)}
            alt={post.caption || "Instagram post"}
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
                onClick={() => setCarouselIdx(Math.min(post.images.length - 1, carouselIdx + 1))}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-bg border-3 border-ink flex items-center justify-center font-head font-bold text-sm cursor-pointer ${carouselIdx === post.images.length - 1 ? "opacity-30" : "hover:bg-ink hover:text-bg"}`}
                disabled={carouselIdx === post.images.length - 1}
              >
                ›
              </button>
              {/* Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {post.images.map((_, i) => (
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
            className="absolute left-2 bottom-3 md:bottom-auto md:top-3 w-7 h-7 bg-bg/80 border-2 border-ink flex items-center justify-center font-mono text-[0.7rem] cursor-pointer hover:bg-ink hover:text-bg"
            title="Previous post"
          >
            ←
          </button>
          <button
            onClick={onNext}
            className="absolute right-2 bottom-3 md:bottom-auto md:top-3 w-7 h-7 bg-bg/80 border-2 border-ink flex items-center justify-center font-mono text-[0.7rem] cursor-pointer hover:bg-ink hover:text-bg"
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
            className="absolute top-2 right-2 md:right-auto md:left-auto w-8 h-8 bg-bg border-3 border-ink flex items-center justify-center font-head font-bold text-sm cursor-pointer hover:bg-ink hover:text-bg z-10"
            style={{ position: "absolute", top: 8, right: 8 }}
          >
            ✕
          </button>

          {postDate && (
            <p className="font-mono text-[0.65rem] uppercase tracking-wider opacity-50 mb-3">
              {postDate}
            </p>
          )}

          {post.caption ? (
            <p className="font-body text-[0.85rem] leading-relaxed whitespace-pre-line">
              {post.caption}
            </p>
          ) : (
            <p className="font-mono text-[0.75rem] opacity-30 italic">
              No caption
            </p>
          )}

          {hasMultiple && (
            <p className="font-mono text-[0.65rem] opacity-40 mt-4">
              {carouselIdx + 1} of {post.images.length} photos
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
