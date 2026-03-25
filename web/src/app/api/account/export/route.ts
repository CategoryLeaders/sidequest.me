/* ── Data export — GDPR right to data portability ── [SQ.S-W-2603-0067] */
/*
 * GET /api/account/export
 * Returns a JSON file containing all user data: profile, content, comments, settings.
 */

import { NextResponse } from "next/server";
import { apiRequireAuth, isAuthError } from "@/lib/auth/require";

export async function GET() {
  const auth = await apiRequireAuth();
  if (isAuthError(auth)) return auth;
  const { user, supabase } = auth;

  const sb = supabase as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  // Fetch all user data in parallel
  const [
    { data: profile },
    { data: writings },
    { data: microblogs },
    { data: bookmarks },
    { data: quotes },
    { data: questions },
    { data: comments },
    { data: reactions },
    { data: projects },
    { data: crowdfunding },
    { data: digestSettings },
    { data: miniProfile },
  ] = await Promise.all([
    sb.from("profiles").select("*").eq("id", user.id).single(),
    sb.from("writings").select("*").eq("user_id", user.id),
    sb.from("microblog_posts").select("*").eq("profile_id", user.id),
    sb.from("bookmarks").select("*").eq("profile_id", user.id),
    sb.from("quotes").select("*").eq("profile_id", user.id),
    sb.from("questions").select("*").eq("profile_id", user.id),
    sb.from("microblog_comments").select("*").eq("user_id", user.id),
    sb.from("microblog_reactions").select("*").eq("user_id", user.id),
    sb.from("projects").select("*").eq("user_id", user.id),
    sb.from("crowdfunding_projects").select("*").eq("user_id", user.id),
    sb.from("digest_settings").select("*").eq("profile_id", user.id).single(),
    sb.from("mini_profiles").select("*").eq("id", user.id).single(),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    user_id: user.id,
    email: user.email,
    profile,
    mini_profile: miniProfile,
    digest_settings: digestSettings,
    content: {
      writings: writings ?? [],
      microblog_posts: microblogs ?? [],
      bookmarks: bookmarks ?? [],
      quotes: quotes ?? [],
      questions: questions ?? [],
    },
    engagement: {
      comments: comments ?? [],
      reactions: reactions ?? [],
    },
    projects: projects ?? [],
    crowdfunding_projects: crowdfunding ?? [],
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="sidequest-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
