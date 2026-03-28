"use client";

/**
 * CRUD editor for factoid cards — pick a category, enter a value, reorder/delete.
 * [SQ.S-W-2603-0040]
 */

import { useState } from "react";
import { FACTOID_CATEGORIES, type Factoid } from "@/types/profile-extras";

interface FactoidEditorProps {
  factoids: Factoid[];
  onChange: (updated: Factoid[]) => void;
}

export default function FactoidEditor({ factoids, onChange }: FactoidEditorProps) {
  const [addCategory, setAddCategory] = useState("");
  const [addValue, setAddValue] = useState("");

  const usedCategories = new Set(factoids.map((f) => f.category));
  const availableCategories = FACTOID_CATEGORIES.filter(
    (c) => !usedCategories.has(c.label)
  );

  const handleAdd = () => {
    if (!addCategory || !addValue.trim()) return;
    const preset = FACTOID_CATEGORIES.find((c) => c.label === addCategory);
    const newFactoid: Factoid = {
      category: addCategory,
      emoji: preset?.emoji ?? "📌",
      value: addValue.trim(),
    };
    onChange([...factoids, newFactoid]);
    setAddCategory("");
    setAddValue("");
  };

  const handleRemove = (index: number) => {
    onChange(factoids.filter((_, i) => i !== index));
  };

  const handleValueChange = (index: number, newValue: string) => {
    const updated = [...factoids];
    updated[index] = { ...updated[index], value: newValue };
    onChange(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...factoids];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onChange(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === factoids.length - 1) return;
    const updated = [...factoids];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onChange(updated);
  };

  const inputClass =
    "w-full px-3 py-2 border-3 border-ink bg-bg-card font-mono text-[0.82rem] focus:outline-none focus:shadow-[2px_2px_0_var(--ink)] transition-shadow";

  return (
    <div className="space-y-3">
      {/* Existing factoids */}
      {factoids.map((f, i) => (
        <div
          key={`${f.category}-${i}`}
          className="flex items-center gap-2 border-3 border-ink p-3 bg-bg-card"
        >
          <span className="text-lg shrink-0">{f.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[0.65rem] opacity-50 uppercase mb-0.5">
              {f.category}
            </div>
            <input
              type="text"
              value={f.value}
              onChange={(e) => handleValueChange(i, e.target.value)}
              maxLength={100}
              className="w-full bg-transparent font-head font-bold text-[0.88rem] border-0 outline-none p-0"
            />
          </div>
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
              disabled={i === factoids.length - 1}
              className="w-7 h-7 border-2 border-ink/20 bg-transparent text-ink font-bold text-[0.7rem] cursor-pointer disabled:opacity-20 hover:bg-ink/5"
              title="Move down"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="w-7 h-7 border-2 border-pink/50 bg-transparent text-pink font-bold text-[0.7rem] cursor-pointer hover:bg-pink/10"
              title="Remove"
            >
              ×
            </button>
          </div>
        </div>
      ))}

      {/* Add new factoid */}
      {availableCategories.length > 0 && (
        <div className="flex gap-2 items-end flex-wrap">
          <div className="flex-1 min-w-[160px]">
            <label className="block font-mono text-[0.65rem] opacity-50 uppercase mb-1">
              Category
            </label>
            <select
              value={addCategory}
              onChange={(e) => setAddCategory(e.target.value)}
              className={inputClass}
            >
              <option value="">Pick a category…</option>
              {availableCategories.map((c) => (
                <option key={c.label} value={c.label}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block font-mono text-[0.65rem] opacity-50 uppercase mb-1">
              Value
            </label>
            <input
              type="text"
              value={addValue}
              onChange={(e) => setAddValue(e.target.value)}
              placeholder="e.g. Surrey, UK"
              maxLength={100}
              className={inputClass}
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
            disabled={!addCategory || !addValue.trim()}
            className="px-4 py-2 border-3 border-ink bg-ink text-bg font-head font-bold text-[0.72rem] uppercase cursor-pointer hover:bg-transparent hover:text-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            + Add
          </button>
        </div>
      )}

      {factoids.length === 0 && (
        <p className="font-mono text-[0.72rem] opacity-40 text-center py-4">
          No factoid cards yet. Pick a category above to add one.
        </p>
      )}
    </div>
  );
}
