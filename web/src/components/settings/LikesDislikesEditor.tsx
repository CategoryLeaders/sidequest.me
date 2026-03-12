"use client";

/**
 * CRUD editor for likes or dislikes — emoji + text, add/edit/delete/reorder.
 * [SQ.S-W-2603-0041]
 */

import { useState } from "react";
import type { LikeDislike } from "@/types/profile-extras";

interface LikesDislikesEditorProps {
  items: LikeDislike[];
  onChange: (updated: LikeDislike[]) => void;
}

export default function LikesDislikesEditor({
  items,
  onChange,
}: LikesDislikesEditorProps) {
  const [addEmoji, setAddEmoji] = useState("");
  const [addText, setAddText] = useState("");

  const handleAdd = () => {
    if (!addText.trim()) return;
    onChange([...items, { emoji: addEmoji || "•", text: addText.trim() }]);
    setAddEmoji("");
    setAddText("");
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleTextChange = (index: number, newText: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], text: newText };
    onChange(updated);
  };

  const handleEmojiChange = (index: number, newEmoji: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], emoji: newEmoji };
    onChange(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...items];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onChange(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const updated = [...items];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onChange(updated);
  };

  const inputClass =
    "px-3 py-2 border-3 border-ink bg-white font-mono text-[0.82rem] focus:outline-none focus:shadow-[2px_2px_0_var(--ink)] transition-shadow";

  return (
    <div className="space-y-3">
      {/* Existing items */}
      {items.map((item, i) => (
        <div
          key={`${item.text}-${i}`}
          className="flex items-center gap-2 border-3 border-ink p-3 bg-white"
        >
          <input
            type="text"
            value={item.emoji}
            onChange={(e) => handleEmojiChange(i, e.target.value)}
            className="w-12 text-center text-lg bg-transparent border-0 outline-none p-0"
            maxLength={4}
            title="Emoji"
          />
          <input
            type="text"
            value={item.text}
            onChange={(e) => handleTextChange(i, e.target.value)}
            maxLength={100}
            className="flex-1 bg-transparent font-body text-[0.88rem] border-0 outline-none p-0"
          />
          <div className="flex gap-1 shrink-0">
            <button
              type="button"
              onClick={() => handleMoveUp(i)}
              disabled={i === 0}
              className="w-7 h-7 border-2 border-ink/20 bg-transparent text-ink font-bold text-[0.7rem] cursor-pointer disabled:opacity-20 hover:bg-ink/5"
              title="Move up"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => handleMoveDown(i)}
              disabled={i === items.length - 1}
              className="w-7 h-7 border-2 border-ink/20 bg-transparent text-ink font-bold text-[0.7rem] cursor-pointer disabled:opacity-20 hover:bg-ink/5"
              title="Move down"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="w-7 h-7 border-2 border-red-300 bg-transparent text-red-500 font-bold text-[0.7rem] cursor-pointer hover:bg-red-50"
              title="Remove"
            >
              ×
            </button>
          </div>
        </div>
      ))}

      {/* Add new item */}
      <div className="flex gap-2 items-end flex-wrap">
        <div className="w-16">
          <label className="block font-mono text-[0.65rem] opacity-50 uppercase mb-1">
            Emoji
          </label>
          <input
            type="text"
            value={addEmoji}
            onChange={(e) => setAddEmoji(e.target.value)}
            placeholder="☕"
            maxLength={4}
            className={`${inputClass} w-full text-center`}
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block font-mono text-[0.65rem] opacity-50 uppercase mb-1">
            Text
          </label>
          <input
            type="text"
            value={addText}
            onChange={(e) => setAddText(e.target.value)}
            placeholder="e.g. Coffee"
            maxLength={100}
            className={`${inputClass} w-full`}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!addText.trim()}
          className="px-4 py-2 border-3 border-ink bg-ink text-bg font-head font-bold text-[0.72rem] uppercase cursor-pointer hover:bg-transparent hover:text-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
        >
          + Add
        </button>
      </div>

      {items.length === 0 && (
        <p className="font-mono text-[0.72rem] opacity-40 text-center py-4">
          Nothing yet. Add one above.
        </p>
      )}
    </div>
  );
}
