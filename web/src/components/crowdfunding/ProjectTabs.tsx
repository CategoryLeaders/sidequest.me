/* ── ProjectTabs — tabbed content area for backed project detail page ── */
"use client";

import { useState, type ReactNode } from "react";

export interface Tab {
  key: string;
  label: string;
  count?: number;
  content: ReactNode;
}

interface Props {
  tabs: Tab[];
  defaultTab?: string;
}

export default function ProjectTabs({ tabs, defaultTab }: Props) {
  const visibleTabs = tabs.filter((t) => t.content !== null);
  const [active, setActive] = useState(defaultTab ?? visibleTabs[0]?.key ?? "");

  if (visibleTabs.length === 0) return null;

  const current = visibleTabs.find((t) => t.key === active) ?? visibleTabs[0];

  return (
    <div className="mb-6">
      {/* Tab bar */}
      <div
        className="flex gap-0 border-b-2 border-ink/15 mb-4"
        role="tablist"
      >
        {visibleTabs.map((tab) => {
          const isActive = tab.key === current.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(tab.key)}
              className="font-mono text-[0.65rem] font-bold uppercase px-4 py-2.5 transition-all"
              style={{
                background: "none",
                border: "none",
                borderBottom: isActive ? "3px solid var(--orange)" : "3px solid transparent",
                color: isActive ? "var(--ink)" : "var(--ink)",
                opacity: isActive ? 1 : 0.4,
                cursor: "pointer",
                marginBottom: -2,
              }}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className="ml-1.5 text-[0.5rem] font-mono px-1.5 py-0.5"
                  style={{
                    background: isActive ? "var(--orange)" : "var(--ink)",
                    color: "#fff",
                    opacity: isActive ? 1 : 0.3,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div role="tabpanel">{current.content}</div>
    </div>
  );
}
