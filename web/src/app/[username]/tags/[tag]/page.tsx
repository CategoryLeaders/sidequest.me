import { notFound } from "next/navigation";
import Link from "next/link";
import { getProfileByUsername, getCurrentUserProfile } from "@/lib/profiles";
import { type SiteTag, DEFAULT_SITE_TAGS, tagBySlug } from "@/lib/tags";
import PhotowallGrid from "@/app/[username]/photowall/PhotowallGrid";

/**
 * Tag filter page — /[username]/tags/[tag]
 * Shows all content (currently: photos) tagged with the given label.
 * [SQ.S-W-2603-0055]
 */

interface Props {
  params: Promise<{ username: string; tag: string }>;
}

export default async function TagPage({ params }: Props) {
  const { username, tag: tagSlug } = await params;

  const [profile, currentUserProfile] = await Promise.all([
    getProfileByUsername(username),
    getCurrentUserProfile(),
  ]);

  if (!profile) notFound();

  // Resolve slug → label from profile's site_tags (fall back to defaults)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const siteTags: SiteTag[] =
    ((profile as any).site_tags as SiteTag[] | null)?.filter(
      (t) => t?.label?.trim()
    ) ?? DEFAULT_SITE_TAGS;

  const matchedTag = tagBySlug(siteTags, tagSlug);
  if (!matchedTag) notFound();

  const isOwner = currentUserProfile?.id === profile.id;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="max-w-[1400px] mx-auto px-4 pt-6 pb-2 flex items-center gap-2 font-mono text-[0.72rem] opacity-60">
        <Link href={`/${username}`} className="hover:opacity-100 no-underline text-ink">
          {username}
        </Link>
        <span>›</span>
        <Link href={`/${username}/photowall`} className="hover:opacity-100 no-underline text-ink">
          photowall
        </Link>
        <span>›</span>
        <span className="opacity-100">#{matchedTag.label}</span>
      </div>

      {/* Filtered photowall */}
      <PhotowallGrid
        userId={profile.id}
        username={profile.username}
        isOwner={isOwner}
        filterTag={matchedTag.label}
      />
    </div>
  );
}
