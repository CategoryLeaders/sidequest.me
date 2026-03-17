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

/** Status → display colour class */
export function statusColor(status: string): string {
  switch (status) {
    case "active":
      return "sticker-green";
    case "delivered":
      return "sticker-blue";
    case "shipped":
      return "sticker-orange";
    case "dropped":
      return "sticker-pink";
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
    case "active":
      return "Active";
    case "delivered":
      return "Delivered";
    case "shipped":
      return "Shipped";
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
