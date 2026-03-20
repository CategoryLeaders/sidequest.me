/* ── Notification opt-out — commenter unsubscribes from reply notifications ── [SQ.S-W-2603-0069] */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  const profileId = searchParams.get("profile_id");

  if (!userId || !profileId) {
    return NextResponse.redirect(new URL("/?notification_error=invalid", request.url));
  }

  const supabase = createServiceClient();

  // Upsert opt-out
  await supabase
    .from("commenter_notification_optouts")
    .upsert({ user_id: userId, profile_id: profileId }, { onConflict: "user_id,profile_id" });

  return NextResponse.redirect(new URL("/?notifications_opted_out=true", request.url));
}
