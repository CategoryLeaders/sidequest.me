import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { insertFeedEvent, deleteFeedEvent } from "@/lib/feed-events";

/**
 * POST /api/crowdfunding-reviews — create or update a review.
 * Upserts on (project_id, user_id) unique constraint.
 * [SQ.S-W-2603-0075]
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    project_id: string;
    rating?: number | null;
    title?: string;
    body: string;
    visibility?: string;
  };

  if (!body.project_id || !body.body?.trim()) {
    return NextResponse.json({ error: "project_id and body are required" }, { status: 400 });
  }

  // Verify user owns the project
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: project } = await (supabase as any)
    .from("crowdfunding_projects")
    .select("id")
    .eq("id", body.project_id)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
  }

  // Upsert review
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("crowdfunding_reviews")
    .upsert(
      {
        project_id: body.project_id,
        user_id: user.id,
        rating: body.rating ?? null,
        title: body.title?.trim() || null,
        body: body.body.trim(),
        visibility: body.visibility ?? "public",
        status: "published",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "project_id,user_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get profile_id for feed event
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profile && data?.id) {
    try {
      await insertFeedEvent({
        profileId: profile.id,
        eventType: "review_published",
        objectId: data.id,
        objectType: "crowdfunding_reviews",
        visibility: body.visibility === "private" ? "private" : "public",
      });
    } catch (feedErr) {
      console.error("[crowdfunding-reviews] Feed event insert failed:", feedErr);
      // Non-fatal — review was saved successfully
    }
  }

  return NextResponse.json(data);
}

/**
 * DELETE /api/crowdfunding-reviews — delete a review.
 */
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const reviewId = searchParams.get("id");
  if (!reviewId) return NextResponse.json({ error: "id is required" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("crowdfunding_reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Remove feed event for this review
  try {
    await deleteFeedEvent(reviewId, "crowdfunding_reviews");
  } catch {
    // Non-fatal
  }

  return NextResponse.json({ ok: true });
}
