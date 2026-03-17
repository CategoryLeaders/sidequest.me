/**
 * Server-only crowdfunding data queries.
 * Re-exports client-safe utilities for convenience in server components.
 */

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { CrowdfundingProject } from "./crowdfunding-utils";

// Re-export everything from the client-safe utils
export { type CrowdfundingProject, formatPledge, statusColor, statusLabel } from "./crowdfunding-utils";

/**
 * Fetch all published crowdfunding projects for a user.
 * For public profile view — only returns pledge_status = 'published'.
 */
export const getPublishedCrowdfundingProjects = cache(
  async (userId: string): Promise<CrowdfundingProject[]> => {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("crowdfunding_projects")
      .select("*")
      .eq("user_id", userId)
      .eq("pledge_status", "published")
      .order("sort_order", { ascending: true });

    return (data as CrowdfundingProject[]) ?? [];
  }
);

/**
 * Fetch ALL crowdfunding projects for a user (including unpublished).
 * For owner's settings/editor view.
 */
export const getAllCrowdfundingProjects = cache(
  async (userId: string): Promise<CrowdfundingProject[]> => {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("crowdfunding_projects")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true });

    return (data as CrowdfundingProject[]) ?? [];
  }
);
