"use client";

/**
 * Client component for the About page — tabs, bio with link rendering, factoids, loves/hates.
 * [SQ.S-W-2603-0039] [SQ.S-W-2603-0040] [SQ.S-W-2603-0041]
 */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { Factoid, LikeDislike } from "@/types/profile-extras";

const tabs = ["Bio", "Loves & Hates"] as const;
type Tab = (typeof tabs)[number];

const tabColors = ["sticker-orange", "sticker-pink"];

interface CrowdfundingCardData {
  title: string;
  autoScroll: boolean;
  projects: { id: string; title: string; slug: string; image_url: string | null }[];
  username: string;
}

interface AboutContentProps {
  displayName: string;
  aboutBio: string | null;
  factoids: Factoid[];
  /** Total number of saved factoids (may be > factoids.length when randomising) */
  totalFactoids: number;
  likes: LikeDislike[];
  dislikes: LikeDislike[];
  crowdfunding?: CrowdfundingCardData;
}

/**
 * Renders text with markdown-style [text](url) links converted to <a> tags.
 * Also respects paragraph breaks (double newline).
 */
function renderBioText(text: string) {
  const paragraphs = text.split(/\n\s*\n/);

  return paragraphs.map((para, pi) => {
    // Split on markdown links [text](url)
    const parts = para.split(/(\[[^\]]+\]\([^)]+\))/g);
    const rendered = parts.map((part, i) => {
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        return (
          <a
            key={i}
            href={linkMatch[2]}
            className="underline font-bold"
            target="_blank"
            rel="noopener noreferrer"
          >
            {linkMatch[1]}
          </a>
        );
      }
      return part;
    });

    return (
      <p key={pi}>
        {rendered}
      </p>
    );
  });
}

/** Horizontal carousel of crowdfunding project thumbnails for the About page. */
function CrowdfundingCarousel({
  title,
  autoScroll,
  projects,
  username,
}: CrowdfundingCardData) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };

  // Auto-scroll effect
  useEffect(() => {
    if (!autoScroll) return;
    const el = scrollRef.current;
    if (!el) return;

    const interval = setInterval(() => {
      // If we've reached the end, scroll back to start
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 200, behavior: "smooth" });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [autoScroll]);

  // Update button visibility on mount & scroll
  useEffect(() => {
    updateScrollButtons();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    return () => el.removeEventListener("scroll", updateScrollButtons);
  }, []);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -260 : 260, behavior: "smooth" });
  };

  const rotations = ["-0.8deg", "0.6deg", "-0.4deg", "0.9deg", "-0.6deg", "0.3deg"];

  return (
    <section className="mt-12 pt-8 border-t-3 border-ink/10">
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <h2
          className="font-head font-[900] text-[clamp(1rem,2.5vw,1.4rem)] uppercase leading-tight"
          style={{ transform: "rotate(-0.3deg)" }}
        >
          {title}
        </h2>
        <Link
          href={`/${username}/projects?tab=backed`}
          className="font-mono text-[0.65rem] font-semibold uppercase text-orange no-underline opacity-60 hover:opacity-100 transition-opacity"
        >
          View all →
        </Link>
      </div>

      {/* Carousel wrapper */}
      <div className="relative">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-ink text-bg border-2 border-ink flex items-center justify-center cursor-pointer hover:bg-ink/80 transition-colors"
            style={{ transform: "translateY(-50%) rotate(-1deg)" }}
            aria-label="Scroll left"
          >
            ←
          </button>
        )}

        {/* Scrollable track */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {projects.map((project, i) => (
            <Link
              key={project.id}
              href={`/${username}/projects?tab=backed`}
              className="flex-shrink-0 no-underline group"
              style={{ scrollSnapAlign: "start" }}
            >
              <div
                className="w-[140px] border-3 border-ink bg-bg-card overflow-hidden card-hover"
                style={{ transform: `rotate(${rotations[i % rotations.length]})` }}
              >
                {project.image_url ? (
                  <div className="w-full h-[100px] overflow-hidden">
                    <img
                      src={project.image_url}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ) : (
                  <div className="w-full h-[100px] bg-ink/5 flex items-center justify-center">
                    <span className="font-mono text-[0.5rem] opacity-30 uppercase">No image</span>
                  </div>
                )}
                <div className="px-2.5 py-2">
                  <p className="font-head font-bold text-[0.6rem] uppercase leading-tight line-clamp-2">
                    {project.title}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-ink text-bg border-2 border-ink flex items-center justify-center cursor-pointer hover:bg-ink/80 transition-colors"
            style={{ transform: "translateY(-50%) rotate(1deg)" }}
            aria-label="Scroll right"
          >
            →
          </button>
        )}
      </div>
    </section>
  );
}

export default function AboutContent({
  displayName,
  aboutBio,
  factoids,
  totalFactoids,
  likes,
  dislikes,
  crowdfunding,
}: AboutContentProps) {
  const [active, setActive] = useState<Tab>("Bio");

  const firstName = displayName.split(/\s/)[0];

  const hasLovesHates = likes.length > 0 || dislikes.length > 0;

  return (
    <main className="max-w-[1100px] mx-auto px-8 py-12 relative">
      <div
        className="doodle doodle-circle"
        style={{ width: 100, height: 100, top: 30, right: -20 }}
      />

      {/* Header */}
      <h1 className="font-head font-[900] text-[clamp(1.8rem,4vw,2.8rem)] uppercase leading-[0.95] mb-6">
        About {firstName}
      </h1>

      {/* Tabs — only show if there's content for loves/hates */}
      {hasLovesHates && (
        <div className="flex gap-2.5 mb-8 flex-wrap">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`sticker ${active === tab ? "bg-ink !text-bg" : tabColors[i]} cursor-pointer`}
              style={{
                transform: `rotate(${i === 0 ? "-0.5deg" : "0.7deg"})`,
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* ── BIO TAB ── */}
      {active === "Bio" && (
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8">
          <div className="flex flex-col gap-4 text-[0.95rem] leading-relaxed">
            {aboutBio ? (
              renderBioText(aboutBio)
            ) : (
              <p className="opacity-50 italic">
                No bio yet. Edit this in Profile Settings → About.
              </p>
            )}
          </div>

          {factoids.length > 0 && (
            <div className="flex flex-col gap-4">
              {factoids.map((f, i) => (
                <div
                  key={`${f.category}-${i}`}
                  className="border-3 border-ink p-4 bg-bg-card"
                  style={{
                    transform: `rotate(${i % 4 === 0 ? "-1deg" : i % 4 === 1 ? "0.5deg" : i % 4 === 2 ? "-0.7deg" : "0.4deg"})`,
                  }}
                >
                  <div className="text-2xl mb-1">{f.emoji}</div>
                  <div className="font-mono text-[0.65rem] opacity-50 uppercase">
                    {f.category}
                  </div>
                  <div className="font-head font-bold text-[1.1rem]">
                    {f.value}
                  </div>
                </div>
              ))}
              {totalFactoids > factoids.length && (
                <p className="font-mono text-[0.62rem] opacity-35 text-center mt-1">
                  {factoids.length} of {totalFactoids} · refreshes each visit
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── LOVES & HATES TAB ── */}
      {active === "Loves & Hates" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {likes.length > 0 && (
            <div>
              <div className="section-title">Loves 💚</div>
              <div className="flex flex-col gap-3">
                {likes.map((item, i) => (
                  <div
                    key={`${item.text}-${i}`}
                    className="border-3 border-ink px-4 py-3 flex items-center gap-3 bg-bg-card"
                    style={{
                      transform: `rotate(${i % 2 === 0 ? "-0.3deg" : "0.3deg"})`,
                    }}
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-[0.88rem]">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {dislikes.length > 0 && (
            <div>
              <div className="section-title">Hates 😤</div>
              <div className="flex flex-col gap-3">
                {dislikes.map((item, i) => (
                  <div
                    key={`${item.text}-${i}`}
                    className="border-3 border-ink px-4 py-3 flex items-center gap-3 bg-bg-card"
                    style={{
                      transform: `rotate(${i % 2 === 0 ? "0.3deg" : "-0.3deg"})`,
                    }}
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-[0.88rem]">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {likes.length === 0 && dislikes.length === 0 && (
            <p className="opacity-50 italic col-span-2">
              Nothing here yet. Add your loves &amp; hates in Profile Settings.
            </p>
          )}
        </div>
      )}

      {/* ── CROWDFUNDING CARD ── */}
      {crowdfunding && crowdfunding.projects.length > 0 && (
        <CrowdfundingCarousel
          title={crowdfunding.title}
          autoScroll={crowdfunding.autoScroll}
          projects={crowdfunding.projects}
          username={crowdfunding.username}
        />
      )}
    </main>
  );
}
