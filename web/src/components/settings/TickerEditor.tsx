"use client";

/**
 * Editor for the profile page ticker/carousel strip.
 * Supports manual editing, pinning items, and AI-assisted reroll.
 * [SQ.S-W-2603-0043] [SQ.S-W-2603-0044]
 */

import { useState } from "react";

const MAX_ITEMS = 10;

interface TickerItem {
  text: string;
  pinned: boolean;
}

interface TickerEditorProps {
  /** Current saved items (plain strings from DB) */
  items: string[];
  onChange: (items: string[]) => void;
}

export default function TickerEditor({ items, onChange }: TickerEditorProps) {
  const [rows, setRows] = useState<TickerItem[]>(
    items.length > 0
      ? items.map((t) => ({ text: t, pinned: false }))
      : [{ text: "", pinned: false }]
  );
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  /** Push current rows back up to the parent (plain strings, trim & filter blanks) */
  const emit = (next: TickerItem[]) => {
    onChange(next.map((r) => r.text.trim()).filter(Boolean));
  };

  const handleTextChange = (idx: number, val: string) => {
    const next = rows.map((r, i) => (i === idx ? { ...r, text: val } : r));
    setRows(next);
    emit(next);
  };

  const handlePin = (idx: number) => {
    const next = rows.map((r, i) =>
      i === idx ? { ...r, pinned: !r.pinned } : r
    );
    setRows(next);
    // pinned state is UI-only — no need to propagate to parent
  };

  const handleAdd = () => {
    if (rows.length >= MAX_ITEMS) return;
    const next = [...rows, { text: "", pinned: false }];
    setRows(next);
    emit(next);
  };

  const handleRemove = (idx: number) => {
    const next = rows.filter((_, i) => i !== idx);
    setRows(next.length > 0 ? next : [{ text: "", pinned: false }]);
    emit(next);
  };

  /** AI reroll — replaces only unpinned items */
  const handleReroll = async () => {
    setGenerating(true);
    setGenError(null);

    const pinned = rows.filter((r) => r.pinned).map((r) => r.text.trim()).filter(Boolean);
    const unpinnedCount = Math.max(
      1,
      rows.filter((r) => !r.pinned && r.text.trim()).length ||
        MAX_ITEMS - pinned.length
    );

    try {
      const res = await fetch("/api/ticker-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned, count: unpinnedCount }),
      });

      const data = await res.json();

      if (!res.ok) {
        setGenError(data.error ?? "Generation failed");
        return;
      }

      const generated: string[] = data.items ?? [];

      // Rebuild rows: keep pinned in their slots, fill remaining with generated
      const pinnedRows = rows.filter((r) => r.pinned);
      const newUnpinned = generated.map((t) => ({ text: t, pinned: false }));
      const next = [...pinnedRows, ...newUnpinned].slice(0, MAX_ITEMS);

      setRows(next);
      emit(next);
    } catch {
      setGenError("Generation failed — please try again");
    } finally {
      setGenerating(false);
    }
  };

  const inputClass =
    "flex-1 px-3 py-2 border-3 border-ink bg-bg-card font-mono text-[0.82rem] focus:outline-none focus:shadow-[3px_3px_0_var(--ink)] transition-shadow";

  return (
    <div>
      <div className="space-y-2 mb-4">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {/* Pin toggle */}
            <button
              type="button"
              title={row.pinned ? "Unpin (won't be replaced on reroll)" : "Pin (keep on reroll)"}
              onClick={() => handlePin(idx)}
              className={`w-8 h-8 flex items-center justify-center border-3 border-ink text-[0.9rem] transition-colors cursor-pointer flex-shrink-0 ${
                row.pinned
                  ? "bg-ink text-bg"
                  : "bg-bg-card text-ink hover:bg-ink/5"
              }`}
            >
              📌
            </button>

            {/* Text input */}
            <input
              type="text"
              value={row.text}
              onChange={(e) => handleTextChange(idx, e.target.value)}
              placeholder={`Ticker item ${idx + 1}`}
              maxLength={80}
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

      {/* Add + Reroll buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        {rows.length < MAX_ITEMS && (
          <button
            type="button"
            onClick={handleAdd}
            className="px-4 py-2 border-3 border-ink bg-bg-card font-head font-bold text-[0.72rem] uppercase hover:bg-ink/5 transition-colors cursor-pointer"
          >
            + Add item
          </button>
        )}

        <button
          type="button"
          onClick={handleReroll}
          disabled={generating}
          title="Auto-generate ticker items from your profile. Pinned items are kept."
          className="flex items-center gap-2 px-4 py-2 border-3 border-ink bg-bg-card font-head font-bold text-[0.72rem] uppercase hover:bg-ink/5 transition-colors disabled:opacity-40 cursor-pointer"
        >
          <span className={generating ? "animate-spin inline-block" : ""}>
            🎲
          </span>
          {generating ? "Generating…" : "AI reroll"}
        </button>

        <span className="font-mono text-[0.68rem] opacity-40">
          {rows.length}/{MAX_ITEMS} items — pinned items are kept on reroll
        </span>
      </div>

      {genError && (
        <div className="mt-3 border-3 border-red-500 bg-red-50 p-3 font-mono text-[0.75rem] text-red-600">
          {genError}
        </div>
      )}
    </div>
  );
}
