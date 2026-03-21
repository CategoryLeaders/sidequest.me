/* ── Aggregated feed for the homepage "What's New" section ── */

import { createClient } from "@/lib/supabase/server";

export type FeedItem = {
  id: string;
  type: "photo" | "project" | "career" | "idea" | "article";
  title: string;
  desc: string;
  badge: string;
  badgeLabel: string;
  link: string;
  image?: string;
  date: string;
  sortDate: string; // ISO for sorting
};

export async function buildFeed(userId: string, username?: string): Promise<FeedItem[]> {
  const supabase = await createClient();
  const items: FeedItem[] = [];

  // ── Photos disabled: images are gitignored (213MB) and not deployed ──
  // TODO: re-enable when photos are hosted externally (e.g. Cloudinary / S3)

  // ── Projects (from Supabase) ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: projects } = await (supabase as any)
    .from("projects")
    .select("id, title, description, status, status_color")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true }) as { data: Array<{ id: string; title: string; description: string | null; status: string; status_color: string }> | null };

  (projects ?? []).forEach((proj) => {
    items.push({
      id: `project-${proj.id}`,
      type: "project",
      title: proj.title,
      desc: (proj.description ?? "").slice(0, 80) + ((proj.description ?? "").length > 80 ? "…" : ""),
      badge: proj.status === "Building" ? "badge-orange" : "badge-green",
      badgeLabel: proj.status === "Building" ? "Building" : "Project",
      link: "/projects",
      date: proj.status,
      sortDate: "2025-06-01", // projects don't have dates, keep them mid-tier
    });
  });

  // ── Career highlights (latest 2 companies from Supabase) ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: companies } = await (supabase as any)
    .from("companies")
    .select("id, name, type, role_title, role_dates, sub_line, blurb_left, sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .limit(2) as { data: Array<{ id: string; name: string; type: string; role_title: string | null; role_dates: string | null; sub_line: string | null; blurb_left: { content?: string } | null; sort_order: number }> | null };

  for (const co of companies ?? []) {
    let role = co.role_title ?? "";
    const dates = co.type === "single" ? co.role_dates : co.sub_line;

    // For multi-role companies, get the latest role
    if (co.type === "multi") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: latestRole } = await (supabase as any)
        .from("company_roles")
        .select("role")
        .eq("company_id", co.id)
        .order("sort_order", { ascending: false })
        .limit(1)
        .single() as { data: { role: string } | null };
      role = latestRole?.role ?? "";
    }

    const blurbContent = (co.blurb_left as { content?: string } | null)?.content ?? "";

    items.push({
      id: `career-${co.id}`,
      type: "career",
      title: co.name,
      desc: role || blurbContent.slice(0, 80) + "…",
      badge: "badge-blue",
      badgeLabel: "Career",
      link: "/professional",
      date: dates || "",
      sortDate: co.type === "single" && co.role_dates
        ? `${co.role_dates.split("–")[0].trim().split(" ")[0]}-01-01`
        : "2020-01-01",
    });
  }

  // ── Published writings ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: writings } = await (supabase as any)
    .from("writings")
    .select("id, title, slug, word_count, published_at, image_url")
    .eq("user_id", userId)
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(8) as { data: Array<{ id: string; title: string; slug: string; word_count: number | null; published_at: string; image_url: string | null }> | null };

  (writings ?? []).forEach((w) => {
    const wordCount = w.word_count ?? 0;
    const readingTime = wordCount > 0 ? `${Math.ceil(wordCount / 200)} min read` : "";
    items.push({
      id: `writing-${w.id}`,
      type: "article",
      title: w.title,
      desc: readingTime,
      badge: "badge-blue",
      badgeLabel: "Writing",
      link: username ? `/${username}/writings/${w.slug}` : `/writings/${w.slug}`,
      image: w.image_url ?? undefined,
      date: w.published_at,
      sortDate: w.published_at,
    });
  });

  // Sort by date descending, pick the most recent 10
  items.sort((a, b) => b.sortDate.localeCompare(a.sortDate));
  return items.slice(0, 10);
}
