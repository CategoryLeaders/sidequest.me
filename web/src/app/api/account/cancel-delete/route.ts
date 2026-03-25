/* ── Cancel account deletion ── [SQ.S-W-2603-0067] */

import { NextResponse } from "next/server";
import { apiRequireAuth, isAuthError } from "@/lib/auth/require";

export async function POST() {
  const auth = await apiRequireAuth();
  if (isAuthError(auth)) return auth;
  const { user, supabase } = auth;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("scheduled_deletion_at")
    .eq("id", user.id)
    .single();

  if (!profile?.scheduled_deletion_at) {
    return NextResponse.json({ error: "No pending deletion" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("profiles")
    .update({ scheduled_deletion_at: null })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: "Account deletion cancelled" });
}
