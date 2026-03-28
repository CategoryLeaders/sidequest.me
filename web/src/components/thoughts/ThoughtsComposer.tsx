"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ThoughtType } from "@/lib/thoughts-types";
import type { MicroblogImage } from "@/lib/microblogs";
import type { SiteTag } from "@/lib/tags";
import { ImageManager } from "@/components/shared/ImageManager";

interface Props {
  username: string;
  siteTags?: SiteTag[];
}

type ComposerType = ThoughtType | "changelog";

const TYPES: { key: ComposerType; label: string; icon: string; color: string }[] = [
  { key: "microblog", label: "Microblog", icon: "✏️", color: "sticker-orange" },
  { key: "changelog", label: "Changelog", icon: "📋", color: "sticker-green" },
  { key: "writing", label: "Writing", icon: "📝", color: "sticker-blue" },
  { key: "bookmark", label: "Bookmark", icon: "🔖", color: "sticker-lilac" },
  { key: "quote", label: "Quote", icon: "💬", color: "sticker-yellow" },
  { key: "question", label: "Question", icon: "❓", color: "sticker-orange" },
];

export default function ThoughtsComposer({ username, siteTags }: Props) {
  const [activeType, setActiveType] = useState<ComposerType | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const reset = () => {
    setActiveType(null);
    setError(null);
    setSuccess(null);
  };

  const handleSuccess = (msg: string) => {
    setSuccess(msg);
    setSaving(false);
    setTimeout(() => {
      reset();
      window.location.reload();
    }, 1200);
  };

  if (!activeType) {
    return (
      <div className="border-3 border-dashed border-ink/20 p-5 mb-8 bg-[var(--bg-card)]">
        <p className="font-mono text-[0.7rem] text-ink/40 mb-3">New thought</p>
        <div className="flex flex-wrap gap-2">
          {TYPES.map(({ key, label, icon, color }) => (
            <button
              key={key}
              onClick={() => {
                if (key === "writing") {
                  window.location.href = `/${username}/admin/writings/new`;
                  return;
                }
                setActiveType(key);
              }}
              className={`sticker ${color} text-[0.7rem] !px-3 !py-2 !border-2 cursor-pointer hover:scale-105 transition-transform`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border-3 border-ink p-5 mb-8 bg-[var(--bg-card)]">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[0.7rem] text-ink/60">
          New {activeType}
        </span>
        <button
          onClick={reset}
          className="font-mono text-[0.65rem] text-ink/40 hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="border-2 border-red-400 bg-red-50 text-red-700 text-[0.75rem] px-3 py-2 mb-4 font-mono">
          {error}
        </div>
      )}
      {success && (
        <div className="border-2 border-green-400 bg-green-50 text-green-700 text-[0.75rem] px-3 py-2 mb-4 font-mono">
          {success}
        </div>
      )}

      {activeType === "microblog" && (
        <MicroblogForm saving={saving} setSaving={setSaving} setError={setError} onSuccess={handleSuccess} siteTags={siteTags} />
      )}
      {activeType === "changelog" && (
        <ChangelogForm saving={saving} setSaving={setSaving} setError={setError} onSuccess={handleSuccess} />
      )}
      {activeType === "bookmark" && (
        <BookmarkForm saving={saving} setSaving={setSaving} setError={setError} onSuccess={handleSuccess} />
      )}
      {activeType === "quote" && (
        <QuoteForm saving={saving} setSaving={setSaving} setError={setError} onSuccess={handleSuccess} />
      )}
      {activeType === "question" && (
        <QuestionForm saving={saving} setSaving={setSaving} setError={setError} onSuccess={handleSuccess} />
      )}
    </div>
  );
}

/* ── Shared helpers ──────────────────────────────────────────────────────── */

interface FormChildProps {
  saving: boolean;
  setSaving: (v: boolean) => void;
  setError: (v: string | null) => void;
  onSuccess: (msg: string) => void;
  siteTags?: SiteTag[];
}

function SiteTagPicker({ tags, siteTags, setTags }: { tags: string[]; siteTags: SiteTag[]; setTags: (t: string[]) => void }) {
  const toggle = (label: string) => {
    setTags(tags.includes(label) ? tags.filter(t => t !== label) : [...tags, label]);
  };
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {siteTags.map(st => {
        const active = tags.includes(st.label);
        const colorKey = st.color.replace("sticker-", "");
        return (
          <button
            key={st.label}
            type="button"
            onClick={() => toggle(st.label)}
            className={`sticker text-[0.65rem] ${active ? `sticker-${colorKey}` : ""}`}
            style={{ padding: "3px 10px", opacity: active ? 1 : 0.35 }}
          >
            {st.icon ? `${st.icon} ` : ""}{st.label}
          </button>
        );
      })}
    </div>
  );
}

function TagInput({ tags, setTags }: { tags: string[]; setTags: (t: string[]) => void }) {
  const [input, setInput] = useState("");
  const addTag = () => {
    const t = input.trim().replace(/^#/, "");
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setInput("");
  };
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 font-mono text-[0.65rem] px-2 py-1 border border-ink/20 bg-ink/[0.04]">
          #{t}
          <button onClick={() => setTags(tags.filter((x) => x !== t))} className="text-ink/30 hover:text-ink ml-0.5">&times;</button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
        onBlur={addTag}
        placeholder="Add tag..."
        className="font-mono text-[0.7rem] border-none outline-none bg-transparent w-24 placeholder:text-ink/20"
      />
    </div>
  );
}

function VisibilitySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="font-mono text-[0.65rem] border-2 border-ink/20 px-2 py-1 bg-transparent outline-none"
    >
      <option value="public">Public</option>
      <option value="unlisted">Unlisted</option>
      <option value="private">Private</option>
    </select>
  );
}

function ActionButtons({ saving, onPublish, onDraft }: { saving: boolean; onPublish: () => void; onDraft: () => void }) {
  return (
    <div className="flex gap-2 mt-4">
      <button
        onClick={onPublish}
        disabled={saving}
        className="sticker sticker-orange text-[0.7rem] !px-4 !py-2 !border-2 cursor-pointer disabled:opacity-40"
      >
        {saving ? "Saving..." : "Publish"}
      </button>
      <button
        onClick={onDraft}
        disabled={saving}
        className="font-mono text-[0.65rem] px-3 py-1.5 border-2 border-ink/20 text-ink/50 hover:text-ink transition-colors cursor-pointer disabled:opacity-40"
      >
        Save draft
      </button>
    </div>
  );
}

/* ── Changelog composer ──────────────────────────────────────────────────── */

interface ChangelogItemState {
  id: string;
  text: string;
  image: { url: string; storage_path?: string } | null;
  uploading: boolean;
}

function ChangelogForm({ saving, setSaving, setError, onSuccess }: FormChildProps) {
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<ChangelogItemState[]>([
    { id: crypto.randomUUID(), text: "", image: null, uploading: false },
  ]);
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState("public");
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const totalChars = title.length + items.reduce((acc, i) => acc + i.text.length, 0);
  const MAX = 2000;

  const updateItem = (id: string, patch: Partial<ChangelogItemState>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const addItem = () =>
    setItems((prev) => [...prev, { id: crypto.randomUUID(), text: "", image: null, uploading: false }]);

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const handleImageUpload = async (id: string, file: File) => {
    if (!file.type.startsWith("image/")) return;
    updateItem(id, { uploading: true });
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("context", "microblogs");
      const res = await fetch("/api/upload-image", { method: "POST", body: form });
      if (res.ok) {
        const { url, storage_path } = await res.json() as { url: string; storage_path?: string };
        updateItem(id, { image: { url, storage_path }, uploading: false });
      } else {
        updateItem(id, { uploading: false });
        setError("Image upload failed");
      }
    } catch {
      updateItem(id, { uploading: false });
      setError("Image upload failed");
    }
  };

  const handleDeleteImage = (id: string) => updateItem(id, { image: null });

  const submit = useCallback(async (status: "published" | "draft") => {
    if (!title.trim()) { setError("Title is required"); return; }
    if (items.every((i) => !i.text.trim())) { setError("At least one change item is required"); return; }
    if (totalChars > MAX) { setError(`Too long — ${totalChars}/${MAX} characters`); return; }
    setSaving(true);
    setError(null);
    try {
      const changelogItems = items
        .filter((i) => i.text.trim())
        .map((i) => ({ text: i.text.trim(), ...(i.image ? { image: i.image } : {}) }));
      const res = await fetch("/api/microblogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_type: "changelog", title: title.trim(), changelog_items: changelogItems, tags, visibility, status }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      onSuccess("Changelog posted!");
    } catch (e: any) { setError(e.message); setSaving(false); }
  }, [title, items, tags, visibility, totalChars, setSaving, setError, onSuccess]);

  return (
    <>
      {/* Title */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Changelog title *"
        maxLength={200}
        className="w-full border-2 border-ink/20 px-3 py-2.5 text-[0.95rem] font-head font-bold outline-none bg-transparent focus:border-[var(--orange)] transition-colors placeholder:text-ink/20 mb-4"
      />

      {/* Change items */}
      <div className="space-y-3 mb-3">
        {items.map((item, idx) => (
          <div key={item.id} className="border-2 border-ink/10 p-3 bg-ink/[0.02]">
            <div className="flex gap-2 items-start mb-2">
              <span className="font-mono text-[0.65rem] text-ink/30 mt-2.5 shrink-0">•</span>
              <textarea
                value={item.text}
                onChange={(e) => updateItem(item.id, { text: e.target.value })}
                placeholder={`Change ${idx + 1}...`}
                rows={2}
                className="flex-1 border-2 border-ink/15 px-2.5 py-2 text-[0.85rem] font-mono outline-none bg-transparent focus:border-[var(--orange)] transition-colors placeholder:text-ink/20 resize-y"
              />
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="font-mono text-[0.65rem] text-ink/25 hover:text-red-400 transition-colors mt-2 shrink-0"
                  title="Remove item"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Image area */}
            {item.image ? (
              <div className="ml-4 relative inline-block mt-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image.url} alt="" className="max-h-48 max-w-full object-contain border-2 border-ink/15" />
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => fileRefs.current[item.id]?.click()}
                    className="font-mono text-[0.6rem] text-ink/40 hover:text-ink transition-colors border border-ink/15 px-2 py-0.5"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(item.id)}
                    className="font-mono text-[0.6rem] text-red-400 hover:text-red-600 transition-colors border border-red-200 px-2 py-0.5"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="ml-4 mt-1">
                {item.uploading ? (
                  <span className="font-mono text-[0.65rem] text-ink/30">Uploading…</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRefs.current[item.id]?.click()}
                    className="font-mono text-[0.6rem] text-ink/30 hover:text-ink transition-colors border border-dashed border-ink/20 px-2.5 py-1"
                  >
                    + Add image
                  </button>
                )}
              </div>
            )}
            <input
              ref={(el) => { fileRefs.current[item.id] = el; }}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(item.id, f); e.target.value = ""; }}
            />
          </div>
        ))}
      </div>

      {/* Add change */}
      <button
        type="button"
        onClick={addItem}
        className="font-mono text-[0.65rem] text-ink/40 hover:text-ink transition-colors border border-dashed border-ink/20 px-3 py-1.5 w-full mb-4"
      >
        + Add change
      </button>

      {/* Footer */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <TagInput tags={tags} setTags={setTags} />
          <VisibilitySelect value={visibility} onChange={setVisibility} />
        </div>
        <span className={`font-mono text-[0.6rem] ${totalChars > MAX ? "text-red-500" : "text-ink/30"}`}>
          {totalChars}/{MAX}
        </span>
      </div>
      <ActionButtons saving={saving} onPublish={() => submit("published")} onDraft={() => submit("draft")} />
    </>
  );
}

/* ── Microblog composer ──────────────────────────────────────────────────── */

type LinkType = "adventure" | "project" | "";

function MicroblogForm({ saving, setSaving, setError, onSuccess, siteTags }: FormChildProps) {
  const [body, setBody] = useState("");
  const [images, setImages] = useState<MicroblogImage[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState("public");
  const [linkType, setLinkType] = useState<LinkType>("");
  const [linkId, setLinkId] = useState("");
  const [adventures, setAdventures] = useState<{ id: string; title: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);
  // TODO: professional role — awaiting job_roles DB table

  useEffect(() => {
    fetch("/api/adventures")
      .then((r) => r.ok ? r.json() : [])
      .then((data: any[]) => setAdventures(Array.isArray(data) ? data.map((a) => ({ id: a.id, title: a.title })) : []))
      .catch(() => {});
    fetch("/api/projects")
      .then((r) => r.ok ? r.json() : [])
      .then((data: any[]) => setProjects(Array.isArray(data) ? data.map((p) => ({ id: p.id, title: p.title })) : []))
      .catch(() => {});
  }, []);

  const toggleLinkType = (type: LinkType) => {
    if (linkType === type) {
      setLinkType("");
      setLinkId("");
    } else {
      setLinkType(type);
      setLinkId("");
    }
  };

  const submit = useCallback(async (status: "published" | "draft") => {
    if (!body.trim()) { setError("Post body is required"); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/microblogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: body.trim(),
          media: images,
          tags,
          visibility,
          status,
          ...(linkType && linkId ? { context_type: linkType, context_id: linkId } : {}),
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      onSuccess("Microblog posted!");
    } catch (e: any) { setError(e.message); setSaving(false); }
  }, [body, images, tags, visibility, linkType, linkId, setSaving, setError, onSuccess]);

  const hasLinkOptions = adventures.length > 0 || projects.length > 0;
  const linkEntities = linkType === "adventure" ? adventures : linkType === "project" ? projects : [];

  return (
    <>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What's on your mind?"
        rows={4}
        className="w-full border-2 border-ink/20 px-3 py-2.5 text-[0.88rem] font-mono outline-none bg-transparent focus:border-[var(--orange)] transition-colors placeholder:text-ink/20 resize-y mb-3"
      />

      {/* Images */}
      <div className="mb-3">
        <ImageManager images={images} onChange={setImages} entityId="new" />
      </div>

      {/* Link to */}
      {hasLinkOptions && (
        <div className="mb-3">
          <p className="font-mono text-[0.6rem] text-ink/30 mb-1.5 uppercase">Link to (optional)</p>
          <div className="flex flex-wrap gap-1.5 items-center">
            {adventures.length > 0 && (
              <button
                type="button"
                onClick={() => toggleLinkType("adventure")}
                className={`font-mono text-[0.65rem] px-2.5 py-1 border-2 cursor-pointer transition-all ${
                  linkType === "adventure"
                    ? "border-ink bg-ink text-[var(--cream)]"
                    : "border-ink/20 text-ink/50 hover:border-ink/40"
                }`}
              >
                🗺 Adventure
              </button>
            )}
            {projects.length > 0 && (
              <button
                type="button"
                onClick={() => toggleLinkType("project")}
                className={`font-mono text-[0.65rem] px-2.5 py-1 border-2 cursor-pointer transition-all ${
                  linkType === "project"
                    ? "border-ink bg-ink text-[var(--cream)]"
                    : "border-ink/20 text-ink/50 hover:border-ink/40"
                }`}
              >
                🛠 Project
              </button>
            )}
          </div>
          {linkType && linkEntities.length > 0 && (
            <select
              value={linkId}
              onChange={(e) => setLinkId(e.target.value)}
              className="mt-2 font-mono text-[0.7rem] border-2 border-ink/20 px-2 py-1.5 bg-transparent outline-none focus:border-[var(--orange)] transition-colors w-full max-w-xs"
            >
              <option value="">Select {linkType}…</option>
              {linkEntities.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Site tags */}
      {siteTags && siteTags.length > 0 && (
        <div className="mb-2">
          <p className="font-mono text-[0.6rem] text-ink/30 mb-1.5 uppercase">Site tags</p>
          <SiteTagPicker tags={tags} siteTags={siteTags} setTags={setTags} />
        </div>
      )}

      <div className="flex items-center gap-4 mb-2">
        <TagInput tags={tags} setTags={setTags} />
        <VisibilitySelect value={visibility} onChange={setVisibility} />
      </div>
      <ActionButtons saving={saving} onPublish={() => submit("published")} onDraft={() => submit("draft")} />
    </>
  );
}

/* ── Bookmark composer ───────────────────────────────────────────────────── */

function BookmarkForm({ saving, setSaving, setError, onSuccess }: FormChildProps) {
  const [url, setUrl] = useState("");
  const [commentary, setCommentary] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState("public");

  const submit = useCallback(async (status: "published" | "draft") => {
    if (!url.trim()) { setError("URL is required"); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), commentary: commentary.trim() || null, tags, visibility, status }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      onSuccess("Bookmark saved!");
    } catch (e: any) { setError(e.message); setSaving(false); }
  }, [url, commentary, tags, visibility, setSaving, setError, onSuccess]);

  return (
    <>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://..."
        className="w-full border-2 border-ink/20 px-3 py-2.5 text-[0.88rem] font-mono outline-none bg-transparent focus:border-[var(--orange)] transition-colors placeholder:text-ink/20 mb-3"
      />
      <textarea
        value={commentary}
        onChange={(e) => setCommentary(e.target.value)}
        placeholder="Your commentary (optional, max 500 chars)"
        rows={2}
        maxLength={500}
        className="w-full border-2 border-ink/20 px-3 py-2 text-[0.85rem] font-mono outline-none bg-transparent focus:border-[var(--orange)] transition-colors placeholder:text-ink/20 resize-y mb-3"
      />
      <div className="flex items-center justify-between text-[0.6rem] font-mono text-ink/30 mb-2">
        <span>{commentary.length}/500</span>
      </div>
      <div className="flex items-center gap-4 mb-2">
        <TagInput tags={tags} setTags={setTags} />
        <VisibilitySelect value={visibility} onChange={setVisibility} />
      </div>
      <ActionButtons saving={saving} onPublish={() => submit("published")} onDraft={() => submit("draft")} />
    </>
  );
}

/* ── Quote composer ──────────────────────────────────────────────────────── */

function QuoteForm({ saving, setSaving, setError, onSuccess }: FormChildProps) {
  const [quoteText, setQuoteText] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceWork, setSourceWork] = useState("");
  const [sourceYear, setSourceYear] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [commentary, setCommentary] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState("public");

  const submit = useCallback(async (status: "published" | "draft") => {
    if (!quoteText.trim()) { setError("Quote text is required"); return; }
    if (!sourceName.trim()) { setError("Source name is required"); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quote_text: quoteText.trim(),
          source_name: sourceName.trim(),
          source_work: sourceWork.trim() || null,
          source_year: sourceYear ? parseInt(sourceYear, 10) : null,
          source_url: sourceUrl.trim() || null,
          commentary: commentary.trim() || null,
          tags,
          visibility,
          status,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      onSuccess("Quote saved!");
    } catch (e: any) { setError(e.message); setSaving(false); }
  }, [quoteText, sourceName, sourceWork, sourceYear, sourceUrl, commentary, tags, visibility, setSaving, setError, onSuccess]);

  return (
    <>
      <textarea
        value={quoteText}
        onChange={(e) => setQuoteText(e.target.value)}
        placeholder="The quote..."
        rows={3}
        className="w-full border-2 border-ink/20 px-3 py-2.5 text-[0.88rem] italic outline-none bg-transparent focus:border-[var(--orange)] transition-colors placeholder:text-ink/20 resize-y mb-3"
      />
      <div className="grid grid-cols-2 gap-2 mb-3">
        <input
          value={sourceName}
          onChange={(e) => setSourceName(e.target.value)}
          placeholder="Source name *"
          className="border-2 border-ink/20 px-3 py-2 text-[0.8rem] font-mono outline-none bg-transparent focus:border-[var(--orange)] transition-colors placeholder:text-ink/20"
        />
        <input
          value={sourceWork}
          onChange={(e) => setSourceWork(e.target.value)}
          placeholder="Work title (optional)"
          className="border-2 border-ink/20 px-3 py-2 text-[0.8rem] font-mono outline-none bg-transparent focus:border-[var(--orange)] transition-colors placeholder:text-ink/20"
        />
        <input
          value={sourceYear}
          onChange={(e) => setSourceYear(e.target.value.replace(/\D/g, ""))}
          placeholder="Year (optional)"
          className="border-2 border-ink/20 px-3 py-2 text-[0.8rem] font-mono outline-none bg-transparent focus:border-[var(--orange)] transition-colors placeholder:text-ink/20"
        />
        <input
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="Source URL (optional)"
          className="border-2 border-ink/20 px-3 py-2 text-[0.8rem] font-mono outline-none bg-transparent focus:border-[var(--orange)] transition-colors placeholder:text-ink/20"
        />
      </div>
      <textarea
        value={commentary}
        onChange={(e) => setCommentary(e.target.value)}
        placeholder="Your commentary (optional, max 1000 chars)"
        rows={2}
        maxLength={1000}
        className="w-full border-2 border-ink/20 px-3 py-2 text-[0.85rem] font-mono outline-none bg-transparent focus:border-[var(--orange)] transition-colors placeholder:text-ink/20 resize-y mb-2"
      />
      <div className="flex items-center justify-between text-[0.6rem] font-mono text-ink/30 mb-2">
        <span>{commentary.length}/1000</span>
      </div>
      <div className="flex items-center gap-4 mb-2">
        <TagInput tags={tags} setTags={setTags} />
        <VisibilitySelect value={visibility} onChange={setVisibility} />
      </div>
      <ActionButtons saving={saving} onPublish={() => submit("published")} onDraft={() => submit("draft")} />
    </>
  );
}

/* ── Question composer ───────────────────────────────────────────────────── */

function QuestionForm({ saving, setSaving, setError, onSuccess }: FormChildProps) {
  const [questionText, setQuestionText] = useState("");
  const [thinking, setThinking] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState("public");

  const submit = useCallback(async (status: "published" | "draft") => {
    if (!questionText.trim()) { setError("Question text is required"); return; }
    if (questionText.trim().length > 280) { setError("Question must be 280 characters or fewer"); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_text: questionText.trim(),
          thinking: thinking.trim() || null,
          tags,
          visibility,
          status,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      onSuccess("Question posted!");
    } catch (e: any) { setError(e.message); setSaving(false); }
  }, [questionText, thinking, tags, visibility, setSaving, setError, onSuccess]);

  return (
    <>
      <textarea
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
        placeholder="What's your question? (max 280 chars)"
        rows={2}
        maxLength={280}
        className="w-full border-2 border-ink/20 px-3 py-2.5 text-[0.88rem] font-mono outline-none bg-transparent focus:border-[var(--orange)] transition-colors placeholder:text-ink/20 resize-y mb-1"
      />
      <div className="text-[0.6rem] font-mono text-ink/30 mb-3 text-right">
        {questionText.length}/280
      </div>
      <textarea
        value={thinking}
        onChange={(e) => setThinking(e.target.value)}
        placeholder="My thinking so far... (optional, max 1000 chars)"
        rows={3}
        maxLength={1000}
        className="w-full border-2 border-ink/20 px-3 py-2 text-[0.85rem] font-mono outline-none bg-transparent focus:border-[var(--orange)] transition-colors placeholder:text-ink/20 resize-y mb-2"
      />
      <div className="flex items-center justify-between text-[0.6rem] font-mono text-ink/30 mb-2">
        <span>{thinking.length}/1000</span>
      </div>
      <div className="flex items-center gap-4 mb-2">
        <TagInput tags={tags} setTags={setTags} />
        <VisibilitySelect value={visibility} onChange={setVisibility} />
      </div>
      <ActionButtons saving={saving} onPublish={() => submit("published")} onDraft={() => submit("draft")} />
    </>
  );
}
