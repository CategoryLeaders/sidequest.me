import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/* ── Types ── */

export type EntityType = "company" | "company_role" | "project" | "like" | "dislike" | "adventure" | "crowdfunding";

export type WritingLink = {
  id: string;
  writing_id: string;
  entity_type: EntityType;
  entity_id: string;
  is_primary: boolean;
  created_at: string;
};

/** A writing link enriched with display info about the linked entity */
export type WritingLinkDisplay = WritingLink & {
  label: string;
  href?: string;
  color?: string;
  emoji?: string;
};

/* ── Queries ── */

/**
 * Get all links for a specific writing.
 */
export const getLinksForWriting = cache(async (writingId: string): Promise<WritingLink[]> => {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("writing_links")
    .select("*")
    .eq("writing_id", writingId)
    .order("created_at", { ascending: true });

  return (data as WritingLink[]) ?? [];
});

/**
 * Get all writings linked to a specific entity.
 * Returns writing IDs + basic writing info.
 */
export const getWritingsForEntity = cache(
  async (entityType: EntityType, entityId: string) => {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("writing_links")
      .select("writing_id, writings!inner(id, title, slug, status, published_at, tags, external_url)")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("writings.status", "published");

    return data ?? [];
  }
);

/**
 * Count published writings linked to a specific entity.
 */
export const countWritingsForEntity = cache(
  async (entityType: EntityType, entityId: string): Promise<number> => {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase as any)
      .from("writing_links")
      .select("writing_id, writings!inner(id)", { count: "exact", head: true })
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("writings.status", "published") as { count: number | null };

    return count ?? 0;
  }
);

/**
 * Batch-fetch writing counts for multiple entities of the same type.
 * Returns a Map of entityId → count.
 */
export async function countWritingsForEntities(
  entityType: EntityType,
  entityIds: string[]
): Promise<Map<string, number>> {
  if (entityIds.length === 0) return new Map();

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("writing_links")
    .select("entity_id, writing_id, writings!inner(id, status)")
    .eq("entity_type", entityType)
    .in("entity_id", entityIds)
    .eq("writings.status", "published") as { data: Array<{ entity_id: string }> | null };

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.entity_id, (counts.get(row.entity_id) ?? 0) + 1);
  }
  return counts;
}
