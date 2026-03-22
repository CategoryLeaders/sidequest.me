"use client";

/**
 * Countdown badge for crowdfunding projects.
 * Shows time remaining until deadline or estimated delivery.
 * [SQ.S-W-2603-0074]
 *
 * Format: "14d 6h" | "6h 23m" | "47m" | hidden if expired.
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
}

function formatCountdown(targetDate: Date): string | null {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) return null; // expired

  const totalMinutes = Math.floor(diff / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  if (totalDays > 0) {
    const remainingHours = totalHours % 24;
    return `${totalDays}d ${remainingHours}h`;
  }
  if (totalHours > 0) {
    const remainingMinutes = totalMinutes % 60;
    return `${totalHours}h ${remainingMinutes}m`;
  }
  return `${totalMinutes}m`;
}

export default function CountdownBadge({ deadline, label, variant = "badge" }: CountdownBadgeProps) {
  const [countdown, setCountdown] = useState<string | null>(() => {
    try {
      return formatCountdown(new Date(deadline));
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const update = () => {
      try {
        setCountdown(formatCountdown(new Date(deadline)));
      } catch {
        setCountdown(null);
      }
    };

    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!countdown) return null;

  if (variant === "inline") {
    return (
      <span className="font-mono text-[0.6rem] opacity-60">
        {label && <span className="mr-1">{label}</span>}
        {countdown}
      </span>
    );
  }

  // Badge variant — overlay on card image
  return (
    <div
      className="absolute top-2 right-2 px-2 py-1 font-mono text-[0.55rem] font-bold uppercase z-10"
      style={{
        background: "var(--orange)",
        color: "var(--bg)",
        transform: "rotate(1.5deg)",
        boxShadow: "2px 2px 0 var(--ink)",
      }}
    >
      {label && <span className="mr-1">{label}</span>}
      {countdown}
    </div>
  );
}
