import { notFound } from "next/navigation";
import { getProfileByUsername } from "@/lib/profiles";
import AboutContent from "./AboutContent";
import type { Factoid, LikeDislike } from "@/types/profile-extras";
import { getPublishedCrowdfundingProjects } from "@/lib/crowdfunding";

/**
 * About page — data-driven from the profiles table.
 * V2: Supports configurable tile types via about_tiles JSONB.
 * Falls back to legacy crowdfunding_enabled behaviour when about_tiles is empty.
 * [SQ.S-W-2603-0039] [SQ.S-W-2603-0040] [SQ.S-W-2603-0041] [SQ.S-W-2603-0051] [SQ.S-W-2603-0079]
 */

export const dynamic = "force-dynamic";

interface AboutPageProps {
  params: Promise<{ username: string }>;
}

const FACTOID_DISPLAY_LIMIT = 5;

/** Fisher-Yates shuffle — returns a new shuffled array */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** About tile type from the JSONB column */
interface AboutTile {
  id: string;
  tile_type: "static" | "crowdfunding" | "adventures";
  title: string;
  image_url?: string;
  link_url?: string;
  description?: string;
  sort_order?: number;
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  const allFactoids = (profile.factoids as Factoid[] | null) ?? [];
  const totalFactoids = allFactoids.length;

  const displayedFactoids =
    allFactoids.length > FACTOID_DISPLAY_LIMIT
      ? shuffleArray(allFactoids).slice(0, FACTOID_DISPLAY_LIMIT)
      : allFactoids;

  // Read about_tiles from profile
  const aboutTiles = ((profile as Record<string, unknown>).about_tiles as AboutTile[] | null) ?? [];

  // Legacy fallback: if about_tiles is empty, use crowdfunding_enabled flags
  const crowdfundingEnabled = (profile as Record<string, unknown>).crowdfunding_enabled as boolean ?? false;
  const crowdfundingTitle = (profile as Record<string, unknown>).crowdfunding_title as string ?? "Weird Projects I Backed";
  const crowdfundingCarouselAuto = (profile as Record<string, unknown>).crowdfunding_carousel_auto as boolean ?? false;

  // Determine if we need crowdfunding data
  const hasCrowdfundingTile = aboutTiles.some((t) => t.tile_type === "crowdfunding");
  const needsCrowdfunding = hasCrowdfundingTile || (aboutTiles.length === 0 && crowdfundingEnabled);

  let crowdfundingProjects: { id: string; title: string; slug: string; image_url: string | null }[] = [];
  if (needsCrowdfunding) {
    const allBacked = await getPublishedCrowdfundingProjects(profile.id);
    crowdfundingProjects = allBacked.slice(0, 15).map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      image_url: p.image_url,
    }));
  }

  // Build tile data for the component
  // If about_tiles is configured, use it. Otherwise, fall back to legacy behaviour.
  const useTiles = aboutTiles.length > 0;
  const crowdfundingTileTitle = hasCrowdfundingTile
    ? (aboutTiles.find((t) => t.tile_type === "crowdfunding")?.title ?? crowdfundingTitle)
    : crowdfundingTitle;

  return (
    <AboutContent
      displayName={profile.display_name ?? username}
      aboutBio={profile.about_bio ?? null}
      factoids={displayedFactoids}
      totalFactoids={totalFactoids}
      likes={(profile.likes as LikeDislike[] | null) ?? []}
      dislikes={(profile.dislikes as LikeDislike[] | null) ?? []}
      crowdfunding={needsCrowdfunding && crowdfundingProjects.length > 0 ? {
        title: crowdfundingTileTitle,
        autoScroll: crowdfundingCarouselAuto,
        projects: crowdfundingProjects,
        username,
      } : undefined}
      aboutTiles={useTiles ? aboutTiles : undefined}
    />
  );
}
