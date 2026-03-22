/* ── EditModal — centered modal for editing lightweight content ── */
"use client";

import { useCallback, useEffect, useState } from "react";
import type { ContentType } from "./ThreeDotMenu";

interface Props {
  open: boolean;
  onClose: () => void;
  contentType: ContentType;
  contentId: string;
  /** Initial field values */
  initialData: Record<string, unknown>;
  /** Called after a successful save with the updated data */
  onSaved?: (data: Record<string, unknown>) => void;
}

const API_PREFIX: Record<ContentType, string> = {
  microblog: "/api/microblogs",
  quote: "/api/quotes",
  bookmark: "/api/bookmarks",
  question: "/api/questions",
  crowdfunding_project: "/api/crowdfunding-projects",
};

const LABELS: Record<ContentType, string> = {
  microblog: "Microblog",
  quote: "Quote",
  bookmark: "Bookmark",
  question: "Question",
  crowdfunding_project: "Backed Project",
};

export function EditModal({ open, onClose, contentType, contentId, initialData, onSaved }: Props) {
  const [fields, setFields] = useState<Record<string, unknown>>(initialData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset fields when modal opens with new data
  useEffect(() => {
    if (open) {
      setFields(initialData);
      setError(null);
    }
  }, [open, initialData]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const setField = (key: string, value: unknown) => {
    setFields((f) => ({ ...f, [key]: value }));
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_PREFIX[contentType]}/${contentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Save failed (${res.status})`);
      }
      const data = await res.json();
      onSaved?.(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [contentType, contentId, fields, onSaved, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.4)",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 520,
          maxWidth: "100%",
          maxHeight: "85vh",
          background: "var(--bg-card)",
          border: "3px solid var(--ink)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "2px solid var(--ink)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontWeight: 900,
              fontSize: "0.8rem",
              textTransform: "uppercase",
              fontFamily: "var(--font-head)",
              letterSpacing: "0.03em",
            }}
          >
            Edit {LABELS[contentType]}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.2rem",
              cursor: "pointer",
              color: "var(--ink)",
              padding: "0 4px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Body — scrollable */}
        <div style={{ overflowY: "auto", flex: 1, padding: 20 }}>
          <FieldsForType contentType={contentType} fields={fields} setField={setField} />
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "2px solid var(--ink)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "8px 20px",
              border: "2px solid var(--ink)",
              background: "var(--orange)",
              color: "#fff",
              fontWeight: 800,
              fontSize: "0.75rem",
              fontFamily: "var(--font-head)",
              cursor: saving ? "wait" : "pointer",
              textTransform: "uppercase",
            }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              border: "2px solid var(--ink)",
              background: "var(--bg-card)",
              fontWeight: 700,
              fontSize: "0.75rem",
              fontFamily: "var(--font-head)",
              cursor: "pointer",
              textTransform: "uppercase",
              color: "var(--ink)",
            }}
          >
            Cancel
          </button>
          {error && (
            <span style={{ fontSize: "0.72rem", color: "#c0392b", marginLeft: "auto" }}>
              {error}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Field sets per content type ────────────────────────────────────────────

function FieldsForType({
  contentType,
  fields,
  setField,
}: {
  contentType: ContentType;
  fields: Record<string, unknown>;
  setField: (key: string, value: unknown) => void;
}) {
  switch (contentType) {
    case "microblog":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FieldLabel label="Body" />
          <textarea
            value={(fields.body as string) ?? ""}
            onChange={(e) => setField("body", e.target.value)}
            style={{ ...inputBase, minHeight: 100, resize: "vertical" }}
          />
          <FieldLabel label="Link URL" />
          <input
            value={(fields.link_url as string) ?? ""}
            onChange={(e) => setField("link_url", e.target.value)}
            placeholder="https://..."
            style={inputBase}
          />
          <FieldLabel label="Location" />
          <input
            value={(fields.location_name as string) ?? ""}
            onChange={(e) => setField("location_name", e.target.value)}
            placeholder="e.g. Brighton, UK"
            style={inputBase}
          />
          <TagEditor tags={(fields.tags as string[]) ?? []} onChange={(t) => setField("tags", t)} />
          <VisibilityPicker
            value={(fields.visibility as string) ?? "public"}
            onChange={(v) => setField("visibility", v)}
          />
        </div>
      );

    case "quote":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FieldLabel label="Quote text" />
          <textarea
            value={(fields.quote_text as string) ?? ""}
            onChange={(e) => setField("quote_text", e.target.value)}
            style={{ ...inputBase, minHeight: 80, resize: "vertical" }}
          />
          <FieldLabel label="Source name" />
          <input
            value={(fields.source_name as string) ?? ""}
            onChange={(e) => setField("source_name", e.target.value)}
            style={inputBase}
          />
          <FieldLabel label="Source work" />
          <input
            value={(fields.source_work as string) ?? ""}
            onChange={(e) => setField("source_work", e.target.value)}
            style={inputBase}
          />
          <FieldLabel label="Commentary" />
          <textarea
            value={(fields.commentary as string) ?? ""}
            onChange={(e) => setField("commentary", e.target.value)}
            style={{ ...inputBase, minHeight: 60, resize: "vertical" }}
          />
          <TagEditor tags={(fields.tags as string[]) ?? []} onChange={(t) => setField("tags", t)} />
          <VisibilityPicker
            value={(fields.visibility as string) ?? "public"}
            onChange={(v) => setField("visibility", v)}
          />
        </div>
      );

    case "bookmark":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FieldLabel label="Commentary" />
          <textarea
            value={(fields.commentary as string) ?? ""}
            onChange={(e) => setField("commentary", e.target.value)}
            style={{ ...inputBase, minHeight: 60, resize: "vertical" }}
          />
          <FieldLabel label="Title" />
          <input
            value={(fields.og_title as string) ?? ""}
            onChange={(e) => setField("og_title", e.target.value)}
            style={inputBase}
          />
          <FieldLabel label="Description" />
          <input
            value={(fields.og_description as string) ?? ""}
            onChange={(e) => setField("og_description", e.target.value)}
            style={inputBase}
          />
          <TagEditor tags={(fields.tags as string[]) ?? []} onChange={(t) => setField("tags", t)} />
          <VisibilityPicker
            value={(fields.visibility as string) ?? "public"}
            onChange={(v) => setField("visibility", v)}
          />
        </div>
      );

    case "question":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FieldLabel label="Question" />
          <textarea
            value={(fields.question_text as string) ?? ""}
            onChange={(e) => setField("question_text", e.target.value)}
            style={{ ...inputBase, minHeight: 60, resize: "vertical" }}
            maxLength={280}
          />
          <FieldLabel label="Thinking / notes" />
          <textarea
            value={(fields.thinking as string) ?? ""}
            onChange={(e) => setField("thinking", e.target.value)}
            style={{ ...inputBase, minHeight: 50, resize: "vertical" }}
            maxLength={1000}
          />
          {(fields.resolved as boolean) && (
            <>
              <FieldLabel label="Resolution summary" />
              <textarea
                value={(fields.resolved_summary as string) ?? ""}
                onChange={(e) => setField("resolved_summary", e.target.value)}
                style={{ ...inputBase, minHeight: 50, resize: "vertical" }}
              />
            </>
          )}
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.78rem" }}>
            <input
              type="checkbox"
              checked={(fields.resolved as boolean) ?? false}
              onChange={(e) => setField("resolved", e.target.checked)}
            />
            Resolved
          </label>
          <TagEditor tags={(fields.tags as string[]) ?? []} onChange={(t) => setField("tags", t)} />
          <VisibilityPicker
            value={(fields.visibility as string) ?? "public"}
            onChange={(v) => setField("visibility", v)}
          />
        </div>
      );

    default:
      return <p style={{ fontSize: "0.82rem", opacity: 0.6 }}>Editing not yet supported for this type.</p>;
  }
}

// ─── Shared field widgets ────────────────────────────────────────────────────

function FieldLabel({ label }: { label: string }) {
  return (
    <span
      style={{
        fontSize: "0.65rem",
        fontWeight: 700,
        textTransform: "uppercase",
        fontFamily: "var(--font-mono)",
        opacity: 0.55,
        marginBottom: -6,
      }}
    >
      {label}
    </span>
  );
}

function TagEditor({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const tag = input.trim().replace(/^#/, "").toLowerCase();
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
    }
    setInput("");
  };

  return (
    <div>
      <FieldLabel label="Tags" />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
        {tags.map((t) => (
          <span
            key={t}
            style={{
              fontSize: "0.7rem",
              fontFamily: "var(--font-mono)",
              border: "1.5px solid var(--ink)",
              padding: "2px 8px",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            #{t}
            <button
              onClick={() => onChange(tags.filter((x) => x !== t))}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "0.7rem",
                opacity: 0.5,
                padding: 0,
                color: "var(--ink)",
              }}
            >
              ✕
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag();
            }
          }}
          onBlur={addTag}
          placeholder="+ add"
          style={{
            ...inputBase,
            width: 80,
            fontSize: "0.7rem",
            padding: "2px 8px",
          }}
        />
      </div>
    </div>
  );
}

function VisibilityPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <FieldLabel label="Visibility" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputBase, width: 140, marginTop: 8 }}
      >
        <option value="public">Public</option>
        <option value="unlisted">Unlisted</option>
        <option value="private">Private</option>
      </select>
    </div>
  );
}

const inputBase: React.CSSProperties = {
  padding: "8px 12px",
  border: "1.5px solid rgba(26,26,26,0.3)",
  background: "#fff",
  fontSize: "0.82rem",
  fontFamily: "var(--font-body)",
  color: "var(--ink)",
};
