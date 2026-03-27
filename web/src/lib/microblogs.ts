/* ── Microblog Types & Data Access ── [SQ.S-W-2603-0062] */

import { createClient } from "@/lib/supabase/server";

// ─── Types ──────────────────────────────────────────────────────────────────

export type MicroblogVisibility = "public" | "unlisted" | "private";
export type MicroblogStatus = "draft" | "scheduled" | "published";
export type MicroblogSource =
  | "native"
  | "facebook_import"
  | "telegram_channel_import"
  | "telegram_group_import"
  | "adventure_import";

export interface MicroblogImage {
  url: string;
  width: number;
  height: number;
  alt_text?: string;
  storage_path?: string;
  /** Marks this image as the featured/hero image for the post */
  starred?: boolean;
}

export interface LinkPreview {
  title: string;
  description: string;
  image?: string;
  domain: string;
}

export type MicroblogPostType = 'standard' | 'changelog';

export interface ChangelogItem {
  text: string;
  image?: { url: string; storage_path?: string };
}

export interface MicroblogPost {
  id: string;
  profile_id: string;
  short_id: string;
  post_type: MicroblogPostType;
  title: string | null;
  changelog_items: ChangelogItem[] | null;
  body: string;
  body_html: string | null;
  images: MicroblogImage[];
  link_url: string | null;
  link_preview: LinkPreview | null;
  tags: string[];
  visibility: MicroblogVisibility;
  status: MicroblogStatus;
  reactions_enabled: boolean;
  comments_enabled: boolean;
  pinned: boolean;
  pinned_order: number | null;
  source: MicroblogSource;
  source_url: string | null;
  source_created_at: string | null;
  paired_writing_id: string | null;
  context_type: 'adventure' | 'project' | 'writing' | 'job_role' | null;
  context_id: string | null;
  location_name: string | null;
  chapter_index: number | null;
  edited_at: string | null;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MicroblogReaction {
  id: string;
  post_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export type CommenterType = "live" | "anonymous_import" | "orphaned";
export type CommentStatus = "visible" | "hidden" | "deleted";

export interface MicroblogComment {
  id: string;
  post_id: string | null;
  parent_comment_id: string | null;
  user_id: string | null;
  anonymous_name: string | null;
  anonymous_avatar: string | null;
  body: string;
  commenter_type: CommenterType;
  status: CommentStatus;
  created_at: string;
  updated_at: string;
}

export interface MiniProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  email: string;
  created_at: string;
}

// Reaction counts aggregated per emoji
export interface ReactionCount {
  emoji: string;
  count: number;
}

// Post with engagement counts for feed display
export interface MicroblogPostWithCounts extends MicroblogPost {
  reaction_counts: ReactionCount[];
  comment_count: number;
  paired_writing_slug: string | null;
}

// ─── External API Types ─────────────────────────────────────────────────

export interface MicroblogApiItem {
  id: string
  short_id: string
  post_type: MicroblogPostType
  title: string | null
  changelog_items: ChangelogItem[] | null
  body: string
  tags: string[]
  images: MicroblogImage[]
  published_at: string
  location_name: string | null
  body_html?: string // only included when ?fields=body
}

export interface MicroblogApiMeta {
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface MicroblogApiResponse {
  data: MicroblogApiItem[]
  meta: MicroblogApiMeta
}

// ─── Short ID Generation ────────────────────────────────────────────────

const SHORT_ID_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
const SHORT_ID_LENGTH = 4;

export function generateShortId(): string {
  let result = "";
  for (let i = 0; i < SHORT_ID_LENGTH; i++) {
    result += SHORT_ID_CHARS.charAt(
      Math.floor(Math.random() * SHORT_ID_CHARS.length)
    );
  }
  return result;
}

// ─── Data Fetching (Server) ─────────────────────────────────────────────

/**
 * Fetch published microblog posts for a profile's public feed.
 * Returns posts with reaction counts and comment counts.
 */
export async function getPublishedPosts(
  profileId: string,
  options: { limit?: number; offset?: number; tag?: string } = {}
): Promise<MicroblogPostWithCounts[]> {
  const { limit = 20, offset = 0, tag } = options;
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("microblog_posts")
    .select("*, paired_writing:writings!paired_writing_id(slug)")
    .eq("profile_id", profileId)
    .eq("status", "published")
    .eq("visibility", "public")
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (tag) {
    query = query.contains("tags", [tag]);
  }

  const { data: posts, error } = await query;
  if (error || !posts) return [];

  // Fetch reaction counts and comment counts in parallel
  const postsWithCounts = await Promise.all(
    (posts as (MicroblogPost & { paired_writing: { slug: string } | null })[]).map(async (post) => {
      const [reactionCounts, commentCount] = await Promise.all([
        getReactionCounts(post.id),
        getCommentCount(post.id),
      ]);
      return {
        ...post,
        images: (post.images ?? []) as MicroblogImage[],
        link_preview: post.link_preview as LinkPreview | null,
        reaction_counts: reactionCounts,
        comment_count: commentCount,
        paired_writing_slug: post.paired_writing?.slug ?? null,
      };
    })
  );

  return postsWithCounts;
}

/**
 * Fetch pinned posts for a profile (max 3).
 */
export async function getPinnedPosts(
  profileId: string
): Promise<MicroblogPost[]> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("microblog_posts")
    .select("*")
    .eq("profile_id", profileId)
    .eq("status", "published")
    .eq("visibility", "public")
    .eq("pinned", true)
    .order("pinned_order", { ascending: true })
    .limit(3);

  if (error || !data) return [];
  return data as MicroblogPost[];
}

/**
 * Fetch a single post by short_id for the individual post page.
 */
export async function getPostByShortId(
  profileId: string,
  shortId: string
): Promise<MicroblogPostWithCounts | null> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("microblog_posts")
    .select("*, paired_writing:writings!paired_writing_id(slug)")
    .eq("profile_id", profileId)
    .eq("short_id", shortId)
    .single();

  if (error || !data) return null;

  const post = data as MicroblogPost & { paired_writing: { slug: string } | null };
  const [reactionCounts, commentCount] = await Promise.all([
    getReactionCounts(post.id),
    getCommentCount(post.id),
  ]);

  return {
    ...post,
    images: (post.images ?? []) as MicroblogImage[],
    link_preview: post.link_preview as LinkPreview | null,
    reaction_counts: reactionCounts,
    comment_count: commentCount,
    paired_writing_slug: post.paired_writing?.slug ?? null,
  };
}

/**
 * Fetch comments for a post, ordered oldest-first. Includes mini profile data.
 */
export async function getPostComments(
  postId: string
): Promise<(MicroblogComment & { mini_profile?: MiniProfile })[]> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("microblog_comments")
    .select("*, mini_profiles(id, display_name, avatar_url)")
    .eq("post_id", postId)
    .eq("status", "visible")
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return (data as Array<MicroblogComment & { mini_profiles?: MiniProfile }>).map(
    (comment) => ({
      ...comment,
      mini_profile: comment.mini_profiles ?? undefined,
    })
  );
}

// ─── Aggregation Helpers ────────────────────────────────────────────────

async function getReactionCounts(postId: string): Promise<ReactionCount[]> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("microblog_reactions")
    .select("emoji")
    .eq("post_id", postId);

  if (error || !data) return [];

  // Group by emoji and count
  const counts: Record<string, number> = {};
  for (const r of data as Array<{ emoji: string }>) {
    counts[r.emoji] = (counts[r.emoji] || 0) + 1;
  }

  return Object.entries(counts).map(([emoji, count]) => ({ emoji, count }));
}

async function getCommentCount(postId: string): Promise<number> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error, count } = await (supabase as any)
    .from("microblog_comments")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId)
    .eq("status", "visible");

  if (error) return 0;
  return count ?? 0;
}

// ─── Display Helpers ────────────────────────────────────────────────────

/** Display timestamp for a post (uses source_created_at for imports) */
export function getPostDate(post: MicroblogPost): string {
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
