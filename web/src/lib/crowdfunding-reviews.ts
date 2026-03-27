/**
 * Server-only queries for crowdfunding reviews.
 * [SQ.S-W-2603-0075]
 */

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type CrowdfundingReview = Tables<"crowdfunding_reviews">;

/**
 * Get the user's review for a specific project (if one exists).
 * Returns null if no review.
 */
export const getReviewForProject = cache(
  async (userId: string, projectId: string): Promise<CrowdfundingReview | null> => {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("crowdfunding_reviews")
      .select("*")
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .single();

    return (data as CrowdfundingReview) ?? null;
  }
);

/**
 * Get all published public reviews for a project.
 */
export const getPublicReviewsForProject = cache(
  async (projectId: string): Promise<CrowdfundingReview[]> => {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("crowdfunding_reviews")
      .select("*")
      .eq("project_id", projectId)
      .eq("status", "published")
      .eq("visibility", "public")
      .order("created_at", { ascending: false });

    return (data as CrowdfundingReview[]) ?? [];
  }
);

/**
 * Get all reviews by a user (for their profile / thoughtstream).
 */
export const getReviewsByUser = cache(
  async (userId: string): Promise<CrowdfundingReview[]> => {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("crowdfunding_reviews")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "published")
      .eq("visibility", "public")
      .order("created_at", { ascending: false });

    return (data as CrowdfundingReview[]) ?? [];
  }
);

/**
 * Batch-check which projects have a review from a specific user.
 * Returns a Map of projectId → review (or just the rating).
 */
export const getReviewRatingsForProjects = cache(
  async (userId: string, projectIds: string[]): Promise<Map<string, number | null>> => {
    if (projectIds.length === 0) return new Map();

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("crowdfunding_reviews")
      .select("project_id, rating")
      .eq("user_id", userId)
      .in("project_id", projectIds)
      .eq("status", "published");

    const map = new Map<string, number | null>();
    for (const row of (data ?? []) as { project_id: string; rating: number | null }[]) {
      map.set(row.project_id, row.rating);
    }
    return map;
  }
);
