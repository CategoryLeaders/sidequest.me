import { notFound } from "next/navigation";
import { getProfileByUsername } from "@/lib/profiles";
import AboutContent from "./AboutContent";
import type { Factoid, LikeDislike } from "@/types/profile-extras";

/**
 * About page — data-driven from the profiles table.
 * Falls back to empty state when the user hasn't set anything up yet.
 * [SQ.S-W-2603-0039] [SQ.S-W-2603-0040] [SQ.S-W-2603-0041]
 */

interface AboutPageProps {
  params: Promise<{ username: string }>;
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  return (
    <AboutContent
      displayName={profile.display_name ?? username}
      aboutBio={profile.about_bio ?? null}
      factoids={(profile.factoids as Factoid[] | null) ?? []}
      likes={(profile.likes as LikeDislike[] | null) ?? []}
      dislikes={(profile.dislikes as LikeDislike[] | null) ?? []}
    />
  );
}
