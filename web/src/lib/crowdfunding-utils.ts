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

/** Status → display colour class */
export function statusColor(status: string): string {
  switch (status) {
    case "crowdfunding":
      return "sticker-green";
    case "in_production":
      return "sticker-orange";
    case "shipping":
      return "sticker-blue";
    case "received":
      return "sticker-lilac";
    // Legacy statuses (still in DB, will phase out)
    case "active":
      return "sticker-green";
    case "delivered":
      return "sticker-lilac";
    case "shipped":
      return "sticker-blue";
    case "dropped":
    case "failed":
      return "sticker-pink";
    case "suspended":
      return "sticker-yellow";
    default:
      return "sticker-lilac";
  }
}

/** Status → human label */
export function statusLabel(status: string): string {
  switch (status) {
    case "crowdfunding":
      return "Crowdfunding";
    case "in_production":
      return "In Production";
    case "shipping":
      return "Shipping";
    case "received":
      return "Received";
    // Legacy statuses
    case "active":
      return "Crowdfunding";
    case "delivered":
      return "Received";
    case "shipped":
      return "Shipping";
    case "dropped":
      return "Dropped";
    case "failed":
      return "Failed";
    case "suspended":
      return "Suspended";
    default:
      return status;
  }
}
