/* ── Digest send — triggered by cron or manual ── [SQ.S-W-2603-0068] */
/*
 * POST /api/digest/send
 * Headers: Authorization: Bearer <CRON_SECRET>
 * Body: { profile_id } (optional — if omitted, processes all due digests)
 *
 * For cron: call without body to process all profiles whose digest is due.
 * For manual: call with profile_id to send digest for a specific profile.
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { assembleDigest, renderDigestHtml } from "@/lib/digest/assemble";
import { sendDigestEmail } from "@/lib/digest/email";

const CRON_SECRET = process.env.CRON_SECRET;

// GET handler for Vercel Cron (Vercel crons send GET requests)
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}` || !CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return handleDigestSend(request, true, {});
}

// POST handler for manual sends
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const isCron = !!(authHeader === `Bearer ${CRON_SECRET}` && CRON_SECRET);
  const body = await request.json().catch(() => ({}));

  if (!isCron && !body.profile_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return handleDigestSend(request, isCron, body);
}

async function handleDigestSend(_request: Request, isCron: boolean, body: Record<string, unknown>) {
  const supabase = createServiceClient();

  const now = new Date();
  let profileIds: string[] = [];

  if (body.profile_id) {
    profileIds = [body.profile_id as string];
  } else {
    // Find all profiles with digests due
    const { data: dueProfiles } = await supabase
      .from("digest_settings")
      .select("profile_id, frequency, send_day, send_time, last_digest_sent_at")
      .eq("enabled", true);

    for (const ds of dueProfiles ?? []) {
      if (isDigestDue(ds, now)) {
        profileIds.push(ds.profile_id as string);
      }
    }
  }

  const results: Array<{ profileId: string; sent: number; error?: string }> = [];

  for (const profileId of profileIds) {
    try {
      const result = await sendDigestForProfile(supabase, profileId);
      results.push(result);
    } catch (err: any) {
      results.push({ profileId, sent: 0, error: err.message });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}

async function sendDigestForProfile(
  supabase: ReturnType<typeof createServiceClient>,
  profileId: string
) {
  // Get digest settings
  const { data: settings } = await supabase
    .from("digest_settings")
    .select("*")
    .eq("profile_id", profileId)
    .single();

  if (!settings) throw new Error("No digest settings found");

  // Get profile info
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", profileId)
    .single();

  if (!profile) throw new Error("Profile not found");

  const since = (settings.last_digest_sent_at as string) ??
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Assemble digest content
  const { items, subjectLine } = await assembleDigest(
    profileId,
    profile.username as string,
    since,
    {
      include_microblog: (settings.include_microblog as boolean) ?? true,
      include_writings: (settings.include_writings as boolean) ?? true,
      include_bookmarks: (settings.include_bookmarks as boolean) ?? true,
      include_quotes: (settings.include_quotes as boolean) ?? true,
      include_questions: (settings.include_questions as boolean) ?? true,
      include_projects: (settings.include_projects as boolean) ?? true,
      include_adventures: (settings.include_adventures as boolean) ?? true,
    }
  );

  if (items.length === 0) {
    // Update last_digest_sent_at even if empty — avoid re-checking
    await supabase
      .from("digest_settings")
      .update({ last_digest_sent_at: new Date().toISOString() })
      .eq("profile_id", profileId);
    return { profileId, sent: 0 };
  }

  const html = renderDigestHtml(items, (profile.display_name as string) ?? (profile.username as string));

  // Get confirmed subscribers
  const { data: subscribers } = await supabase
    .from("digest_subscribers")
    .select("email")
    .eq("profile_id", profileId)
    .eq("confirmed", true)
    .is("unsubscribed_at", null);

  let sent = 0;
  for (const sub of subscribers ?? []) {
    try {
      await sendDigestEmail({
        to: sub.email as string,
        subject: subjectLine,
        html,
        replyTo: (settings.reply_to_email as string) ?? undefined,
        profileId,
      });
      sent++;
    } catch (err) {
      console.error(`[digest] Failed to send to ${sub.email}:`, err);
    }
  }

  // Update last sent timestamp
  await supabase
    .from("digest_settings")
    .update({ last_digest_sent_at: new Date().toISOString() })
    .eq("profile_id", profileId);

  return { profileId, sent };
}

function isDigestDue(
  ds: Record<string, unknown>,
  now: Date
): boolean {
  const frequency = ds.frequency as string;
  const lastSent = ds.last_digest_sent_at
    ? new Date(ds.last_digest_sent_at as string)
    : null;

  if (!lastSent) return true; // never sent

  const hoursSince = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);

  switch (frequency) {
    case "weekly":
      return hoursSince >= 7 * 24 && now.getDay() === ((ds.send_day as number) ?? 1);
    case "fortnightly":
      return hoursSince >= 14 * 24;
    case "monthly":
      return hoursSince >= 28 * 24;
    case "manual":
      return false; // only sent when triggered explicitly
    default:
      return hoursSince >= 7 * 24;
  }
}
