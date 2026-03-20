/* ── feed_events — platform contract helpers ── [SQ.S-W-2603-0059] */
/*
 * Every content type must call these three operations:
 *   1. insertFeedEvent  → on publish
 *   2. updateFeedVisibility → on visibility change
 *   3. deleteFeedEvent  → on content deletion
 *
 * See docs/feed-events-contract.md for the full contract.
 */

import { createClient } from "@/lib/supabase/server";

export type FeedEventType =
  | "microblog_published"
  | "writing_published"
  | "bookmark_published"
  | "quote_published"
  | "question_published"
  | "question_resolved"
  | "photo_added"
  | "project_created"
  | "project_updated"
  | "project_backed"
  | "adventure_published"
  | "career_updated"
  | "profile_updated"
  | "reshared";

export type FeedVisibility = "public" | "unlisted" | "private";

export interface InsertFeedEventParams {
  profileId: string;
  eventType: FeedEventType;
  objectId: string;
  objectType: string;
  visibility: FeedVisibility;
  publishedAt?: string; // ISO timestamp; defaults to now()
  photoBatchId?: string;
  expiresAt?: string;
}

/**
 * INSERT a feed event when content is published.
 * For scheduled posts: call this at actual publish time (when cron fires), NOT at schedule time.
 */
export async function insertFeedEvent(params: InsertFeedEventParams) {
  const supabase = await createClient();

  const { error } = await (supabase as any)
    .from("feed_events")
    .insert({
      profile_id: params.profileId,
      event_type: params.eventType,
      object_id: params.objectId,
      object_type: params.objectType,
      visibility: params.visibility,
      published_at: params.publishedAt ?? new Date().toISOString(),
      photo_batch_id: params.photoBatchId ?? null,
      expires_at: params.expiresAt ?? null,
    });

  if (error) {
    console.error("[feed_events] INSERT failed:", error);
    throw error;
  }
}

/**
 * UPDATE visibility on a feed event when the content's visibility changes.
 */
export async function updateFeedVisibility(
  objectId: string,
  objectType: string,
  newVisibility: FeedVisibility
) {
  const supabase = await createClient();

  const { error } = await (supabase as any)
    .from("feed_events")
    .update({ visibility: newVisibility })
    .eq("object_id", objectId)
    .eq("object_type", objectType);

  if (error) {
    console.error("[feed_events] UPDATE visibility failed:", error);
    throw error;
  }
}

/**
 * DELETE feed event(s) when content is deleted.
 */
export async function deleteFeedEvent(objectId: string, objectType: string) {
  const supabase = await createClient();

  const { error } = await (supabase as any)
    .from("feed_events")
    .delete()
    .eq("object_id", objectId)
    .eq("object_type", objectType);

  if (error) {
    console.error("[feed_events] DELETE failed:", error);
    throw error;
  }
}

// ─── Microblog-specific convenience ─────────────────────────────────────────

/**
 * Insert a feed event for a microblog post publish.
 */
export async function publishMicroblogToFeed(
  profileId: string,
  postId: string,
  visibility: FeedVisibility,
  publishedAt?: string
) {
  return insertFeedEvent({
    profileId,
    eventType: "microblog_published",
    objectId: postId,
    objectType: "microblog_posts",
    visibility,
    publishedAt,
  });
}

/**
 * Insert a feed event for a writing publish.
 */
export async function publishWritingToFeed(
  profileId: string,
  writingId: string,
  visibility: FeedVisibility,
  publishedAt?: string
) {
  return insertFeedEvent({
    profileId,
    eventType: "writing_published",
    objectId: writingId,
    objectType: "writings",
    visibility,
    publishedAt,
  });
}
