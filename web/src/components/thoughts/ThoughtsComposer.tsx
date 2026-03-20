"use client";

import { useState, useCallback } from "react";
import type { ThoughtType } from "@/lib/thoughts-types";

interface Props {
  username: string;
}

const TYPES: { key: ThoughtType; label: string; icon: string; color: string }[] = [
  { key: "microblog", label: "Microblog", icon: "✏️", color: "sticker-orange" },
  { key: "writing", label: "Writing", icon: "📝", color: "sticker-blue" },
  { key: "bookmark", label: "Bookmark", icon: "🔖", color: "sticker-green" },
  { key: "quote", label: "Quote", icon: "💬", color: "sticker-lilac" },
  { key: "question", label: "Question", icon: "❓", color: "sticker-yellow" },
];

export default function ThoughtsComposer({ username }: Props) {
  const [activeType, setActiveType] = useState<ThoughtType | null>(null);
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
        <MicroblogForm saving={saving} setSaving={setSaving} setError={setError} onSuccess={handleSuccess} />
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

/* ── Microblog composer ──────────────────────────────────────────────────── */

function MicroblogForm({ saving, setSaving, setError, onSuccess }: FormChildProps) {
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState("public");

  const submit = useCallback(async (status: "published" | "draft") => {
    if (!body.trim()) { setError("Post body is required"); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/microblogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim(), tags, visibility, status }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      onSuccess("Microblog posted!");
    } catch (e: any) { setError(e.message); setSaving(false); }
  }, [body, tags, visibility, setSaving, setError, onSuccess]);

  return (
    <>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What's on your mind?"
        rows={4}
        className="w-full border-2 border-ink/20 px-3 py-2.5 text-[0.88rem] font-mono outline-none bg-transparent focus:border-[var(--orange)] transition-colors placeholder:text-ink/20 resize-y mb-3"
      />
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
