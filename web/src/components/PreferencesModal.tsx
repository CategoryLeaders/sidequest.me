"use client";

/**
 * Preferences modal — theme + mode selector.
 * Opened from the Nav dropdown menu.
 */

import { useEffect, useRef } from "react";
import { useTheme, type Theme, type Mode } from "./ThemeProvider";

interface PreferencesModalProps {
  open: boolean;
  onClose: () => void;
}

const THEMES: { value: Theme; label: string; icon: string }[] = [
  { value: "default", label: "Default", icon: "⚡" },
  { value: "indica", label: "Indica", icon: "🌿" },
  { value: "sativa", label: "Sativa", icon: "🔥" },
];

const MODES: { value: Mode; label: string; icon: string }[] = [
  { value: "light", label: "Light", icon: "☀️" },
  { value: "dark", label: "Dark", icon: "🌙" },
  { value: "system", label: "System", icon: "⚙️" },
];

export default function PreferencesModal({
  open,
  onClose,
}: PreferencesModalProps) {
  const { theme, mode, setTheme, setMode } = useTheme();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Close on overlay click
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <div
        className="bg-[var(--bg-card,#fff)] border-3 border-[var(--border-color,#1a1a1a)] w-full max-w-sm mx-4"
        style={{ boxShadow: "6px 6px 0 var(--shadow-color, #1a1a1a)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-3 border-[var(--border-color,#1a1a1a)]">
          <h2 className="font-head font-[900] text-[0.9rem] uppercase tracking-wide m-0">
            Preferences
          </h2>
          <button
            onClick={onClose}
            className="bg-transparent border-0 cursor-pointer text-[1.2rem] p-1 leading-none opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 flex flex-col gap-6">
          {/* Theme selector */}
          <div>
            <label className="font-head font-bold text-[0.7rem] uppercase tracking-wider block mb-3">
              Theme
            </label>
            <div className="flex border-3 border-[var(--border-color,#1a1a1a)] overflow-hidden">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`
                    flex-1 py-2.5 px-3 font-head font-bold text-[0.68rem] uppercase
                    border-0 cursor-pointer transition-all duration-150
                    ${
                      theme === t.value
                        ? "bg-[var(--ink,#1a1a1a)] text-[var(--bg,#fffbe6)]"
                        : "bg-transparent text-[var(--ink,#1a1a1a)] hover:bg-[var(--divider,#ccc)]"
                    }
                  `}
                  style={{
                    borderRight:
                      t.value !== "sativa"
                        ? "3px solid var(--border-color, #1a1a1a)"
                        : "none",
                  }}
                >
                  <span className="block text-[0.9rem] mb-0.5">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
            <p className="font-mono text-[0.62rem] mt-2 opacity-50">
              {theme === "default" && "Full-saturation production colours"}
              {theme === "indica" && "Muted, earthy, understated"}
              {theme === "sativa" && "Warm, jewel-toned, confident"}
            </p>
          </div>

          {/* Mode selector */}
          <div>
            <label className="font-head font-bold text-[0.7rem] uppercase tracking-wider block mb-3">
              Mode
            </label>
            <div className="flex border-3 border-[var(--border-color,#1a1a1a)] overflow-hidden">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={`
                    flex-1 py-2.5 px-3 font-head font-bold text-[0.68rem] uppercase
                    border-0 cursor-pointer transition-all duration-150
                    ${
                      mode === m.value
                        ? "bg-[var(--ink,#1a1a1a)] text-[var(--bg,#fffbe6)]"
                        : "bg-transparent text-[var(--ink,#1a1a1a)] hover:bg-[var(--divider,#ccc)]"
                    }
                  `}
                  style={{
                    borderRight:
                      m.value !== "system"
                        ? "3px solid var(--border-color, #1a1a1a)"
                        : "none",
                  }}
                >
                  <span className="block text-[0.9rem] mb-0.5">{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
            <p className="font-mono text-[0.62rem] mt-2 opacity-50">
              {mode === "light" && "Always light background"}
              {mode === "dark" && "Always dark background"}
              {mode === "system" && "Follows your device settings"}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t-2 border-[var(--border-color,#1a1a1a)]/10">
          <button
            onClick={onClose}
            className="w-full py-2.5 font-head font-bold text-[0.72rem] uppercase border-3 border-[var(--border-color,#1a1a1a)] bg-[var(--orange,#ff6b35)] text-[var(--on-orange,white)] cursor-pointer transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[2px_2px_0_var(--shadow-color,#1a1a1a)]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
