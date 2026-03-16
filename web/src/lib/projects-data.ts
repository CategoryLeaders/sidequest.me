import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/* ── Types ── */

export type Project = {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  url: string | null;
  description: string | null;
  status: string;
  status_color: string | null;
  stack: string[];
  sort_order: number;
};

/* ── Queries ── */

/**
 * Fetch all projects for a user, ordered by sort_order.
 */
export const getProjectsForUser = cache(async (userId: string): Promise<Project[]> => {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  return (data as Project[]) ?? [];
});
