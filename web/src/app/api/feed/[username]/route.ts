/* ── Feed API route — returns paginated WhatsNewItems for infinite scroll ── */

import { NextRequest, NextResponse } from "next/server";
import { getProfileByUsername } from "@/lib/profiles";
import { getWhatsNewFeed } from "@/lib/whats-new";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const offset = parseInt(request.nextUrl.searchParams.get("offset") ?? "6");
  const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "10");

  const profile = await getProfileByUsername(username);
  if (!profile) {
    return NextResponse.json({ items: [] });
  }

  const items = await getWhatsNewFeed(profile.id, username, { limit, offset });
  return NextResponse.json({ items });
}
