/* ── MetadataLine — consistent metadata display (timestamps, read time, etc.) ── */

import { type ReactNode } from "react";

interface MetadataItem {
  icon?: string;
  label: string | ReactNode;
}

interface Props {
  items: MetadataItem[];
  className?: string;
}

export function MetadataLine({ items, className = "" }: Props) {
  if (items.length === 0) return null;

  return (
    <div
      className={`flex items-center gap-3 text-[var(--text-xs)] font-mono opacity-40 ${className}`}
    >
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {item.icon && <span>{item.icon}</span>}
          <span>{item.label}</span>
        </span>
      ))}
    </div>
  );
}
