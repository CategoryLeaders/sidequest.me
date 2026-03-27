/**
 * Server-only queries for the generic object_links table.
 * [SQ.S-W-2603-0076]
 */

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type ObjectLink = Tables<"object_links">;

export type ObjectType = "crowdfunding" | "writing" | "adventure" | "microblog" | "review";

/**
 * Get all links where a given entity is the SOURCE.
 * E.g. "What does this crowdfunding project link to?"
 */
export const getLinksFromSource = cache(
  async (sourceType: ObjectType, sourceId: string): Promise<ObjectLink[]> => {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("object_links")
      .select("*")
      .eq("source_type", sourceType)
      .eq("source_id", sourceId)
      .order("sort_order", { ascending: true });

    return (data as ObjectLink[]) ?? [];
  }
);

/**
 * Get all links where a given entity is the TARGET.
 * E.g. "What links TO this crowdfunding project?"
 */
export const getLinksToTarget = cache(
  async (targetType: ObjectType, targetId: string): Promise<ObjectLink[]> => {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("object_links")
      .select("*")
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .order("sort_order", { ascending: true });

    return (data as ObjectLink[]) ?? [];
  }
);

/**
 * Get all links for an entity (both directions).
 * Merges outgoing and incoming links.
 */
export const getAllLinksForEntity = cache(
  async (entityType: ObjectType, entityId: string): Promise<ObjectLink[]> => {
    const [outgoing, incoming] = await Promise.all([
      getLinksFromSource(entityType, entityId),
      getLinksToTarget(entityType, entityId),
    ]);
    return [...outgoing, ...incoming];
  }
);

/**
 * Enriched link with display info resolved from the linked entity.
 */
export interface EnrichedObjectLink extends ObjectLink {
  displayTitle: string;
  displayHref?: string;
  displayImage?: string;
}

/**
 * Resolve display info for a set of object links.
 * Looks up titles/slugs from the target tables.
 */
export async function enrichObjectLinks(
  links: ObjectLink[],
  username: string
): Promise<EnrichedObjectLink[]> {
  if (links.length === 0) return [];

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  // Group by type to batch queries
  const byType: Record<string, string[]> = {};
  for (const link of links) {
    // For outgoing links, resolve the target; for incoming, resolve the source
    const type = link.target_type;
    const id = link.target_id;
    if (!byType[type]) byType[type] = [];
    byType[type].push(id);
  }

  // Fetch display info for each entity type
  const entityInfo: Record<string, { title: string; slug: string; image_url?: string }> = {};

  if (byType.crowdfunding?.length) {
    const { data } = await sb
      .from("crowdfunding_projects")
      .select("id, title, slug, image_url")
      .in("id", byType.crowdfunding);
    for (const row of data ?? []) {
      entityInfo[row.id] = { title: row.title, slug: row.slug, image_url: row.image_url };
    }
  }

  if (byType.writing?.length) {
    const { data } = await sb
      .from("writings")
      .select("id, title, slug")
      .in("id", byType.writing);
    for (const row of data ?? []) {
      entityInfo[row.id] = { title: row.title, slug: row.slug };
    }
  }

  if (byType.adventure?.length) {
    const { data } = await sb
      .from("adventures")
      .select("id, title, slug, cover_image_url")
      .in("id", byType.adventure);
    for (const row of data ?? []) {
      entityInfo[row.id] = { title: row.title, slug: row.slug, image_url: row.cover_image_url };
    }
  }

  // Map href patterns
  const hrefForType = (type: string, slug: string) => {
    switch (type) {
      case "crowdfunding": return `/${username}/backed/${slug}`;
      case "writing": return `/${username}/writings/${slug}`;
      case "adventure": return `/${username}/adventures/${slug}`;
      default: return undefined;
    }
  };

  return links.map((link) => {
    const info = entityInfo[link.target_id];
    return {
      ...link,
      displayTitle: info?.title ?? link.label ?? "Linked item",
      displayHref: info ? hrefForType(link.target_type, info.slug) : undefined,
      displayImage: info?.image_url,
    };
  });
}
