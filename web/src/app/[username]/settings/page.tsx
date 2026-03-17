import { notFound, redirect } from "next/navigation";
import { getProfileByUsername, getCurrentUser } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";
import SettingsForm from "./SettingsForm";

interface SettingsPageProps {
  params: Promise<{ username: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { username } = await params;

  const [profile, user] = await Promise.all([
    getProfileByUsername(username),
    getCurrentUser(),
  ]);

  // Should be caught by middleware, but belt-and-suspenders
  if (!user) {
    redirect(`/login?next=/${username}/settings`);
  }

  if (!profile) {
    notFound();
  }

  // Can only edit your own profile
  if (user.id !== profile.id) {
    redirect(`/${username}`);
  }

  // Fetch all distinct tags used across this user's writings
  const supabase = await createClient();
  const { data: writings } = await (supabase as any)
    .from("writings")
    .select("tags")
    .eq("user_id", profile.id) as { data: { tags: string[] }[] | null };

  const writingTags = Array.from(
    new Set((writings ?? []).flatMap((w) => w.tags ?? []))
  ).sort();

  return (
    <main className="max-w-[680px] mx-auto px-8 py-12">
      <div className="mb-8">
        <h1 className="font-head font-[900] text-[2rem] uppercase leading-tight mb-1">
          Manage my Sidequests
        </h1>
        <p className="font-mono text-[0.78rem] opacity-60">@{username}</p>
      </div>

      <SettingsForm profile={profile} writingTags={writingTags} />
    </main>
  );
}
