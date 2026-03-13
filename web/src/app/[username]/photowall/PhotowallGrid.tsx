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
  tags: string[] | null;
}

interface PhotowallGridProps {
  userId: string;
  username: string;
  isOwner: boolean;
  /** When set, only show DB photos with this tag; skip archive entirely */
  filterTag?: string;
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
    tags: null,
  }));
}

export default function PhotowallGrid({ userId, username, isOwner, filterTag }: PhotowallGridProps) {
  const [dbPhotos, setDbPhotos] = useState<UnifiedPost[]>([]);
  const [dbTotal, setDbTotal] = useState(0);
  const [dbOffset, setDbOffset] = useState(0);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbLoadingMore, setDbLoadingMore] = useState(false);

  // Archive is skipped when filtering by tag (archive has no tags)
  const archive = filterTag ? [] : archiveToUnified();

  // Visible count into the combined list
  const [visible, setVisible] = useState(BATCH_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [selected, setSelected] = useState<UnifiedPost | null>(null);
  const [carouselIdx, setCarouselIdx] = useState(0);

  // Fetch initial DB photos (with optional tag filter)
  useEffect(() => {
    async function fetchDb() {
      setDbLoading(true);
      try {
        const tagParam = filterTag ? `&tag=${encodeURIComponent(filterTag)}` : "";
        const res = await fetch(`/api/photos?user_id=${userId}&limit=${BATCH_SIZE}&offset=0${tagParam}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const mapped: UnifiedPost[] = (data.photos ?? []).map(
          (p: { id: string; image_urls: string[]; caption: string | null; date: string | null; tags: string[] | null }) => ({
            id: `db_${p.id}`,
            imageUrls: p.image_urls,
            caption: p.caption,
            date: p.date,
            source: "db" as const,
            tags: p.tags || null,
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
  }, [userId, filterTag]);

  // Merge: DB photos first, then archive (archive empty when filtering)
  const allPosts: UnifiedPost[] = [...dbPhotos, ...archive];
  const total = filterTag ? dbTotal : dbTotal + archive.length;
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
        const tagParam = filterTag ? `&tag=${encodeURIComponent(filterTag)}` : "";
        const res = await fetch(`/api/photos?user_id=${userId}&limit=${BATCH_SIZE}&offset=${dbOffset}${tagParam}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const mapped: UnifiedPost[] = (data.photos ?? []).map(
          (p: { id: string; image_urls: string[]; caption: string | null; date: string | null; tags: string[] | null }) => ({
            id: `db_${p.id}`,
            imageUrls: p.image_urls,
            caption: p.caption,
            date: p.date,
            source: "db" as const,
            tags: p.tags || null,
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
  }, [visible, allPosts.length, dbPhotos.length, dbTotal, dbLoadingMore, userId, dbOffset, filterTag]);

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

  // Keyboard nav — skip if focus is inside an input or textarea
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!selected) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;
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

  // Delete a DB photo — removes from state and closes lightbox [SQ.S-W-2603-0053]
  const handleDelete = async (post: UnifiedPost) => {
    if (post.source !== "db") return;
    const photoId = post.id.replace("db_", "");
    const res = await fetch(`/api/photos?id=${photoId}`, { method: "DELETE" });
    if (!res.ok) return;
    setDbPhotos((prev) => prev.filter((p) => p.id !== post.id));
    setDbTotal((prev) => Math.max(0, prev - 1));
    setSelected(null);
  };

  // Edit a DB photo caption + tags — updates local state [SQ.S-W-2603-0054]
  const handleEdit = (updatedPost: UnifiedPost) => {
    setDbPhotos((prev) => prev.map((p) => p.id === updatedPost.id ? updatedPost : p));
    setSelected(updatedPost);
  };

  return (
    <>
      <main className="max-w-[1400px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 border-3 border-ink bg-bg p-6" style={{ boxShadow: "4px 4px 0 var(--ink)" }}>
          <h1 className="font-head font-[900] text-[2rem] uppercase tracking-tight leading-none mb-1">
            {filterTag ? filterTag : "Photowall"}
          </h1>
          <p className="font-mono text-[0.75rem] opacity-60">
            {dbLoading
              ? "Loading…"
              : filterTag
                ? `${total} photo${total === 1 ? "" : "s"} tagged "${filterTag}"`
                : `${total} post${total === 1 ? "" : "s"}`}
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
          isOwner={isOwner}
          onDelete={handleDelete}
          onEdit={handleEdit}
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
  isOwner,
  onDelete,
  onEdit,
  onPrev,
  onNext,
}: {
  post: UnifiedPost;
  displayed: UnifiedPost[];
  carouselIdx: number;
  setCarouselIdx: (i: number) => void;
  onClose: () => void;
  isOwner: boolean;
  onDelete: (post: UnifiedPost) => void;
  onEdit: (post: UnifiedPost) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentImage = post.imageUrls[carouselIdx] || post.imageUrls[0];
  const hasMultiple = post.imageUrls.length > 1;
  const postDate = post.date
    ? new Date(post.date + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric",
      })
    : "";
  const idx = displayed.findIndex((p) => p.id === post.id);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Reset panel state when switching posts
  useEffect(() => {
    setEditing(false);
    setMenuOpen(false);
    setConfirmDelete(false);
  }, [post.id]);

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
        {/* ── Image pane ── */}
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

        {/* ── Side panel ── */}
        <div className="md:w-[280px] border-t-3 md:border-t-0 md:border-l-3 border-ink px-5 pb-5 pt-5 md:pt-12 overflow-y-auto max-h-[200px] md:max-h-none flex flex-col">

          {/* Top-right action buttons: burger menu (owner + DB) + close */}
          <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
            {isOwner && post.source === "db" && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-8 h-8 bg-bg border-3 border-ink flex items-center justify-center cursor-pointer hover:bg-ink hover:text-bg"
                  title="More options"
                >
                  <DotsIcon />
                </button>
                {menuOpen && (
                  <div
                    className="absolute top-full right-0 mt-1 bg-bg border-3 border-ink w-48"
                    style={{ boxShadow: "3px 3px 0 var(--ink)" }}
                  >
                    <button
                      onClick={() => { setMenuOpen(false); setEditing(true); setConfirmDelete(false); }}
                      className="w-full text-left px-3 py-2.5 font-mono text-[0.72rem] hover:bg-ink/5 flex items-center gap-2 cursor-pointer"
                    >
                      <PencilIcon /> Edit caption &amp; tags
                    </button>
                    <div className="border-t border-ink/10" />
                    <button
                      onClick={() => { setMenuOpen(false); setConfirmDelete(true); setEditing(false); }}
                      className="w-full text-left px-3 py-2.5 font-mono text-[0.72rem] text-red-500 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                    >
                      <TrashIcon /> Delete photo
                    </button>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 bg-bg border-3 border-ink flex items-center justify-center font-head font-bold text-sm cursor-pointer hover:bg-ink hover:text-bg"
            >✕</button>
          </div>

          {/* Panel content — edit mode or normal view */}
          {editing ? (
            <EditPanel
              post={post}
              onSave={(updated) => { onEdit(updated); setEditing(false); }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              {postDate && (
                <p className="font-mono text-[0.65rem] uppercase tracking-wider opacity-50 mb-3">{postDate}</p>
              )}

              {post.caption ? (
                <p className="font-body text-[0.85rem] leading-relaxed whitespace-pre-line">{post.caption}</p>
              ) : (
                <p className="font-mono text-[0.75rem] opacity-30 italic">No caption</p>
              )}

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {post.tags.map((tag) => (
                    <span key={tag} className="font-mono text-[0.62rem] border border-ink/30 px-2 py-0.5 opacity-60">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {hasMultiple && (
                <p className="font-mono text-[0.65rem] opacity-40 mt-4">
                  {carouselIdx + 1} of {post.imageUrls.length} photos
                </p>
              )}

              {/* Delete confirmation — shown after selecting Delete from menu */}
              {confirmDelete && (
                <div className="mt-auto pt-4 border-t-2 border-ink/10">
                  <p className="font-mono text-[0.65rem] opacity-60 text-center mb-2">Delete this photo?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { onDelete(post); setConfirmDelete(false); }}
                      className="flex-1 font-mono text-[0.72rem] text-bg bg-red-500 border-2 border-red-500 px-3 py-1.5 cursor-pointer hover:bg-red-600 transition-colors"
                    >
                      Yes, delete
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 font-mono text-[0.72rem] border-2 border-ink/20 px-3 py-1.5 cursor-pointer hover:bg-ink/5 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Edit panel — replaces side panel content when editing caption/tags [SQ.S-W-2603-0054] */
function EditPanel({
  post,
  onSave,
  onCancel,
}: {
  post: UnifiedPost;
  onSave: (updated: UnifiedPost) => void;
  onCancel: () => void;
}) {
  const [caption, setCaption] = useState(post.caption || "");
  const [tagsInput, setTagsInput] = useState((post.tags || []).join(", "));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const photoId = post.id.replace("db_", "");
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    try {
      const res = await fetch("/api/photos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: photoId, caption: caption || null, tags }),
      });
      if (!res.ok) throw new Error();
      onSave({ ...post, caption: caption || null, tags: tags.length ? tags : null });
    } catch {
      setError("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="font-mono text-[0.65rem] uppercase tracking-wider opacity-50 mb-1.5 block">
          Caption
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={5}
          className="w-full border-2 border-ink/30 focus:border-ink p-2 font-body text-[0.85rem] resize-none outline-none bg-bg"
          placeholder="Add a caption…"
        />
      </div>
      <div>
        <label className="font-mono text-[0.65rem] uppercase tracking-wider opacity-50 mb-1.5 block">
          Tags
        </label>
        <input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="w-full border-2 border-ink/30 focus:border-ink p-2 font-mono text-[0.75rem] outline-none bg-bg"
          placeholder="tag1, tag2, tag3"
        />
        <p className="font-mono text-[0.6rem] opacity-30 mt-1">Comma-separated</p>
      </div>
      {error && <p className="font-mono text-[0.65rem] text-red-500">{error}</p>}
      <div className="flex gap-2 pt-2 border-t-2 border-ink/10">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 font-mono text-[0.72rem] bg-ink text-bg border-2 border-ink px-3 py-1.5 cursor-pointer hover:opacity-80 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="flex-1 font-mono text-[0.72rem] border-2 border-ink/20 px-3 py-1.5 cursor-pointer hover:bg-ink/5 disabled:opacity-40"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Icons ──

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}
