/* ── Shared types for Bookmarks, Quotes, Questions ── [SQ.S-W-2603-0064] */

import { generateShortId } from "./microblogs";

export { generateShortId };

// ─── Bookmark ───────────────────────────────────────────────────────────────

export interface Bookmark {
  id: string;
  profile_id: string;
  short_id: string;
  url: string;
  commentary: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  og_domain: string | null;
  og_favicon_url: string | null;
  og_fetched_at: string | null;
  tags: string[];
  visibility: "public" | "unlisted" | "private";
  status: "draft" | "scheduled" | "published";
  reactions_enabled: boolean;
  comments_enabled: boolean;
  pinned: boolean;
  pinned_order: number | null;
  edited_at: string | null;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Quote ──────────────────────────────────────────────────────────────────

export interface Quote {
  id: string;
  profile_id: string;
  short_id: string;
  quote_text: string;
  source_name: string;
  source_work: string | null;
  source_year: number | null;
  source_url: string | null;
  commentary: string | null;
  tags: string[];
  visibility: "public" | "unlisted" | "private";
  status: "draft" | "scheduled" | "published";
  reactions_enabled: boolean;
  comments_enabled: boolean;
  pinned: boolean;
  pinned_order: number | null;
  edited_at: string | null;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Question ───────────────────────────────────────────────────────────────

export interface Question {
  id: string;
  profile_id: string;
  short_id: string;
  question_text: string;
  thinking: string | null;
  resolved: boolean;
  resolved_at: string | null;
  resolved_summary: string | null;
  tags: string[];
  visibility: "public" | "unlisted" | "private";
  status: "draft" | "scheduled" | "published";
  reactions_enabled: boolean;
  comments_enabled: boolean;
  pinned: boolean;
  pinned_order: number | null;
  edited_at: string | null;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Unified Thoughts content type enum ─────────────────────────────────────

export type ThoughtType = "microblog" | "writing" | "bookmark" | "quote" | "question";

export const THOUGHT_TYPES: { key: ThoughtType; label: string; icon: string }[] = [
  { key: "microblog", label: "Microblog", icon: "✏️" },
  { key: "writing", label: "Writing", icon: "📝" },
  { key: "bookmark", label: "Bookmark", icon: "🔖" },
  { key: "quote", label: "Quote", icon: "💬" },
  { key: "question", label: "Question", icon: "❓" },
];
