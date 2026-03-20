import Link from "next/link";
import { notFound } from "next/navigation";
import { posts } from "@/lib/photowall-data";
import { photowallUrl } from "@/lib/cdn";
import { buildFeed, type FeedItem } from "@/lib/feed-data";
import { getWhatsNewFeed, type WhatsNewItem } from "@/lib/whats-new";
import { getProfileByUsername, getCurrentUser } from "@/lib/profiles";
import WhatsNewFeed from "./WhatsNewFeed";
import {
  type SiteTag,
  type SiteTagsDisplay,
  DEFAULT_SITE_TAGS,
  DEFAULT_SITE_TAGS_DISPLAY,
  slugify,
  applyDisplaySettings,
} from "@/lib/tags";
import { createClient } from "@/lib/supabase/server";

const latestPhoto = posts[0];

/** Fallback ticker items used only if profile has no ticker_items set in DB */
const DEFAULT_TICKER_ITEMS = [
  "Sr. Director PMM at Hack The Box",
  "20+ years in tech",
  "Surrey-based",
  "Product → Marketing → Leadership",
  "Patent holder",
  "Next.js enthusiast",
  "Always a sidequest in progress",
];


interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  // Both calls are React.cache-deduped — no extra DB round-trips vs layout
  const [profile, user] = await Promise.all([
    getProfileByUsername(username),
    getCurrentUser(),
  ]);

  if (!profile) notFound();

  // Try feed_events first; fall back to legacy buildFeed
  const whatsNew = await getWhatsNewFeed(profile.id, username, { limit: 6 });
  const legacyFeed = whatsNew.length === 0 ? await buildFeed(profile.id) : null;

  // Convert legacy FeedItems → WhatsNewItems so the new layout always renders
  const legacyTypeIcon: Record<string, string> = { photo: "📸", project: "🚀", career: "💼", idea: "💡", article: "✍️" };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const legacyAsWhatsNew: WhatsNewItem[] = (legacyFeed ?? []).map((item: FeedItem, i: number) => ({
    id: item.id,
    eventType: (item.type === "project" ? "project_created" : item.type === "career" ? "career_updated" : "microblog_published") as WhatsNewItem["eventType"],
    objectId: item.id,
    objectType: item.type,
    publishedAt: item.sortDate || new Date(Date.now() - i * 86_400_000).toISOString(),
    title: item.title,
    description: item.desc,
    link: item.link,
    badge: item.badge,
    badgeLabel: item.badgeLabel,
    icon: legacyTypeIcon[item.type] ?? "📌",
    imageUrl: item.image,
  }));

  // Combined feed: prefer feed_events, fall back to legacy
  const feedItems = whatsNew.length > 0 ? whatsNew : legacyAsWhatsNew;

  const isOwner = user?.id === profile.id;

  // Use DB values where set, fall back to Sophie's static copy
  const displayName = profile.display_name ?? "Sophie Collins builds things & tells their story";
  const bio = profile.bio ?? "Product leader turned product marketer. 20+ years taking enterprise software to market — from code to customer. This is my corner of the internet.";
  const avatarUrl = profile.avatar_url;
  const tickerItems = (profile.ticker_items && profile.ticker_items.length > 0)
    ? profile.ticker_items
    : DEFAULT_TICKER_ITEMS;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawSiteTags: SiteTag[] = ((profile as any).site_tags as SiteTag[] | null)?.filter(
    (t) => t?.label?.trim()
  ) ?? DEFAULT_SITE_TAGS;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const siteTagsDisplay: SiteTagsDisplay =
    ((profile as any).site_tags_display as SiteTagsDisplay | null) ?? DEFAULT_SITE_TAGS_DISPLAY;

  // For 'volume' mode, count how many photos carry each tag label
  let volumeMap: Record<string, number> | undefined
  if (siteTagsDisplay.mode === "volume") {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: photoRows } = await (supabase as any)
      .from("photos")
      .select("tags")
      .eq("user_id", profile.id)
      .not("tags", "is", null) as { data: { tags: string[] | null }[] | null }
    volumeMap = {}
    for (const row of photoRows ?? []) {
      for (const tag of row.tags ?? []) {
        volumeMap[tag] = (volumeMap[tag] ?? 0) + 1
      }
    }
  }

  const siteTags = applyDisplaySettings(rawSiteTags, siteTagsDisplay, volumeMap);

  return (
    <main className="max-w-[1100px] mx-auto px-8 py-12 relative">
      {/* Decorative doodles */}
      <div className="doodle doodle-circle" style={{ width: 120, height: 120, top: 40, right: -30 }} />
      <div className="doodle" style={{ width: 80, height: 80, bottom: 200, left: -20 }} />

      {/* ── HERO ── */}
      <section className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-10 mb-14 relative z-1">
        <div>
          {/* Own-profile edit button */}
          {isOwner && (
            <div className="mb-4">
              <Link
                href={`/${username}/settings`}
                className="inline-block px-3.5 py-1.5 border-3 border-ink font-head font-bold text-[0.68rem] uppercase no-underline text-ink hover:bg-ink hover:text-bg transition-colors"
              >
                ✏️ Edit profile
              </Link>
            </div>
          )}

          {/* Avatar — shown if set in DB */}
          {avatarUrl && (
            <div className="mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl}
                alt={`${username}'s avatar`}
                className="w-16 h-16 rounded-full border-3 border-ink object-cover"
              />
            </div>
          )}

          <h1 className="font-head font-[900] text-[clamp(2rem,5vw,3.4rem)] uppercase leading-[0.92] mb-5">
            {displayName}
          </h1>
          <p className="text-[1.05rem] leading-relaxed mb-6 max-w-[540px] opacity-80">
            {bio}
          </p>
          <div className="flex flex-wrap gap-2.5">
            {siteTags.map((s) => (
              <Link
                key={s.label}
                href={`/${username}/tags/${slugify(s.label)}`}
                className={`sticker ${s.color} no-underline`}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        <div
          className="hidden md:block border-3 border-ink bg-bg-card p-2.5"
          style={{ transform: "rotate(1.5deg)", boxShadow: "5px 5px 0 var(--ink)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photowallUrl(latestPhoto.images[0])}
            alt={latestPhoto.caption}
            className="w-full h-52 object-cover"
          />
          <p className="font-mono text-[0.7rem] text-center mt-2 opacity-60">
            📸 {latestPhoto.caption.slice(0, 60)}{latestPhoto.caption.length > 60 ? "…" : ""}
          </p>
        </div>
      </section>

      {/* ── WHAT'S NEW FEED ── */}
      <section className="mb-14">
        <div className="section-title">What&apos;s New</div>

        {/* Single-column editorial stream — max 680px centred */}
        <div className="mx-auto" style={{ maxWidth: 680 }}>
          <WhatsNewFeed initialItems={feedItems} username={username} />
        </div>
      </section>

      {/* ── TICKER — only rendered when enabled ── */}
      {profile.ticker_enabled !== false && (
        <div className="border-y-3 border-ink py-3 overflow-hidden">
          <div
            className="flex whitespace-nowrap font-mono text-[0.78rem] uppercase gap-0"
            style={{ animation: "scroll 25s linear infinite" }}
          >
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i} className="px-6">
                {item} ✦
              </span>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
