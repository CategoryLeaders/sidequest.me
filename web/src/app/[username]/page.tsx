import Link from "next/link";
import { notFound } from "next/navigation";
import { posts } from "@/lib/photowall-data";
import { photowallUrl } from "@/lib/cdn";
import { buildFeed } from "@/lib/feed-data";
import { getProfileByUsername, getCurrentUser } from "@/lib/profiles";

const latestPhoto = posts[0];

// Static fallbacks for Sophie's content (replace with DB-driven content in future sprint)
const stickers = [
  { label: "Product", color: "sticker-orange" },
  { label: "Marketing", color: "sticker-green" },
  { label: "Writing", color: "sticker-blue" },
  { label: "Cybersecurity", color: "sticker-yellow" },
  { label: "Side Projects", color: "sticker-lilac" },
];

const tickerItems = [
  "Sr. Director PMM at Hack The Box",
  "20+ years in tech",
  "Surrey-based",
  "Product → Marketing → Leadership",
  "Patent holder",
  "Next.js enthusiast",
  "Always a sidequest in progress",
];

const feedRotations = ["-0.3deg", "0.4deg", "-0.2deg", "0.5deg", "-0.4deg", "0.3deg"];

const badgeCircleColor: Record<string, string> = {
  "badge-orange": "var(--orange)",
  "badge-green": "var(--green)",
  "badge-blue": "var(--blue)",
  "badge-pink": "var(--pink)",
  "badge-yellow": "var(--yellow)",
  "badge-lilac": "var(--lilac)",
};

const typeIcons: Record<string, string> = {
  photo: "📸",
  project: "🚀",
  career: "💼",
  idea: "💡",
  article: "✍️",
};

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const feed = buildFeed();

  // Both calls are React.cache-deduped — no extra DB round-trips vs layout
  const [profile, user] = await Promise.all([
    getProfileByUsername(username),
    getCurrentUser(),
  ]);

  if (!profile) notFound();

  const isOwner = user?.id === profile.id;

  // Use DB values where set, fall back to Sophie's static copy
  const displayName = profile.display_name ?? "Sophie Collins builds things & tells their story";
  const bio = profile.bio ?? "Product leader turned product marketer. 20+ years taking enterprise software to market — from code to customer. This is my corner of the internet.";
  const avatarUrl = profile.avatar_url;

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
            {stickers.map((s) => (
              <span key={s.label} className={`sticker ${s.color}`}>
                {s.label}
              </span>
            ))}
          </div>
        </div>

        <div
          className="hidden md:block border-3 border-ink bg-white p-2.5"
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

      {/* ── AGGREGATED FEED ── */}
      <section className="mb-14">
        <div className="section-title">What&apos;s New</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {feed.map((item, i) => (
            <Link
              key={item.id}
              href={item.link}
              className="block border-3 border-ink bg-white card-hover no-underline text-ink overflow-visible relative"
              style={{ transform: `rotate(${feedRotations[i % feedRotations.length]})` }}
            >
              <span
                className="absolute -top-3.5 -left-3.5 z-10 inline-flex items-center justify-center w-[32px] h-[32px] rounded-full border-3 border-ink text-white font-head font-[900] text-[0.75rem] leading-none"
                style={{
                  backgroundColor: badgeCircleColor[item.badge] || "var(--orange)",
                  boxShadow: "1px 1px 0 var(--ink)",
                }}
              >
                {i + 1}
              </span>
              <span className="absolute top-1.5 left-7 font-mono text-[0.58rem] text-white/90 leading-none whitespace-nowrap z-10" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.7)" }}>
                {item.date}
              </span>

              {item.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-28 object-cover border-b-3 border-ink"
                />
              )}
              <div className="p-5 pt-4 relative">
                <span className={`badge ${item.badge} absolute top-3 right-3`}>
                  {typeIcons[item.type]} {item.badgeLabel}
                </span>
                <h3 className="font-head font-bold text-[0.95rem] uppercase mt-1 mb-1.5 leading-tight">
                  {item.title}
                </h3>
                <p className="text-[0.82rem] opacity-70 leading-snug">
                  {item.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── TICKER ── */}
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
    </main>
  );
}
