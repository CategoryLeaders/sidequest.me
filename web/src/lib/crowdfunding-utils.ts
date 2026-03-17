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

/** Canonical status values */
export const CROWDFUNDING_STATUSES = ["crowdfunding", "in_production", "shipping", "received"] as const;
export type CrowdfundingStatus = (typeof CROWDFUNDING_STATUSES)[number];

/** Pipeline stage data for the status indicator */
export interface StatusStepData {
  /** 0-indexed step number (0 = crowdfunding, 3 = received) */
  step: number;
  /** Short label: Fund, Make, Ship, Here! */
  shortLabel: string;
  /** Full label */
  label: string;
  /** CSS class for the highlighter colour */
  highlightClass: string;
}

const STEP_MAP: Record<string, StatusStepData> = {
  crowdfunding: { step: 0, shortLabel: "Fund", label: "Crowdfunding", highlightClass: "pipeline-hl-green" },
  in_production: { step: 1, shortLabel: "Make", label: "In Production", highlightClass: "pipeline-hl-orange" },
  shipping: { step: 2, shortLabel: "Ship", label: "Shipping", highlightClass: "pipeline-hl-blue" },
  received: { step: 3, shortLabel: "Here!", label: "Received", highlightClass: "pipeline-hl-lilac" },
  // Legacy mappings
  active: { step: 0, shortLabel: "Fund", label: "Crowdfunding", highlightClass: "pipeline-hl-green" },
  delivered: { step: 3, shortLabel: "Here!", label: "Received", highlightClass: "pipeline-hl-lilac" },
  shipped: { step: 2, shortLabel: "Ship", label: "Shipping", highlightClass: "pipeline-hl-blue" },
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
  switch (s.step) {
    case 0: return "sticker-green";
    case 1: return "sticker-orange";
    case 2: return "sticker-blue";
    case 3: return "sticker-lilac";
    default: return "sticker-lilac";
  }
}
