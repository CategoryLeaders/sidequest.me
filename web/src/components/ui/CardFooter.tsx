/* ── CardFooter — unified footer for all card types ── */

import { type ReactNode } from "react";

interface Props {
  /** Left side content — typically timestamp */
  left?: ReactNode;
  /** Right side content — typically EngagementBar */
  right?: ReactNode;
  className?: string;
}

export function CardFooter({ left, right, className = "" }: Props) {
  return (
    <div
      className={`flex items-center justify-between mt-2 pt-2 border-t border-ink/[0.15] ${className}`}
    >
      <div className="flex items-center gap-3">{left}</div>
      <div className="flex items-center gap-3">{right}</div>
    </div>
  );
}
