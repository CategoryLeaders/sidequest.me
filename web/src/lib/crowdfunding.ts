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

/**
 * Fetch a single published crowdfunding project by slug.
 * For the dedicated project detail page.
 */
export const getCrowdfundingProjectBySlug = cache(
  async (userId: string, slug: string): Promise<CrowdfundingProject | null> => {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("crowdfunding_projects")
      .select("*")
      .eq("user_id", userId)
      .eq("slug", slug)
      .eq("pledge_status", "published")
      .single();

    return (data as CrowdfundingProject) ?? null;
  }
);

/**
 * Get previous and next published projects for navigation.
 * Returns slugs for prev/next by sort_order.
 */
export const getAdjacentProjects = cache(
  async (userId: string, currentSortOrder: number): Promise<{ prev: string | null; next: string | null }> => {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    const [{ data: prevData }, { data: nextData }] = await Promise.all([
      sb.from("crowdfunding_projects")
        .select("slug")
        .eq("user_id", userId)
        .eq("pledge_status", "published")
        .lt("sort_order", currentSortOrder)
        .order("sort_order", { ascending: false })
        .limit(1),
      sb.from("crowdfunding_projects")
        .select("slug")
        .eq("user_id", userId)
        .eq("pledge_status", "published")
        .gt("sort_order", currentSortOrder)
        .order("sort_order", { ascending: true })
        .limit(1),
    ]);

    return {
      prev: prevData?.[0]?.slug ?? null,
      next: nextData?.[0]?.slug ?? null,
    };
  }
);

/**
 * Fetch crowdfunding updates for a project (from email ingestion).
 * Ordered by received_at descending (newest first).
 */
export const getUpdatesForProject = cache(
  async (projectId: string): Promise<CrowdfundingUpdate[]> => {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("crowdfunding_updates")
      .select("id, subject, body_text, body_html, sender_name, sender_email, received_at")
      .eq("project_id", projectId)
      .order("received_at", { ascending: false });

    return (data as CrowdfundingUpdate[]) ?? [];
  }
);

export interface CrowdfundingUpdate {
  id: string;
  subject: string;
  body_text: string | null;
  body_html: string | null;
  sender_name: string | null;
  sender_email: string | null;
  received_at: string;
}

/**
 * Get the email ingestion token for a project (owner only).
 */
export const getProjectEmailToken = cache(
  async (projectId: string): Promise<string | null> => {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("crowdfunding_projects")
      .select("crowdfunding_email_token")
      .eq("id", projectId)
      .single();

    return data?.crowdfunding_email_token ?? null;
  }
);
