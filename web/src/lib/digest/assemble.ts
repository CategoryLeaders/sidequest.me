/* ── Digest assembly — collects content across all types ── [SQ.S-W-2603-0068] */

import { createServiceClient } from "@/lib/supabase/service";

interface DigestItem {
  type: string;
  title: string;
  excerpt: string;
  link: string;
  imageUrl?: string;
  publishedAt: string;
  reactionCount?: number;
  commentCount?: number;
}

interface DigestContent {
  items: DigestItem[];
  subjectLine: string;
}

/**
 * Assemble digest content for a profile since a given date.
 * Queries all content type tables for published items.
 */
export async function assembleDigest(
  profileId: string,
  username: string,
  since: string,
  settings: {
    include_microblog: boolean;
    include_writings: boolean;
    include_bookmarks: boolean;
    include_quotes: boolean;
    include_questions: boolean;
    include_projects: boolean;
    include_adventures: boolean;
  }
): Promise<DigestContent> {
  const supabase = createServiceClient();
  const items: DigestItem[] = [];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sidequest.me";

  const fetchers: Promise<void>[] = [];

  if (settings.include_microblog) {
    fetchers.push((async () => {
      const { data } = await supabase
        .from("microblog_posts")
        .select("id, short_id, body, images, published_at")
        .eq("profile_id", profileId)
        .eq("status", "published")
        .eq("visibility", "public")
        .gt("published_at", since)
        .order("published_at", { ascending: false });
      for (const p of data ?? []) {
        const imgs = (p.images as any[]) ?? [];
        items.push({
          type: "Microblog",
          title: "Microblog",
          excerpt: ((p.body as string) ?? "").slice(0, 200),
          link: `${baseUrl}/${username}/thoughts/${p.short_id}`,
          imageUrl: imgs[0]?.url,
          publishedAt: p.published_at as string,
        });
      }
    })());
  }

  if (settings.include_writings) {
    fetchers.push((async () => {
      const { data } = await supabase
        .from("writings")
        .select("id, title, slug, body_html, word_count, published_at")
        .eq("user_id", profileId)
        .eq("status", "published")
        .gt("published_at", since)
        .order("published_at", { ascending: false });
      for (const w of data ?? []) {
        // Simple excerpt from body_html
        const text = ((w.body_html as string) ?? "").replace(/<[^>]+>/g, "").slice(0, 200);
        items.push({
          type: "Writing",
          title: (w.title as string) ?? "Untitled",
          excerpt: text,
          link: `${baseUrl}/${username}/writings/${w.slug}`,
          publishedAt: w.published_at as string,
        });
      }
    })());
  }

  if (settings.include_bookmarks) {
    fetchers.push((async () => {
      const { data } = await supabase
        .from("bookmarks")
        .select("id, short_id, url, og_title, commentary, published_at")
        .eq("profile_id", profileId)
        .eq("status", "published")
        .eq("visibility", "public")
        .gt("published_at", since)
        .order("published_at", { ascending: false });
      for (const b of data ?? []) {
        items.push({
          type: "Bookmark",
          title: (b.og_title as string) ?? (b.url as string) ?? "Bookmark",
          excerpt: (b.commentary as string) ?? "",
          link: `${baseUrl}/${username}/thoughts/${b.short_id}`,
          publishedAt: b.published_at as string,
        });
      }
    })());
  }

  if (settings.include_quotes) {
    fetchers.push((async () => {
      const { data } = await supabase
        .from("quotes")
        .select("id, short_id, quote_text, source_name, published_at")
        .eq("profile_id", profileId)
        .eq("status", "published")
        .eq("visibility", "public")
        .gt("published_at", since)
        .order("published_at", { ascending: false });
      for (const q of data ?? []) {
        items.push({
          type: "Quote",
          title: `"${((q.quote_text as string) ?? "").slice(0, 80)}..."`,
          excerpt: `— ${(q.source_name as string) ?? "Unknown"}`,
          link: `${baseUrl}/${username}/thoughts/${q.short_id}`,
          publishedAt: q.published_at as string,
        });
      }
    })());
  }

  if (settings.include_questions) {
    fetchers.push((async () => {
      const { data } = await supabase
        .from("questions")
        .select("id, short_id, question_text, published_at")
        .eq("profile_id", profileId)
        .eq("status", "published")
        .eq("visibility", "public")
        .gt("published_at", since)
        .order("published_at", { ascending: false });
      for (const q of data ?? []) {
        items.push({
          type: "Question",
          title: (q.question_text as string) ?? "Question",
          excerpt: "",
          link: `${baseUrl}/${username}/thoughts/${q.short_id}`,
          publishedAt: q.published_at as string,
        });
      }
    })());
  }

  await Promise.all(fetchers);

  // Sort chronologically (newest first)
  items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  // Generate subject line from most recent item
  const subjectLine = items.length > 0
    ? `New from sidequest.me: ${items[0].title.slice(0, 60)}`
    : "Your sidequest.me digest";

  return { items, subjectLine };
}

/**
 * Render digest items to HTML for email.
 */
export function renderDigestHtml(
  items: DigestItem[],
  profileDisplayName: string
): string {
  if (items.length === 0) {
    return `<p>No new content since your last digest.</p>`;
  }

  const itemsHtml = items
    .map(
      (item) => `
      <div style="border: 2px solid #000; padding: 16px; margin-bottom: 12px;">
        <div style="font-family: monospace; font-size: 10px; text-transform: uppercase; color: #666; margin-bottom: 4px;">
          ${item.type} · ${new Date(item.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
        </div>
        ${item.imageUrl ? `<img src="${item.imageUrl}" alt="" style="width: 100%; height: 120px; object-fit: cover; margin-bottom: 8px;" />` : ""}
        <div style="font-family: 'Archivo', sans-serif; font-weight: 700; font-size: 15px; text-transform: uppercase; margin-bottom: 4px;">
          <a href="${item.link}" style="color: #000; text-decoration: none;">${item.title}</a>
        </div>
        ${item.excerpt ? `<div style="font-size: 13px; color: #555; line-height: 1.5;">${item.excerpt}</div>` : ""}
        <a href="${item.link}" style="display: inline-block; margin-top: 8px; font-family: monospace; font-size: 11px; color: #e8590c;">Read more →</a>
      </div>
    `
    )
    .join("");

  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
      <h1 style="font-family: 'Archivo', sans-serif; text-transform: uppercase; font-size: 22px; font-weight: 900; margin-bottom: 4px;">
        What's New
      </h1>
      <p style="font-size: 13px; color: #666; margin-bottom: 20px;">
        From ${profileDisplayName} on sidequest.me
      </p>
      ${itemsHtml}
    </div>
  `;
}
