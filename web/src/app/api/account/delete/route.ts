/* ── Account deletion — GDPR right to erasure ── [SQ.S-W-2603-0067] */
/*
 * POST /api/account/delete
 * Schedules account for deletion after 30-day grace period.
 * During grace period, user can cancel via POST /api/account/cancel-delete.
 * After 30 days, a cron job will hard-delete the auth.users row,
 * which cascades to profiles, mini_profiles, and all content.
 * Comments are anonymised via trigger (trg_anonymise_comments_before_delete).
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deletionDate = new Date();
  deletionDate.setDate(deletionDate.getDate() + 30);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("profiles")
    .update({ scheduled_deletion_at: deletionDate.toISOString() })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sign the user out
  await supabase.auth.signOut();

  return NextResponse.json({
    message: "Account scheduled for deletion",
    deletion_date: deletionDate.toISOString(),
    note: "You can cancel by logging back in and calling POST /api/account/cancel-delete within 30 days.",
  });
}
