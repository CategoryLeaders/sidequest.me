/* ── Digest unsubscribe ── [SQ.S-W-2603-0068] */
/*
 * GET /api/digest/unsubscribe?email=<email>&profile_id=<uuid>
 * Marks subscription as unsubscribed. Data retained 30 days per GDPR policy.
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const profileId = searchParams.get("profile_id");

  if (!email || !profileId) {
    return NextResponse.redirect(new URL("/?digest_error=invalid_unsubscribe", request.url));
  }

  const supabase = createServiceClient();

  const { error } = await supabase
    .from("digest_subscribers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("profile_id", profileId)
    .eq("email", email.toLowerCase())
    .eq("confirmed", true);

  if (error) {
    console.error("[digest] Unsubscribe failed:", error);
    return NextResponse.redirect(new URL("/?digest_error=failed", request.url));
  }

  return NextResponse.redirect(new URL("/?digest_unsubscribed=true", request.url));
}
