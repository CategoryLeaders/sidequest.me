"use client";

/**
 * Editor for site-wide filter tags shown on the profile home page.
 * Each tag has a label and a sticker colour.
 * Includes display-mode settings: preference order (drag), volume, or random,
 * plus a limit for how many tags to show on the home page.
 * [SQ.S-W-2603-0055]
 */

import { useState, useRef } from "react";
import {
  type SiteTag,
  type StickerColor,
  type SiteTagsDisplay,
  type SiteTagsDisplayMode,
  STICKER_COLORS,
  STICKER_COLOR_LABELS,
  DEFAULT_SITE_TAGS_DISPLAY,
  MAX_SITE_TAGS,
} from "@/lib/tags";

interface SiteTagsEditorProps {
  tags: SiteTag[];
  display: SiteTagsDisplay;
  onChange: (tags: SiteTag[]) => void;
  onDisplayChange: (display: SiteTagsDisplay) => void;
  /** All distinct tags used across the user's writings — for "promote to site tag" suggestions */
  writingTags?: string[];
}

export default function SiteTagsEditor({
  tags,
  display,
  onChange,
  onDisplayChange,
  writingTags = [],
}: SiteTagsEditorProps) {
  const [rows, setRows] = useState<SiteTag[]>(
    tags.length > 0 ? tags : [{ label: "", color: "sticker-orange" }]
  );

  // Drag-to-reorder state (preference mode only)
  const dragIdx = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const emitTags = (next: SiteTag[]) => {
    onChange(next.filter((t) => t.label.trim() !== ""));
  };

  // ── Tag list handlers ──────────────────────────────────────────────────────

  const handleLabelChange = (idx: number, val: string) => {
    const next = rows.map((r, i) => (i === idx ? { ...r, label: val } : r));
    setRows(next);
    emitTags(next);
  };

  const handleColorChange = (idx: number, color: StickerColor) => {
    const next = rows.map((r, i) => (i === idx ? { ...r, color } : r));
    setRows(next);
    emitTags(next);
  };

  const handleAdd = () => {
    if (rows.length >= MAX_SITE_TAGS) return;
    const usedColors = rows.map((r) => r.color);
    const nextColor =
      STICKER_COLORS.find((c) => !usedColors.includes(c)) ?? "sticker-orange";
    const next = [...rows, { label: "", color: nextColor }];
    setRows(next);
    emitTags(next);
  };

  const handleRemove = (idx: number) => {
    const next = rows.filter((_, i) => i !== idx);
    setRows(next.length > 0 ? next : [{ label: "", color: "sticker-orange" }]);
    emitTags(next);
  };

  // ── Drag-to-reorder (HTML5 DnD) ───────────────────────────────────────────

  const handleDragStart = (idx: number) => {
    dragIdx.current = idx;
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOver(idx);
    if (dragIdx.current === null || dragIdx.current === idx) return;
    const next = [...rows];
    const [item] = next.splice(dragIdx.current, 1);
    next.splice(idx, 0, item);
    dragIdx.current = idx;
    setRows(next);
    emitTags(next);
  };

  const handleDragEnd = () => {
    dragIdx.current = null;
    setDragOver(null);
  };

  // ── Display settings handlers ──────────────────────────────────────────────

  const handleModeChange = (mode: SiteTagsDisplayMode) => {
    onDisplayChange({ ...display, mode });
  };

  const handleLimitChange = (raw: string) => {
    const n = parseInt(raw, 10);
    const limit = isNaN(n) || n < 0 ? 0 : Math.min(n, MAX_SITE_TAGS);
    onDisplayChange({ ...display, limit });
  };

  // ── Promote writing tag to site tag ────────────────────────────────────────

  const handlePromote = (label: string) => {
    if (rows.length >= MAX_SITE_TAGS) return;
    const usedColors = rows.map((r) => r.color);
    const nextColor =
      STICKER_COLORS.find((c) => !usedColors.includes(c)) ?? "sticker-orange";
    const next = [...rows, { label, color: nextColor }];
    setRows(next);
    emitTags(next);
  };

  // Suggested tags = writing tags not already in site tags (case-insensitive)
  const siteTagLabelsLower = rows
    .map((r) => r.label.trim().toLowerCase())
    .filter(Boolean);
  const suggestedTags = writingTags.filter(
    (wt) => !siteTagLabelsLower.includes(wt.toLowerCase())
  );

  const isPref = display.mode === "preference";
  const validTagCount = rows.filter((r) => r.label.trim()).length;

  const inputClass =
    "flex-1 px-3 py-2 border-3 border-ink bg-bg-card font-mono text-[0.82rem] focus:outline-none focus:shadow-[3px_3px_0_var(--ink)] transition-shadow";

  const radioClass = (active: boolean) =>
    `flex items-center gap-2 px-3 py-2 border-3 cursor-pointer transition-colors font-mono text-[0.72rem] select-none ${
      active
        ? "border-ink bg-ink text-bg"
        : "border-ink/30 bg-bg-card hover:border-ink/60"
    }`;

  return (
    <div className="space-y-8">

      {/* ── Display settings ─────────────────────────────────── */}
      <div>
        <div className="font-mono text-[0.65rem] uppercase tracking-wider opacity-50 mb-3">
          Display order
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {(
            [
              { id: "preference", label: "My order", desc: "Use the order below" },
              { id: "volume",     label: "By volume", desc: "Most-tagged content first" },
              { id: "random",     label: "Random",    desc: "Shuffled on each load" },
            ] as { id: SiteTagsDisplayMode; label: string; desc: string }[]
          ).map(({ id, label, desc }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={display.mode === id}
              onClick={() => handleModeChange(id)}
              className={radioClass(display.mode === id)}
              title={desc}
            >
              {display.mode === id && (
                <span className="text-[0.65rem]">✓</span>
              )}
              {label}
            </button>
          ))}
        </div>

        {isPref && (
          <p className="font-mono text-[0.62rem] opacity-40 mb-4">
            Drag rows to set the order tags appear on your profile.
          </p>
        )}

        {/* Show limit */}
        <div className="flex items-center gap-3">
          <label className="font-mono text-[0.65rem] uppercase tracking-wider opacity-50 whitespace-nowrap">
            Show up to
          </label>
          <input
            type="number"
            min={0}
            max={MAX_SITE_TAGS}
            value={display.limit === 0 ? "" : display.limit}
            onChange={(e) => handleLimitChange(e.target.value)}
            placeholder="All"
            className="w-20 px-3 py-1.5 border-3 border-ink bg-bg-card font-mono text-[0.78rem] focus:outline-none focus:shadow-[3px_3px_0_var(--ink)] transition-shadow"
          />
          <span className="font-mono text-[0.65rem] opacity-40">
            tags &nbsp;(blank = show all)
          </span>
        </div>
      </div>

      {/* ── Tag list ─────────────────────────────────────────── */}
      <div>
        <div className="font-mono text-[0.65rem] uppercase tracking-wider opacity-50 mb-3">
          Tags &nbsp;
          <span className="normal-case opacity-70">
            ({validTagCount}/{MAX_SITE_TAGS})
          </span>
        </div>

        <div className="space-y-2 mb-4">
          {rows.map((row, idx) => (
            <div
              key={idx}
              draggable={isPref}
              onDragStart={isPref ? () => handleDragStart(idx) : undefined}
              onDragOver={isPref ? (e) => handleDragOver(e, idx) : undefined}
              onDragEnd={isPref ? handleDragEnd : undefined}
              className={`flex items-center gap-2 transition-opacity ${
                dragOver === idx && dragIdx.current !== idx ? "opacity-40" : ""
              }`}
            >
              {/* Drag handle — visible + active only in preference mode */}
              <span
                className={`flex-shrink-0 font-mono text-[0.75rem] select-none w-5 text-center transition-opacity ${
                  isPref ? "opacity-40 cursor-grab active:cursor-grabbing" : "opacity-10 cursor-default"
                }`}
                title={isPref ? "Drag to reorder" : undefined}
              >
                ⠿
              </span>

              {/* Colour picker */}
              <select
                value={row.color}
                onChange={(e) => handleColorChange(idx, e.target.value as StickerColor)}
                title="Tag colour"
                className="px-2 py-2 border-3 border-ink bg-bg-card font-mono text-[0.75rem] focus:outline-none cursor-pointer flex-shrink-0"
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
                style={{
                  minWidth: 0,
                  maxWidth: 90,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: "0.7rem",
                  padding: "4px 10px",
                }}
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
                className="w-8 h-8 flex items-center justify-center border-3 border-ink bg-bg-card font-mono text-[0.7rem] hover:bg-red-50 transition-colors cursor-pointer flex-shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {rows.length < MAX_SITE_TAGS && (
          <button
            type="button"
            onClick={handleAdd}
            className="px-4 py-2 border-3 border-ink bg-bg-card font-head font-bold text-[0.72rem] uppercase hover:bg-ink/5 transition-colors cursor-pointer"
          >
            + Add tag
          </button>
        )}
      </div>

      {/* ── Suggested from writings ────────────────────────────── */}
      {suggestedTags.length > 0 && rows.length < MAX_SITE_TAGS && (
        <div>
          <div className="font-mono text-[0.65rem] uppercase tracking-wider opacity-50 mb-3">
            Suggested from your writings
          </div>
          <p className="font-mono text-[0.62rem] opacity-40 mb-3">
            Tags used on your writings that aren&apos;t site tags yet. Promote them to make them filterable on your profile.
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedTags.map((wt) => (
              <button
                key={wt}
                type="button"
                onClick={() => handlePromote(wt)}
                className="group flex items-center gap-1.5 px-3 py-1.5 border-2 border-dashed border-ink/30 bg-bg-card font-mono text-[0.7rem] text-ink/60 hover:border-ink hover:text-ink hover:bg-ink/5 transition-all cursor-pointer"
                title={`Promote "${wt}" to site tag`}
              >
                <span className="text-[0.6rem] opacity-40 group-hover:opacity-100 transition-opacity">+</span>
                {wt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
