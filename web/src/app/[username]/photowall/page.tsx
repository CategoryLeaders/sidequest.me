import { getProfileByUsername } from "@/lib/profiles";
import { notFound } from "next/navigation";
import PhotowallGrid from "./PhotowallGrid";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function PhotowallPage({ params }: Props) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  return <PhotowallGrid />;
}
