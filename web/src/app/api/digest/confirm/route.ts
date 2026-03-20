/* ── Digest confirm — completes double opt-in ── [SQ.S-W-2603-0068] */
/*
 * GET /api/digest/confirm?token=<uuid>
 * Activates the subscription. Redirects to a success page.
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/?digest_error=missing_token", request.url));
  }

  const supabase = createServiceClient();

  const { data: sub } = await supabase
    .from("digest_subscribers")
    .select("id, confirmed")
    .eq("confirm_token", token)
    .single();

  if (!sub) {
    return NextResponse.redirect(new URL("/?digest_error=invalid_token", request.url));
  }

  if (sub.confirmed) {
    return NextResponse.redirect(new URL("/?digest_confirmed=already", request.url));
  }

  const now = new Date().toISOString();
  await supabase
    .from("digest_subscribers")
    .update({
      confirmed: true,
      subscribed_at: now,
      confirm_token: null, // clear the token after use
    })
    .eq("id", sub.id);

  return NextResponse.redirect(new URL("/?digest_confirmed=true", request.url));
}
