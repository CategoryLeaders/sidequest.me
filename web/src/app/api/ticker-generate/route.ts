import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Factoid, LikeDislike } from "@/types/profile-extras";

/**
 * POST /api/ticker-generate
 * Generates ticker/carousel items algorithmically from the user's profile data.
 * No external API required — builds a pool of candidates from structured profile
 * fields (factoids, likes, bio, professional_name) then shuffles and filters.
 * Each call shuffles differently, giving a reroll effect.
 * Pinned items are excluded from the returned set.
 * [SQ.S-W-2603-0044]
 *
 * Body: { pinned: string[], count: number }
 * Response: { items: string[] }
 */

// ── Formatting helpers ────────────────────────────────────────────────────────

/** Format a factoid into one or more short ticker-style phrases */
function factoidCandidates(f: Factoid): string[] {
  const v = f.value.trim();
  if (!v) return [];

  const cat = f.category.toLowerCase();

  if (cat === "based in")         return [`${v}-based`];
  if (cat === "fuel")             return [`Runs on ${v}`, `${v} drinker`];
  if (cat === "currently building") return [`Building ${v}`];
  if (cat === "currently reading")  return [`Reading ${v}`];
  if (cat === "currently watching") return [`Watching ${v}`];
  if (cat === "hobby")            return [`Into ${v}`, `${v} hobbyist`];
  if (cat === "superpower")       return [v];
  if (cat === "fun fact")         return [v];
  if (cat === "mbti")             return [`${v} personality`];
  if (cat === "enneagram")        return [`Enneagram type ${v}`];
  if (cat === "languages")        return [`Speaks ${v}`];
  if (cat === "pet")              return [`${v} owner`];
  if (cat === "star sign")        return [`Proud ${v}`];
  if (cat === "music taste")      return [`${v} music fan`];
  if (cat === "morning or night") return [`${v} person`];
  if (cat === "introvert or extrovert") return [v];
  if (cat === "side project")     return [`Building ${v}`];
  if (cat === "tool i can't live without") return [`${v} devotee`];
  if (cat === "dream destination") return [`Dreaming of ${v}`];
  if (cat === "guilty pleasure")  return [`Guilty pleasure: ${v}`];
  if (cat === "unpopular opinion") return v.length <= 40 ? [v] : [];
  if (cat === "favourite food")   return [`${v} obsessed`];
  if (cat === "favourite drink")  return [`${v} fan`];

  // Default: use value directly if short enough
  if (v.length <= 35) return [v];
  return [];
}

/** Format a like into multiple candidate phrasings */
function likeCandidates(l: LikeDislike): string[] {
  const t = l.text.trim();
  if (!t) return [];
  return [`${t} fan`, `Into ${t}`, `${t} enthusiast`, `Loves ${t}`];
}

/** Pull short phrases from a bio string */
function bioExtractions(bio: string): string[] {
  const results: string[] = [];

  // "X+ years in/of Y" or "X+ years Y"
  const yearsMatch = bio.match(/(\d+\+?\s+years?\s+(?:in|of)?\s*\w[\w\s]*)/i);
  if (yearsMatch) {
    const phrase = yearsMatch[1].trim().replace(/\s+/g, " ");
    if (phrase.length <= 35) results.push(phrase);
  }

  // "Surrey-based", "London-based" style
  const basedMatch = bio.match(/\b([\w]+)-based\b/i);
  if (basedMatch) results.push(basedMatch[0]);

  // Short em-dash / clause splits (e.g. "Product leader — Product marketer")
  const dashes = bio.split(/\s[—–]\s/);
  for (const part of dashes) {
    const clean = part.trim().replace(/[.!?]$/, "");
    if (clean.length >= 5 && clean.length <= 40) results.push(clean);
  }

  return results;
}

/** Pull role/title parts from professional_name */
function professionalNameCandidates(name: string): string[] {
  return name
    .split(/\s*[—–,]\s*/)
    .map((p) => p.trim().replace(/[.!?]$/, ""))
    .filter((p) => p.length >= 5 && p.length <= 40);
}

// ── Shuffle (Fisher-Yates) ────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Loose similarity: compare first 8 chars lower-case */
function isSimilar(a: string, b: string): boolean {
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  return (
    al === bl ||
    (al.length >= 6 && bl.startsWith(al.slice(0, 6))) ||
    (bl.length >= 6 && al.startsWith(bl.slice(0, 6)))
  );
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const pinned: string[] = Array.isArray(body.pinned) ? body.pinned : [];
  const count: number = Math.min(Math.max(1, Number(body.count) || 5), 10);

  // Fetch profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: profile } = await db
    .from("profiles")
    .select("bio, about_bio, professional_name, factoids, likes, dislikes")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // ── Build candidate pool ──────────────────────────────────────────────────

  // Each source adds multiple phrasings; we pick from the shuffled set later
  const pool: string[] = [];

  if (profile.professional_name) {
    pool.push(...professionalNameCandidates(profile.professional_name));
  }

  if (profile.bio) {
    pool.push(...bioExtractions(profile.bio));
  }

  const factoids = (profile.factoids as Factoid[] | null) ?? [];
  for (const f of factoids) {
    pool.push(...factoidCandidates(f));
  }

  const likes = (profile.likes as LikeDislike[] | null) ?? [];
  for (const l of likes) {
    // Add all phrasings; the shuffle will pick which variant surfaces
    pool.push(...likeCandidates(l));
  }

  // ── Deduplicate pool ──────────────────────────────────────────────────────

  const seen: string[] = [];
  for (const item of pool) {
    if (!seen.some((s) => isSimilar(s, item))) {
      seen.push(item);
    }
  }

  // ── Shuffle (gives reroll effect on each click) ───────────────────────────

  const shuffled = shuffle(seen);

  // ── Filter against pinned ─────────────────────────────────────────────────

  const results = shuffled
    .filter((item) => !pinned.some((p) => isSimilar(p, item)))
    .slice(0, count);

  return NextResponse.json({ items: results });
}
