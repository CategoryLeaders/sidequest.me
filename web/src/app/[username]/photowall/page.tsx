import { getProfileByUsername, getCurrentUserProfile } from "@/lib/profiles";
import { notFound } from "next/navigation";
import PhotowallGrid from "./PhotowallGrid";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function PhotowallPage({ params }: Props) {
  const { username } = await params;
  const [profile, currentUserProfile] = await Promise.all([
    getProfileByUsername(username),
    getCurrentUserProfile(),
  ]);
  if (!profile) notFound();

  const isOwner = currentUserProfile?.id === profile.id;

  return <PhotowallGrid userId={profile.id} username={profile.username} isOwner={isOwner} />;
}
