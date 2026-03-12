import { notFound } from "next/navigation";
import { getProfileByUsername } from "@/lib/profiles";
import AboutContent from "./AboutContent";
import type { Factoid, LikeDislike } from "@/types/profile-extras";

/**
 * About page — data-driven from the profiles table.
 * Falls back to empty state when the user hasn't set anything up yet.
 * force-dynamic: prevent Vercel full-route caching so settings changes appear immediately.
 * [SQ.S-W-2603-0039] [SQ.S-W-2603-0040] [SQ.S-W-2603-0041] [SQ.S-W-2603-0051]
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

export default async function AboutPage({ params }: AboutPageProps) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  const allFactoids = (profile.factoids as Factoid[] | null) ?? [];
  const totalFactoids = allFactoids.length;

  // If more than the display limit, randomly select FACTOID_DISPLAY_LIMIT to show [SQ.S-W-2603-0052]
  const displayedFactoids =
    allFactoids.length > FACTOID_DISPLAY_LIMIT
      ? shuffleArray(allFactoids).slice(0, FACTOID_DISPLAY_LIMIT)
      : allFactoids;

  return (
    <AboutContent
      displayName={profile.display_name ?? username}
      aboutBio={profile.about_bio ?? null}
      factoids={displayedFactoids}
      totalFactoids={totalFactoids}
      likes={(profile.likes as LikeDislike[] | null) ?? []}
      dislikes={(profile.dislikes as LikeDislike[] | null) ?? []}
    />
  );
}
