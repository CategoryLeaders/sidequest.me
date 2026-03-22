"use client";

/**
 * Countdown badge for crowdfunding projects.
 * Shows time remaining until deadline or estimated delivery.
 * [SQ.S-W-2603-0074] [SQ.S-W-2603-0078]
 *
 * Format (>3d: days only; ≤3d: hours only; <1h: minutes only).
 * Badge variant positioned bottom-right so it doesn't clash with close buttons.
 * Re-renders every 60 seconds.
 */

import { useState, useEffect } from "react";

interface CountdownBadgeProps {
  /** ISO timestamp or date string for the deadline */
  deadline: string;
  /** Label prefix, e.g. "Ends in" or "Due" */
  label?: string;
  /** Style variant */
  variant?: "badge" | "inline";
  /**
   * Badge background colour (hex). Defaults to status-appropriate colour via the
   * tube map palette. Falls back to var(--orange) if not provided.
   */
  color?: string;
}

interface CountdownParts {
  value: number;
  unit: string;
}

function formatCountdown(targetDate: Date): CountdownParts | null {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) return null; // expired

  const totalMinutes = Math.floor(diff / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  // > 3 days: show days only
  if (totalDays > 3) return { value: totalDays, unit: "d" };
  // ≤ 3 days but ≥ 1 hour: show hours only (urgent)
  if (totalHours > 0) return { value: totalHours, unit: "h" };
  // < 1 hour: show minutes
  return { value: totalMinutes, unit: "m" };
}

/** Simple string for inline variant */
function formatCountdownInline(targetDate: Date): string | null {
  const parts = formatCountdown(targetDate);
  if (!parts) return null;
  return `${parts.value}${parts.unit}`;
}

export default function CountdownBadge({ deadline, label, variant = "badge", color }: CountdownBadgeProps) {
  const [parts, setParts] = useState<CountdownParts | null>(() => {
    try {
      return formatCountdown(new Date(deadline));
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const update = () => {
      try {
        setParts(formatCountdown(new Date(deadline)));
      } catch {
        setParts(null);
      }
    };

    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!parts) return null;

  if (variant === "inline") {
    return (
      <span className="font-mono text-[0.6rem] opacity-60">
        {label && <span className="mr-1">{label}</span>}
        {parts.value}{parts.unit}
      </span>
    );
  }

  // Badge variant — overlay on card/lightbox image, positioned bottom-right
  return (
    <div
      className="absolute bottom-2 right-2 px-2 py-1 font-mono z-10 text-center leading-none"
      style={{
        background: color ?? "var(--orange)",
        color: "#fff",
        transform: "rotate(1.5deg)",
        boxShadow: "2px 2px 0 rgba(0,0,0,0.35)",
        minWidth: "48px",
      }}
    >
      {label && (
        <div className="text-[0.45rem] font-bold uppercase tracking-wider opacity-80 mb-0.5">
          {label}
        </div>
      )}
      <div className="text-[0.9rem] font-black uppercase leading-none">
        {parts.value}{parts.unit}
      </div>
    </div>
  );
}
