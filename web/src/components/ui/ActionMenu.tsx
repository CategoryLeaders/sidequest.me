/* ── ActionMenu — owner-only overflow menu for cards ── */
"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onPin?: () => void;
  isPinned?: boolean;
  className?: string;
}

export function ActionMenu({
  onEdit,
  onDelete,
  onShare,
  onPin,
  isPinned,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirming(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setConfirming(false);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const hasActions = onEdit || onDelete || onShare || onPin;
  if (!hasActions) return null;

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={() => {
          setOpen(!open);
          setConfirming(false);
        }}
        className="w-7 h-7 flex items-center justify-center text-[var(--text-sm)] opacity-30 hover:opacity-70 transition-opacity font-bold"
        aria-label="Actions"
        title="Actions"
      >
        &middot;&middot;&middot;
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 border-2 border-ink bg-[var(--bg-card)] min-w-[140px] shadow-[3px_3px_0_var(--ink)]">
          {onShare && (
            <button
              onClick={() => {
                onShare();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-[var(--text-sm)] font-mono hover:bg-ink/[0.06] transition-colors flex items-center gap-2"
            >
              🔗 Share
            </button>
          )}
          {onPin && (
            <button
              onClick={() => {
                onPin();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-[var(--text-sm)] font-mono hover:bg-ink/[0.06] transition-colors flex items-center gap-2"
            >
              📌 {isPinned ? "Unpin" : "Pin"}
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => {
                onEdit();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-[var(--text-sm)] font-mono hover:bg-ink/[0.06] transition-colors flex items-center gap-2"
            >
              ✏️ Edit
            </button>
          )}
          {onDelete && (
            <>
              {!confirming ? (
                <button
                  onClick={() => setConfirming(true)}
                  className="w-full text-left px-3 py-2 text-[var(--text-sm)] font-mono hover:bg-ink/[0.06] transition-colors flex items-center gap-2 text-[#E53935]"
                >
                  🗑️ Delete
                </button>
              ) : (
                <button
                  onClick={() => {
                    onDelete();
                    setOpen(false);
                    setConfirming(false);
                  }}
                  className="w-full text-left px-3 py-2 text-[var(--text-sm)] font-mono bg-[#E53935] text-white transition-colors flex items-center gap-2"
                >
                  Confirm delete?
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
