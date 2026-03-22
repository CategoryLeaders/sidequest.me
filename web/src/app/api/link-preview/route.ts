/* ── Link Preview API — fetches OG meta tags for a URL ── */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const url = body?.url;
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Invalid protocol");
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    // Fetch the page with a reasonable timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SideQuestBot/1.0; +https://sidequest.me)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Fetch failed: ${res.status}` },
        { status: 502 }
      );
    }

    const html = await res.text();

    // Extract OG meta tags
    const title =
      extractMeta(html, "og:title") ||
      extractMeta(html, "twitter:title") ||
      extractTitle(html) ||
      "";

    const description =
      extractMeta(html, "og:description") ||
      extractMeta(html, "twitter:description") ||
      extractMeta(html, "description") ||
      "";

    const image =
      extractMeta(html, "og:image") ||
      extractMeta(html, "twitter:image") ||
      "";

    const siteName = extractMeta(html, "og:site_name") || "";

    const domain = parsedUrl.hostname.replace(/^www\./, "");

    // Extract favicon
    const favicon = extractFavicon(html, parsedUrl.origin) || `${parsedUrl.origin}/favicon.ico`;

    // If we found an og:image, resolve relative URLs
    let imageUrl = "";
    if (image) {
      try {
        imageUrl = new URL(image, parsedUrl.origin).href;
      } catch {
        imageUrl = image;
      }
    }

    // TODO: In future, download og:image and upload to Bunny.net CDN
    // For now, we store the original URL — the image will be proxied or
    // fetched lazily later

    return NextResponse.json({
      title: title.slice(0, 300),
      description: description.slice(0, 500),
      domain,
      site_name: siteName,
      image_url: imageUrl,
      favicon_url: favicon,
      source_url: url,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Fetch failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

// ─── HTML parsing helpers ────────────────────────────────────────────────────

function extractMeta(html: string, property: string): string {
  // Try property="" format (OG tags)
  const propRegex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${escapeRegex(property)}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  const propMatch = html.match(propRegex);
  if (propMatch) return decodeEntities(propMatch[1]);

  // Try content="" before property="" format
  const reverseRegex = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escapeRegex(property)}["']`,
    "i"
  );
  const reverseMatch = html.match(reverseRegex);
  if (reverseMatch) return decodeEntities(reverseMatch[1]);

  return "";
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? decodeEntities(match[1].trim()) : "";
}

function extractFavicon(html: string, origin: string): string {
  // Look for <link rel="icon" or rel="shortcut icon"
  const match = html.match(
    /<link[^>]+rel=["'](?:shortcut\s+)?icon["'][^>]+href=["']([^"']+)["']/i
  );
  if (!match) return "";
  try {
    return new URL(match[1], origin).href;
  } catch {
    return match[1];
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}
