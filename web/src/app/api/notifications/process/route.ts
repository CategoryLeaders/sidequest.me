/* ── Process batched comment notifications — cron endpoint ── [SQ.S-W-2603-0069] */
/*
 * POST /api/notifications/process
 * Headers: Authorization: Bearer <CRON_SECRET>
 * Processes pending comment notification jobs, respecting each author's frequency setting.
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { processCommentNotificationBatch } from "@/lib/notifications";

const CRON_SECRET = process.env.CRON_SECRET;

// GET handler for Vercel Cron
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}` || !CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return handleProcess();
}

// POST handler for manual triggers
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}` || !CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return handleProcess();
}

async function handleProcess() {
  const supabase = createServiceClient();

  // Get all profiles with pending comment notifications
  const { data: pendingJobs } = await supabase
    .from("job_queue")
    .select("payload")
    .eq("job_type", "send_comment_notification")
    .eq("status", "pending");

  if (!pendingJobs || pendingJobs.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  // Unique profile IDs
  const profileIds = [
    ...new Set(pendingJobs.map((j) => (j.payload as Record<string, string>).profile_id)),
  ];

  // Check each profile's notification settings to see if they're due
  let processed = 0;
  const now = new Date();

  for (const profileId of profileIds) {
    const { data: settings } = await supabase
      .from("notification_settings")
      .select("comment_frequency, last_comment_digest_at")
      .eq("profile_id", profileId)
      .single();

    if (!settings) {
      // No settings — use default (every 15 min)
      await processCommentNotificationBatch(profileId);
      processed++;
      continue;
    }

    const freq = settings.comment_frequency as string;
    if (freq === "off") continue;

    const lastSent = settings.last_comment_digest_at
      ? new Date(settings.last_comment_digest_at as string)
      : null;

    const minutesSince = lastSent
      ? (now.getTime() - lastSent.getTime()) / (1000 * 60)
      : Infinity;

    let isDue = false;
    switch (freq) {
      case "every_15_min":
        isDue = minutesSince >= 15;
        break;
      case "every_3_hours":
        isDue = minutesSince >= 180;
        break;
      case "weekly":
        isDue = minutesSince >= 7 * 24 * 60;
        break;
      default:
        isDue = minutesSince >= 15;
    }

    if (isDue) {
      await processCommentNotificationBatch(profileId);
      await supabase
        .from("notification_settings")
        .upsert(
          { profile_id: profileId, last_comment_digest_at: now.toISOString() },
          { onConflict: "profile_id" }
        );
      processed++;
    }
  }

  return NextResponse.json({ processed });
}
