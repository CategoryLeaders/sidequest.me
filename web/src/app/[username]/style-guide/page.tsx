/* ── Style Guide — living design system reference ── */

import { notFound, redirect } from "next/navigation";
import { getProfileByUsername, getCurrentUser } from "@/lib/profiles";
import { StyleGuideClient } from "./StyleGuideClient";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function StyleGuidePage({ params }: Props) {
  const { username } = await params;

  const [profile, user] = await Promise.all([
    getProfileByUsername(username),
    getCurrentUser(),
  ]);

  if (!profile) notFound();
  if (!user || user.id !== profile.id) redirect(`/${username}`);

  return (
    <main className="max-w-[1100px] mx-auto px-8 py-12">
      <div className="mb-10">
        <h1 className="font-head font-[900] text-[2rem] uppercase leading-tight mb-1">
          Style Guide
        </h1>
        <p className="font-mono text-[var(--text-sm)] opacity-60">
          Living design system for sidequest.me — visual reference &amp; component library
        </p>
      </div>
      <StyleGuideClient username={username} />
    </main>
  );
}
