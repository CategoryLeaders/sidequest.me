/* ── CardShell — unified card wrapper for all content types ── */

import { type ReactNode } from "react";

type Variant = "standard" | "compact" | "interactive";

interface Props {
  children: ReactNode;
  variant?: Variant;
  /** Optional rotation in degrees for playful tilt (e.g. -1, 1.5, 2) */
  rotation?: number;
  className?: string;
  as?: "article" | "div" | "section";
  style?: React.CSSProperties;
}

const variantStyles: Record<Variant, string> = {
  standard:
    "border-3 border-ink p-[var(--space-card-standard)] bg-[var(--bg-card)]",
  compact:
    "border-3 border-ink/[0.15] p-[var(--space-card-compact)] bg-[var(--bg-card)]",
  interactive:
    "border-3 border-ink p-[var(--space-card-standard)] bg-[var(--bg-card)] card-hover",
};

export function CardShell({
  children,
  variant = "standard",
  rotation,
  className = "",
  as: Tag = "article",
  style,
}: Props) {
  const mergedStyle: React.CSSProperties = {
    ...style,
    ...(rotation ? { transform: `rotate(${rotation}deg)` } : {}),
  };

  return (
    <Tag
      className={`${variantStyles[variant]} relative ${className}`}
      style={Object.keys(mergedStyle).length > 0 ? mergedStyle : undefined}
    >
      {children}
    </Tag>
  );
}
