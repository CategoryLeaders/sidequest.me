"use client";

import { useState, useEffect, useRef } from "react";
import type { MicroblogPost } from "@/lib/microblogs";

interface MicroblogsManagerProps {
  username: string;
}

export default function MicroblogsManager({ username }: MicroblogsManagerProps) {
  const [microblogs, setMicroblogs] = useState<MicroblogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [postType, setPostType] = useState<"standard" | "link">("standard");
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [locationName, setLocationName] = useState("");
  const [photos, setPhotos] = useState<{ url: string }[]>([]);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/microblogs")
      .then((r) => r.json())
      .then((data) => {
        setMicroblogs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handlePhotoUpload = async (files: FileList) => {
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const form = new FormData();
      form.append("file", file);
      form.append("context", "microblogs");
      try {
        const res = await fetch("/api/upload-image", { method: "POST", body: form });
        if (res.ok) {
          const { url } = (await res.json()) as { url: string };
          setPhotos((prev) => [...prev, { url }]);
        }
      } catch {
        /* skip */
      }
    }
  };

  const handlePost = async () => {
    if (!body.trim()) return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch("/api/microblogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_type: postType,
          body: body.trim(),
          link_url: postType === "link" ? linkUrl.trim() || null : null,
          media: photos.map((p) => ({ url: p.url, type: "image" })),
          location_name: locationName.trim() || null,
        }),
      });
      if (!res.ok) {
        const { error: e } = await res.json().catch(() => ({ error: "Post failed" }));
        setError(e);
        return;
      }
      setBody("");
      setLinkUrl("");
      setLocationName("");
      setPhotos([]);
      setPostType("standard");
      setComposerOpen(false);
      // Refresh list
      const listRes = await fetch("/api/microblogs");
      const data = await listRes.json();
      setMicroblogs(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to create post");
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/microblogs/${id}`, { method: "DELETE" });
    setMicroblogs((prev) => prev.filter((m) => m.id !== id));
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return (
      date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
      " · " +
      date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    );
  };

  if (loading) return <p className="font-mono text-[0.78rem] opacity-40">Loading microblogs…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="font-mono text-[0.68rem] opacity-50">{microblogs.length} microblogs</p>
        {!composerOpen && (
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="px-4 py-1.5 border-3 border-ink bg-bg-card font-head font-bold text-[0.68rem] uppercase hover:bg-ink hover:text-bg transition-colors no-underline"
          >
            + New microblog
          </button>
        )}
      </div>

      {/* Composer */}
      {composerOpen && (
        <div className="mb-6 border-3 border-ink p-4 bg-bg-card">
          {/* Post type selector */}
          <div className="flex gap-2 mb-3">
            {(["standard", "link"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setPostType(type)}
                className={`font-mono text-[0.6rem] font-bold uppercase px-2.5 py-1 border-2 transition-all cursor-pointer ${
                  postType === type ? "border-ink bg-ink text-bg" : "border-ink/25 hover:border-ink/50"
                }`}
              >
                {type === "standard" ? "✏️ Standard" : "🔗 Link"}
              </button>
            ))}
          </div>

          {/* Link URL input */}
          {postType === "link" && (
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://... (URL)"
              className="w-full px-3 py-2 border-3 border-ink bg-bg font-mono text-[0.8rem] focus:outline-none focus:shadow-[3px_3px_0_var(--ink)] transition-shadow mb-3"
            />
          )}

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
            className="w-full px-3 py-2 border-3 border-ink bg-bg font-body text-[0.88rem] focus:outline-none focus:shadow-[3px_3px_0_var(--ink)] transition-shadow resize-y mb-3"
          />

          {/* Photos */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handlePhotoUpload(e.target.files);
              e.target.value = "";
            }}
          />
          {photos.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-2">
              {photos.map((p, i) => (
                <div key={i} className="relative w-16 h-16 border-2 border-ink overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute top-0 right-0 bg-black/60 text-white text-[8px] w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="px-3 py-1.5 border-2 border-dashed border-ink/30 font-mono text-[0.65rem] text-ink-muted hover:border-ink/60 cursor-pointer transition-colors"
            >
              📸 Add photos
            </button>
          </div>

          <input
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="📍 Location (optional)"
            className="w-full px-3 py-2 border-2 border-ink/20 bg-bg font-mono text-[0.75rem] focus:outline-none focus:border-ink/50 transition-colors mb-3"
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePost}
              disabled={posting || !body.trim()}
              className="px-5 py-2 bg-ink text-bg font-head font-bold text-[0.72rem] uppercase border-3 border-ink hover:bg-orange hover:border-orange transition-colors disabled:opacity-40 cursor-pointer"
            >
              {posting ? "Posting…" : "Post"}
            </button>
            <button
              type="button"
              onClick={() => {
                setComposerOpen(false);
                setBody("");
                setLinkUrl("");
                setPhotos([]);
                setLocationName("");
                setPostType("standard");
              }}
              className="font-mono text-[0.68rem] text-ink-muted hover:text-ink cursor-pointer transition-colors"
            >
              Cancel
            </button>
          </div>
          {error && <p className="mt-2 font-mono text-[0.72rem] text-red-500">{error}</p>}
        </div>
      )}

      {/* List */}
      {microblogs.length === 0 ? (
        <p className="font-mono text-[0.78rem] opacity-40 py-6 text-center">No microblogs yet.</p>
      ) : (
        <div className="divide-y divide-ink/10">
          {microblogs.map((m) => (
            <div key={m.id} className="py-3 group">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[0.85rem] leading-relaxed mb-1">{m.body}</p>
                  {m.images && m.images.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-1">
                      {m.images.map((img, i) => (
                        <div key={i} className="w-16 h-16 border border-ink/10 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url} alt={img.alt_text ?? ""} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 font-mono text-[0.55rem] text-ink-muted">
                    <span>{formatDate(m.published_at ?? m.created_at)}</span>
                    {m.tags && m.tags.length > 0 && <span>{m.tags.map((t) => `#${t}`).join(" ")}</span>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(m.id)}
                  className="font-mono text-[0.55rem] text-ink-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex-shrink-0"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
