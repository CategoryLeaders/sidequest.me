/* ── Digest subscribe — double opt-in flow ── [SQ.S-W-2603-0068] */
/*
 * POST /api/digest/subscribe
 * Body: { profile_id, email }
 * Sends a confirmation email. Subscription only activates on confirm.
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendConfirmationEmail } from "@/lib/digest/email";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  const body = await request.json();
  const { profile_id, email } = body;

  if (!profile_id || !email?.trim()) {
    return NextResponse.json({ error: "profile_id and email are required" }, { status: 400 });
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Check if already subscribed
  const { data: existing } = await supabase
    .from("digest_subscribers")
    .select("id, confirmed, unsubscribed_at")
    .eq("profile_id", profile_id)
    .eq("email", email.trim().toLowerCase())
    .single();

  if (existing?.confirmed && !existing.unsubscribed_at) {
    return NextResponse.json({ message: "Already subscribed" });
  }

  const confirmToken = randomUUID();
  const now = new Date().toISOString();

  if (existing) {
    // Re-subscribe or resend confirmation
    await supabase
      .from("digest_subscribers")
      .update({
        confirmed: false,
        confirm_token: confirmToken,
        confirm_sent_at: now,
        unsubscribed_at: null,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("digest_subscribers").insert({
      profile_id,
      email: email.trim().toLowerCase(),
      confirmed: false,
      confirm_token: confirmToken,
      confirm_sent_at: now,
    });
  }

  // Fetch profile for the confirmation email
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", profile_id)
    .single();

  try {
    await sendConfirmationEmail({
      to: email.trim().toLowerCase(),
      confirmToken,
      profileUsername: profile?.username ?? "someone",
      profileDisplayName: profile?.display_name ?? "Someone",
    });
  } catch (err) {
    console.error("[digest] Failed to send confirmation email:", err);
    return NextResponse.json({ error: "Failed to send confirmation email" }, { status: 500 });
  }

  return NextResponse.json({ message: "Confirmation email sent. Please check your inbox." });
}
