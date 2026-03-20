/* ── What's New feed — queries feed_events + hydrates content ── [SQ.S-W-2603-0066] */

import { createClient } from "@/lib/supabase/server";
import type { FeedEventType, FeedVisibility } from "@/lib/feed-events";

// ─── Raw feed event row ─────────────────────────────────────────────────────

export interface FeedEventRow {
  id: string;
  profile_id: string;
  event_type: FeedEventType;
  object_id: string;
  object_type: string;
  visibility: FeedVisibility;
  published_at: string;
  photo_batch_id: string | null;
  expires_at: string | null;
  created_at: string;
}

// ─── Hydrated feed item (event + content preview) ───────────────────────────

export interface WhatsNewItem {
  id: string;
  eventType: FeedEventType;
  objectId: string;
  objectType: string;
  publishedAt: string;
  // Hydrated content — varies by type
  title: string;
  description: string;
  link: string;
  badge: string;
  badgeLabel: string;
  icon: string;
  imageUrl?: string;
  // Type-specific optional fields
  domain?: string;        // bookmarks
  faviconUrl?: string;    // bookmarks
  readingTime?: string;   // writings ("4 min read")
  projectStatus?: string; // projects
  resolved?: boolean;     // questions
}

/**
 * Fetch the What's New feed for a profile. Queries feed_events, then batch-hydrates
 * the referenced objects to build mini cards.
 */
export async function getWhatsNewFeed(
  profileId: string,
  username: string,
  opts?: { limit?: number; offset?: number }
): Promise<WhatsNewItem[]> {
  const limit = opts?.limit ?? 12;
  const offset = opts?.offset ?? 0;
  const supabase = await createClient();

  // ── Fetch feed events ────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: events, error } = await (supabase as any)
    .from("feed_events")
    .select("*")
    .eq("profile_id", profileId)
    .eq("visibility", "public")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1) as { data: FeedEventRow[] | null; error: any };

  if (error || !events || events.length === 0) {
    return [];
  }

  // ── Group object_ids by object_type for batch fetching ─────────────────
  const groups: Record<string, string[]> = {};
  for (const e of events) {
    if (!groups[e.object_type]) groups[e.object_type] = [];
    if (!groups[e.object_type].includes(e.object_id)) {
      groups[e.object_type].push(e.object_id);
    }
  }

  // ── Batch fetch content ────────────────────────────────────────────────
  const contentMap: Record<string, Record<string, any>> = {};

  const fetchers: Promise<void>[] = [];

  if (groups["microblog_posts"]?.length) {
    fetchers.push((async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("microblog_posts")
        .select("id, short_id, body, images, published_at")
        .in("id", groups["microblog_posts"]);
      contentMap["microblog_posts"] = {};
      for (const row of data ?? []) contentMap["microblog_posts"][row.id] = row;
    })());
  }

  if (groups["writings"]?.length) {
    fetchers.push((async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("writings")
        .select("id, title, slug, body_html, word_count, published_at")
        .in("id", groups["writings"]);
      contentMap["writings"] = {};
      for (const row of data ?? []) contentMap["writings"][row.id] = row;
    })());
  }

  if (groups["bookmarks"]?.length) {
    fetchers.push((async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("bookmarks")
        .select("id, short_id, url, og_title, og_description, og_domain, og_favicon_url, commentary")
        .in("id", groups["bookmarks"]);
      contentMap["bookmarks"] = {};
      for (const row of data ?? []) contentMap["bookmarks"][row.id] = row;
    })());
  }

  if (groups["quotes"]?.length) {
    fetchers.push((async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("quotes")
        .select("id, short_id, quote_text, source_name, source_work")
        .in("id", groups["quotes"]);
      contentMap["quotes"] = {};
      for (const row of data ?? []) contentMap["quotes"][row.id] = row;
    })());
  }

  if (groups["questions"]?.length) {
    fetchers.push((async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("questions")
        .select("id, short_id, question_text, resolved")
        .in("id", groups["questions"]);
      contentMap["questions"] = {};
      for (const row of data ?? []) contentMap["questions"][row.id] = row;
    })());
  }

  if (groups["projects"]?.length) {
    fetchers.push((async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("projects")
        .select("id, title, description, status")
        .in("id", groups["projects"]);
      contentMap["projects"] = {};
      for (const row of data ?? []) contentMap["projects"][row.id] = row;
    })());
  }

  await Promise.all(fetchers);

  // ── Hydrate events into WhatsNewItems ──────────────────────────────────
  const items: WhatsNewItem[] = [];

  for (const event of events) {
    const content = contentMap[event.object_type]?.[event.object_id];
    if (!content && !["career_updated", "profile_updated"].includes(event.event_type)) continue; // orphaned event

    const item = hydrateEvent(event, content, username);
    if (item) items.push(item);
  }

  return items;
}

function hydrateEvent(event: FeedEventRow, content: any, username: string): WhatsNewItem | null {
  const base = {
    id: event.id,
    eventType: event.event_type,
    objectId: event.object_id,
    objectType: event.object_type,
    publishedAt: event.published_at,
  };

  switch (event.event_type) {
    case "microblog_published": {
      const body = (content?.body ?? "").slice(0, 140);
      const hasImage = content?.images?.length > 0;
      return {
        ...base,
        title: "Microblog",
        description: body + (body.length >= 140 ? "..." : ""),
        link: `/${username}/thoughts/${content?.short_id ?? event.object_id}`,
        badge: "badge-orange",
        badgeLabel: "Microblog",
        icon: "✏️",
        imageUrl: hasImage ? content.images[0]?.url : undefined,
      };
    }

    case "writing_published": {
      const title = content?.title ?? "Untitled";
      const slug = content?.slug ?? event.object_id;
      const wordCount: number = content?.word_count ?? 0;
      const readingTime = wordCount > 0 ? `${Math.ceil(wordCount / 200)} min read` : undefined;
      return {
        ...base,
        title,
        description: "",
        link: `/${username}/writings/${slug}`,
        badge: "badge-blue",
        badgeLabel: "Writing",
        icon: "📝",
        readingTime,
      };
    }

    case "bookmark_published": {
      return {
        ...base,
        title: content?.og_title ?? content?.url ?? "Bookmark",
        description: content?.commentary ?? content?.og_description ?? "",
        link: `/${username}/thoughts/${content?.short_id ?? event.object_id}`,
        badge: "badge-green",
        badgeLabel: "Bookmark",
        icon: "🔖",
        domain: content?.og_domain,
        faviconUrl: content?.og_favicon_url,
      };
    }

    case "quote_published": {
      const text = (content?.quote_text ?? "").slice(0, 120);
      return {
        ...base,
        title: `"${text}${text.length >= 120 ? "..." : ""}"`,
        description: `— ${content?.source_name ?? "Unknown"}${content?.source_work ? `, ${content.source_work}` : ""}`,
        link: `/${username}/thoughts/${content?.short_id ?? event.object_id}`,
        badge: "badge-lilac",
        badgeLabel: "Quote",
        icon: "💬",
      };
    }

    case "question_published":
    case "question_resolved": {
      const resolved = content?.resolved;
      return {
        ...base,
        title: content?.question_text ?? "Question",
        description: resolved ? "Resolved" : "Open",
        link: `/${username}/thoughts/${content?.short_id ?? event.object_id}`,
        badge: resolved ? "badge-green" : "badge-yellow",
        badgeLabel: resolved ? "Resolved" : "Question",
        icon: "❓",
        resolved: !!resolved,
      };
    }

    case "project_created":
    case "project_updated": {
      return {
        ...base,
        title: content?.title ?? "Project",
        description: (content?.description ?? "").slice(0, 80),
        link: `/${username}/projects`,
        badge: "badge-orange",
        badgeLabel: event.event_type === "project_created" ? "New Project" : "Project Update",
        icon: "🚀",
        projectStatus: content?.status,
      };
    }

    case "project_backed": {
      return {
        ...base,
        title: content?.title ?? "Backed Project",
        description: (content?.description ?? "").slice(0, 80),
        link: `/${username}/projects`,
        badge: "badge-pink",
        badgeLabel: "Backed",
        icon: "💰",
      };
    }

    case "career_updated": {
      return {
        ...base,
        title: "Career Update",
        description: "",
        link: `/${username}/professional`,
        badge: "badge-blue",
        badgeLabel: "Career",
        icon: "💼",
      };
    }

    case "profile_updated": {
      return {
        ...base,
        title: "Profile Updated",
        description: "",
        link: `/${username}`,
        badge: "badge-lilac",
        badgeLabel: "Profile",
        icon: "👤",
      };
    }

    default:
      return null;
  }
}
