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

/** Canonical status values — V2 pipeline [SQ.S-W-2603-0072] */
export const CROWDFUNDING_STATUSES = [
  "pre_launch",
  "crowdfunding",   // was 'live' in V1
  "funded",
  "in_production",
  "shipped",        // NEW in V2 — between in_production and delivered
  "delivered",
  "failed",
  "cancelled",
  "suspended",
] as const;
export type CrowdfundingStatus = (typeof CROWDFUNDING_STATUSES)[number];

/** Main pipeline statuses (left-to-right on tube map) */
export const MAIN_PIPELINE_STATUSES = [
  "pre_launch", "crowdfunding", "funded", "in_production", "shipped", "delivered",
] as const;

/** Branch / off-track statuses */
export const BRANCH_STATUSES = ["failed", "cancelled", "suspended"] as const;

/** Tube map colour scheme — hex values per status [SQ.S-W-2603-0073] */
export const STATUS_COLOURS: Record<string, string> = {
  pre_launch:    "#5b8abf",
  crowdfunding:  "#2a9d4a",
  funded:        "#1d8a5f",
  in_production: "#c77a20",
  shipped:       "#4a7ab5",
  delivered:     "#7a5ab5",
  failed:        "#d94455",
  cancelled:     "#a0a0a0",
  suspended:     "#a0a0a0",
};

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
  // V2 canonical pipeline
  pre_launch:     { step: 0, shortLabel: "Pre",    label: "Pre-launch",     highlightClass: "pipeline-hl-blue" },
  crowdfunding:   { step: 1, shortLabel: "Fund",   label: "Crowdfunding",   highlightClass: "pipeline-hl-green" },
  funded:         { step: 2, shortLabel: "Fund",   label: "Funded",         highlightClass: "pipeline-hl-teal" },
  in_production:  { step: 3, shortLabel: "Make",   label: "In Production",  highlightClass: "pipeline-hl-orange" },
  shipped:        { step: 4, shortLabel: "Ship",   label: "Shipped",        highlightClass: "pipeline-hl-steel" },
  delivered:      { step: 5, shortLabel: "Here!",  label: "Delivered",      highlightClass: "pipeline-hl-lilac" },
  // Branch / off-track
  failed:         { step: -1, shortLabel: "Fail",   label: "Failed",         highlightClass: "pipeline-hl-pink" },
  cancelled:      { step: -1, shortLabel: "Cancel", label: "Cancelled",      highlightClass: "pipeline-hl-grey" },
  suspended:      { step: -1, shortLabel: "Susp",   label: "Suspended",      highlightClass: "pipeline-hl-grey" },
  // Legacy mappings (V1 → V2)
  live:           { step: 1, shortLabel: "Fund",   label: "Crowdfunding",   highlightClass: "pipeline-hl-green" },
  active:         { step: 1, shortLabel: "Fund",   label: "Crowdfunding",   highlightClass: "pipeline-hl-green" },
  dropped:        { step: -1, shortLabel: "Cancel", label: "Cancelled",      highlightClass: "pipeline-hl-grey" },
  shipping:       { step: 4, shortLabel: "Ship",   label: "Shipped",        highlightClass: "pipeline-hl-steel" },
  received:       { step: 5, shortLabel: "Here!",  label: "Delivered",      highlightClass: "pipeline-hl-lilac" },
};

/** Normalise legacy/alias status values to their canonical V2 equivalents */
export function normalizeStatus(status: string): string {
  const legacyMap: Record<string, string> = {
    live:     "crowdfunding",
    active:   "crowdfunding",
    dropped:  "cancelled",
    shipping: "shipped",
    received: "delivered",
  };
  return legacyMap[status] ?? status;
}

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
    case "pipeline-hl-teal": return "sticker-green";
    case "pipeline-hl-orange": return "sticker-orange";
    case "pipeline-hl-blue": return "sticker-blue";
    case "pipeline-hl-steel": return "sticker-blue";
    case "pipeline-hl-lilac": return "sticker-lilac";
    case "pipeline-hl-pink": return "sticker-pink";
    case "pipeline-hl-grey": return "sticker-pink";
    default: return "sticker-lilac";
  }
}

/** Status → hex colour (for tube map and direct styling) */
export function statusHex(status: string): string {
  return STATUS_COLOURS[status] ?? "#a0a0a0";
}

/**
 * Parse a fuzzy delivery date string into a deadline Date (last day of the period).
 * "March 2026" → 2026-03-31, "Q2 2026" → 2026-06-30, "Holiday 2026" → 2026-12-31, "2026" → 2026-12-31.
 * Returns null if unparseable.
 */
export function parseDeliveryDeadline(text: string): Date | null {
  if (!text) return null;
  const t = text.trim();

  // Match "Q1/Q2/Q3/Q4 YYYY"
  const qMatch = t.match(/^Q([1-4])\s*(\d{4})$/i);
  if (qMatch) {
    const q = parseInt(qMatch[1]);
    const y = parseInt(qMatch[2]);
    const lastMonth = q * 3; // Q1→3, Q2→6, Q3→9, Q4→12
    return new Date(y, lastMonth, 0); // day 0 of next month = last day of lastMonth
  }

  // Match "Month YYYY" or "YYYY Month"
  const months = [
    "january","february","march","april","may","june",
    "july","august","september","october","november","december",
  ];
  const monthAbbrevs = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  for (let i = 0; i < months.length; i++) {
    const rx = new RegExp(`(?:${months[i]}|${monthAbbrevs[i]})\\s*(\\d{4})|(\\d{4})\\s*(?:${months[i]}|${monthAbbrevs[i]})`, "i");
    const m = t.match(rx);
    if (m) {
      const year = parseInt(m[1] || m[2]);
      return new Date(year, i + 1, 0); // last day of month i
    }
  }

  // Match "Holiday/Christmas YYYY" or "YYYY"
  const holidayMatch = t.match(/(?:holiday|christmas|xmas|winter)\s*(\d{4})/i);
  if (holidayMatch) return new Date(parseInt(holidayMatch[1]), 11, 31);

  const yearOnly = t.match(/^(\d{4})$/);
  if (yearOnly) return new Date(parseInt(yearOnly[1]), 11, 31);

  return null;
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
