"use client";

/**
 * Editor for site-wide filter tags shown on the profile home page.
 * Each tag has a label and a sticker colour.
 * [SQ.S-W-2603-0055]
 */

import { useState } from "react";
import {
  type SiteTag,
  type StickerColor,
  STICKER_COLORS,
  STICKER_COLOR_LABELS,
} from "@/lib/tags";

const MAX_TAGS = 20;

interface SiteTagsEditorProps {
  tags: SiteTag[];
  onChange: (tags: SiteTag[]) => void;
}

export default function SiteTagsEditor({ tags, onChange }: SiteTagsEditorProps) {
  const [rows, setRows] = useState<SiteTag[]>(
    tags.length > 0 ? tags : [{ label: "", color: "sticker-orange" }]
  );

  const emit = (next: SiteTag[]) => {
    onChange(next.filter((t) => t.label.trim() !== ""));
  };

  const handleLabelChange = (idx: number, val: string) => {
    const next = rows.map((r, i) => (i === idx ? { ...r, label: val } : r));
    setRows(next);
    emit(next);
  };

  const handleColorChange = (idx: number, color: StickerColor) => {
    const next = rows.map((r, i) => (i === idx ? { ...r, color } : r));
    setRows(next);
    emit(next);
  };

  const handleAdd = () => {
    if (rows.length >= MAX_TAGS) return;
    const usedColors = rows.map((r) => r.color);
    const nextColor =
      STICKER_COLORS.find((c) => !usedColors.includes(c)) ?? "sticker-orange";
    const next = [...rows, { label: "", color: nextColor }];
    setRows(next);
    emit(next);
  };

  const handleRemove = (idx: number) => {
    const next = rows.filter((_, i) => i !== idx);
    setRows(next.length > 0 ? next : [{ label: "", color: "sticker-orange" }]);
    emit(next);
  };

  const inputClass =
    "flex-1 px-3 py-2 border-3 border-ink bg-white font-mono text-[0.82rem] focus:outline-none focus:shadow-[3px_3px_0_var(--ink)] transition-shadow";

  return (
    <div>
      <div className="space-y-2 mb-4">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {/* Colour picker */}
            <select
              value={row.color}
              onChange={(e) => handleColorChange(idx, e.target.value as StickerColor)}
              title="Tag colour"
              className="px-2 py-2 border-3 border-ink bg-white font-mono text-[0.75rem] focus:outline-none cursor-pointer flex-shrink-0"
              style={{ minWidth: 90 }}
            >
              {STICKER_COLORS.map((c) => (
                <option key={c} value={c}>
                  {STICKER_COLOR_LABELS[c]}
                </option>
              ))}
            </select>

            {/* Preview swatch */}
            <span
              className={`sticker ${row.color} flex-shrink-0`}
              style={{ minWidth: 0, maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.7rem", padding: "4px 10px" }}
            >
              {row.label || "Preview"}
            </span>

            {/* Label input */}
            <input
              type="text"
              value={row.label}
              onChange={(e) => handleLabelChange(idx, e.target.value)}
              placeholder={`Tag ${idx + 1} label`}
              maxLength={40}
              className={inputClass}
            />

            {/* Remove */}
            <button
              type="button"
              title="Remove"
              onClick={() => handleRemove(idx)}
              className="w-8 h-8 flex items-center justify-center border-3 border-ink bg-white font-mono text-[0.7rem] hover:bg-red-50 transition-colors cursor-pointer flex-shrink-0"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {rows.length < MAX_TAGS && (
          <button
            type="button"
            onClick={handleAdd}
            className="px-4 py-2 border-3 border-ink bg-white font-head font-bold text-[0.72rem] uppercase hover:bg-ink/5 transition-colors cursor-pointer"
          >
            + Add tag
          </button>
        )}
        <span className="font-mono text-[0.68rem] opacity-40">
          {rows.filter((r) => r.label.trim()).length}/{MAX_TAGS} tags
        </span>
      </div>

      <p className="font-mono text-[0.68rem] opacity-50 mt-3 leading-relaxed">
        Tags appear as sticker buttons on your profile. Clicking a tag filters
        all content with that tag. Tag labels are case-sensitive when matching
        content.
      </p>
    </div>
  );
}
