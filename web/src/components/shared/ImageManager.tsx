/* ── ImageManager — shared image add/remove/star widget ── */
"use client";

import { useState } from "react";
import type { MicroblogImage } from "@/lib/microblogs";

interface Props {
  images: MicroblogImage[];
  onChange: (imgs: MicroblogImage[]) => void;
  /** Entity ID passed to upload API (use "new" for creation forms) */
  entityId: string;
}

export function ImageManager({ images, onChange, entityId }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleStar = (idx: number) => {
    const alreadyStarred = images[idx]?.starred;
    onChange(images.map((img, i) => ({ ...img, starred: alreadyStarred ? false : i === idx })));
  };

  const handleRemove = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  const handleAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("context", "general");
      fd.append("entityId", entityId);

      const res = await fetch("/api/upload-image", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || `Upload failed (${res.status})`);
      }
      const { url } = await res.json() as { url: string };
      onChange([...images, { url, width: 0, height: 0 }]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-start" }}>
        {images.map((img, i) => (
          <div
            key={img.url}
            style={{
              position: "relative",
              width: 72,
              height: 72,
              border: img.starred ? "2.5px solid var(--orange)" : "1.5px solid rgba(26,26,26,0.2)",
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.alt_text ?? `Image ${i + 1}`}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <button
              type="button"
              onClick={() => handleStar(i)}
              title={img.starred ? "Unstar" : "Set as featured"}
              style={{
                position: "absolute",
                bottom: 2,
                left: 3,
                background: "rgba(0,0,0,0.55)",
                border: "none",
                color: img.starred ? "var(--orange)" : "#fff",
                fontSize: "0.72rem",
                lineHeight: 1,
                cursor: "pointer",
                padding: "2px 3px",
              }}
            >
              ★
            </button>
            <button
              type="button"
              onClick={() => handleRemove(i)}
              title="Remove image"
              style={{
                position: "absolute",
                top: 2,
                right: 2,
                background: "rgba(0,0,0,0.55)",
                border: "none",
                color: "#fff",
                fontSize: "0.65rem",
                lineHeight: 1,
                cursor: "pointer",
                padding: "2px 4px",
              }}
            >
              ✕
            </button>
          </div>
        ))}

        {/* Add button */}
        <label
          style={{
            width: 72,
            height: 72,
            border: "1.5px dashed rgba(26,26,26,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: uploading ? "wait" : "pointer",
            flexShrink: 0,
            flexDirection: "column",
            gap: 4,
            opacity: uploading ? 0.5 : 1,
          }}
        >
          <span style={{ fontSize: "1.2rem", lineHeight: 1, opacity: 0.5 }}>+</span>
          <span style={{ fontSize: "0.55rem", fontFamily: "var(--font-mono)", opacity: 0.45, textAlign: "center", lineHeight: 1.2 }}>
            {uploading ? "…" : "Add"}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading}
            onChange={handleAdd}
            style={{ display: "none" }}
          />
        </label>
      </div>
      {uploadError && (
        <span style={{ fontSize: "0.7rem", color: "#c0392b", display: "block", marginTop: 4 }}>
          {uploadError}
        </span>
      )}
    </div>
  );
}
