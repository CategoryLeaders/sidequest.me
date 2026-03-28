/* ── microblogs-utils — client-safe display helpers ── */
/* No server imports — safe to use in client components  */

interface PostDateFields {
  source_created_at: string | null;
  published_at: string | null;
  created_at: string;
}

/** Display timestamp for a post (uses source_created_at for imports) */
export function getPostDate(post: PostDateFields): string {
  return post.source_created_at ?? post.published_at ?? post.created_at;
}

/** Relative time display (e.g. "2h ago", "3 days ago") */
export function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: diffDays > 365 ? "numeric" : undefined,
  });
}
