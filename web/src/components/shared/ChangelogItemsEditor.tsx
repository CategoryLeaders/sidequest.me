"use client";

import { useRef, useState } from "react";
import type { ChangelogItem } from "@/lib/microblogs";

interface ChangelogItemState {
  id: string;
  text: string;
  image: { url: string; storage_path?: string } | null;
  uploading: boolean;
}

interface Props {
  items: ChangelogItem[];
  onChange: (items: ChangelogItem[]) => void;
}

function toState(items: ChangelogItem[]): ChangelogItemState[] {
  const result = items.map((item) => ({
    id: crypto.randomUUID(),
    text: item.text,
    image: item.image ?? null,
    uploading: false,
  }));
  if (result.length === 0) {
    result.push({ id: crypto.randomUUID(), text: "", image: null, uploading: false });
  }
  return result;
}

function toItems(localItems: ChangelogItemState[]): ChangelogItem[] {
  return localItems.map((i) => ({
    text: i.text,
    ...(i.image ? { image: i.image } : {}),
  }));
}

export function ChangelogItemsEditor({ items, onChange }: Props) {
  const [localItems, setLocalItems] = useState<ChangelogItemState[]>(() =>
    toState(items)
  );
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const mutate = (next: ChangelogItemState[]) => {
    setLocalItems(next);
    onChange(toItems(next));
  };

  const update = (id: string, patch: Partial<ChangelogItemState>) =>
    mutate(localItems.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const addItem = () =>
    mutate([
      ...localItems,
      { id: crypto.randomUUID(), text: "", image: null, uploading: false },
    ]);

  const removeItem = (id: string) =>
    mutate(localItems.filter((i) => i.id !== id));

  const handleUpload = async (id: string, file: File) => {
    if (!file.type.startsWith("image/")) return;
    update(id, { uploading: true });
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("context", "microblogs");
      const res = await fetch("/api/upload-image", { method: "POST", body: form });
      if (res.ok) {
        const { url, storage_path } = (await res.json()) as {
          url: string;
          storage_path?: string;
        };
        update(id, { image: { url, storage_path }, uploading: false });
      } else {
        update(id, { uploading: false });
      }
    } catch {
      update(id, { uploading: false });
    }
  };

  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
      {localItems.map((item, idx) => (
        <div
          key={item.id}
          style={{
            border: "2px solid rgba(26,26,26,0.1)",
            padding: 12,
            background: "rgba(26,26,26,0.02)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.65rem",
                opacity: 0.3,
                marginTop: 10,
                flexShrink: 0,
              }}
            >
              •
            </span>
            <textarea
              value={item.text}
              onChange={(e) => update(item.id, { text: e.target.value })}
              placeholder={`Change ${idx + 1}…`}
              rows={2}
              style={{
                flex: 1,
                border: "1.5px solid rgba(26,26,26,0.2)",
                padding: "6px 10px",
                fontSize: "0.82rem",
                fontFamily: "var(--font-body)",
                outline: "none",
                resize: "vertical",
                background: "#fff",
                color: "var(--ink)",
              }}
            />
            {localItems.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  opacity: 0.3,
                  fontSize: "0.7rem",
                  color: "var(--ink)",
                  marginTop: 8,
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Per-item image */}
          <div style={{ marginLeft: 20 }}>
            {item.image ? (
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image.url}
                  alt=""
                  style={{
                    maxHeight: 160,
                    maxWidth: "100%",
                    objectFit: "contain",
                    border: "2px solid rgba(26,26,26,0.15)",
                    display: "block",
                  }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => fileRefs.current[item.id]?.click()}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.6rem",
                      border: "1px solid rgba(26,26,26,0.2)",
                      padding: "2px 8px",
                      background: "none",
                      cursor: "pointer",
                      color: "var(--ink)",
                      opacity: 0.5,
                    }}
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => update(item.id, { image: null })}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.6rem",
                      border: "1px solid rgba(200,50,50,0.3)",
                      padding: "2px 8px",
                      background: "none",
                      cursor: "pointer",
                      color: "#c0392b",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : item.uploading ? (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.65rem",
                  opacity: 0.4,
                }}
              >
                Uploading…
              </span>
            ) : (
              <button
                type="button"
                onClick={() => fileRefs.current[item.id]?.click()}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6rem",
                  border: "1px dashed rgba(26,26,26,0.25)",
                  padding: "4px 12px",
                  background: "none",
                  cursor: "pointer",
                  color: "var(--ink)",
                  opacity: 0.5,
                }}
              >
                + Add image
              </button>
            )}
            <input
              ref={(el) => {
                fileRefs.current[item.id] = el;
              }}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(item.id, f);
                e.target.value = "";
              }}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.65rem",
          border: "1px dashed rgba(26,26,26,0.2)",
          padding: 6,
          background: "none",
          cursor: "pointer",
          color: "var(--ink)",
          opacity: 0.5,
          width: "100%",
        }}
      >
        + Add change
      </button>
    </div>
  );
}
