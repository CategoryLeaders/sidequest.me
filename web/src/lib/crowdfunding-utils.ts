/**
 * Client-safe utilities for crowdfunding projects.
 * No server imports — safe to use in "use client" components.
 */

import type { Tables } from "@/types/database";

export type CrowdfundingProject = Tables<"crowdfunding_projects">;

/** Currency symbols for display */
const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
  HKD: "HK$",
  JPY: "¥",
  CAD: "CA$",
  AUD: "AU$",
};

export function formatPledge(amount: string | null, currency: string | null): string {
  if (!amount || !currency) return "";
  const sym = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  // Strip trailing .00 for clean display
  const num = parseFloat(amount);
  const formatted = Number.isInteger(num) ? num.toLocaleString() : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${sym}${formatted}`;
}

/** Canonical status values — expanded to cover full crowdfunding lifecycle [SQ.S-W-2603-0060] */
export const CROWDFUNDING_STATUSES = [
  "pre_launch",
  "live",
  "funded",
  "in_production",
  "delivered",
  "failed",
  "cancelled",
  "suspended",
] as const;
export type CrowdfundingStatus = (typeof CROWDFUNDING_STATUSES)[number];

/** Pipeline stage data for the status indicator */
export interface StatusStepData {
  /** 0-indexed step number */
  step: number;
  /** Short label */
  shortLabel: string;
  /** Full label */
  label: string;
  /** CSS class for the highlighter colour */
  highlightClass: string;
}

const STEP_MAP: Record<string, StatusStepData> = {
  pre_launch:     { step: 0, shortLabel: "Pre",   label: "Pre-launch",     highlightClass: "pipeline-hl-blue" },
  live:           { step: 1, shortLabel: "Live",   label: "Live",           highlightClass: "pipeline-hl-green" },
  funded:         { step: 2, shortLabel: "Fund",   label: "Funded",         highlightClass: "pipeline-hl-green" },
  in_production:  { step: 3, shortLabel: "Make",   label: "In Production",  highlightClass: "pipeline-hl-orange" },
  delivered:      { step: 4, shortLabel: "Here!",  label: "Delivered",      highlightClass: "pipeline-hl-lilac" },
  failed:         { step: 5, shortLabel: "Fail",   label: "Failed",         highlightClass: "pipeline-hl-pink" },
  cancelled:      { step: 6, shortLabel: "Cancel", label: "Cancelled",      highlightClass: "pipeline-hl-pink" },
  suspended:      { step: 7, shortLabel: "Susp",   label: "Suspended",      highlightClass: "pipeline-hl-pink" },
  // Legacy mappings (old 4-step pipeline → new values)
  crowdfunding:   { step: 1, shortLabel: "Live",   label: "Live",           highlightClass: "pipeline-hl-green" },
  shipping:       { step: 3, shortLabel: "Ship",   label: "In Production",  highlightClass: "pipeline-hl-orange" },
  received:       { step: 4, shortLabel: "Here!",  label: "Delivered",      highlightClass: "pipeline-hl-lilac" },
  active:         { step: 1, shortLabel: "Live",   label: "Live",           highlightClass: "pipeline-hl-green" },
  shipped:        { step: 3, shortLabel: "Ship",   label: "In Production",  highlightClass: "pipeline-hl-orange" },
};

/** Get pipeline step data for a status string */
export function statusStep(status: string): StatusStepData {
  return STEP_MAP[status] ?? { step: 0, shortLabel: "Fund", label: status, highlightClass: "pipeline-hl-green" };
}

/** Status → human label (kept for backward compat) */
export function statusLabel(status: string): string {
  return statusStep(status).label;
}

/** Status → display colour class (kept for backward compat, e.g. editor dropdown) */
export function statusColor(status: string): string {
  const s = statusStep(status);
  switch (s.highlightClass) {
    case "pipeline-hl-green": return "sticker-green";
    case "pipeline-hl-orange": return "sticker-orange";
    case "pipeline-hl-blue": return "sticker-blue";
    case "pipeline-hl-lilac": return "sticker-lilac";
    case "pipeline-hl-pink": return "sticker-pink";
    default: return "sticker-lilac";
  }
}

/** Platform → display label */
export function platformLabel(platform: string): string {
  const labels: Record<string, string> = {
    kickstarter: "Kickstarter",
    indiegogo: "Indiegogo",
    gamefound: "Gamefound",
    backerkit: "BackerKit",
    other: "Other",
  };
  return labels[platform] ?? platform;
}
