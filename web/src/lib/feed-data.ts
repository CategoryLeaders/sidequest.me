/* ── Aggregated feed for the homepage "What's New" section ── */

import { posts } from "./photowall-data";
import { companies } from "./career-data";

export type FeedItem = {
  id: string;
  type: "photo" | "project" | "career" | "idea" | "article";
  title: string;
  desc: string;
  badge: string;
  badgeLabel: string;
  link: string;
  image?: string;
  date: string;
  sortDate: string; // ISO for sorting
};

const projects = [
  {
    title: "Sidequest Ventures",
    url: "sidequestventures.com",
    desc: "Angel investing in early-stage startups focused on developer tools, productivity, and creative software.",
    status: "Active",
  },
  {
    title: "ProductLobby",
    url: "productlobby.com",
    desc: "A community for product builders to share what they're working on and find collaborators for side projects.",
    status: "Building",
  },
  {
    title: "Category Leaders",
    url: "categoryleaders.co.uk",
    desc: "Boutique consultancy helping B2B SaaS companies nail their positioning, messaging, and go-to-market.",
    status: "Active",
  },
  {
    title: "sidequest.me",
    url: "sidequest.me",
    desc: "This very website. A personal homepage that consolidates everything in one self-owned corner of the internet.",
    status: "Building",
  },
];

export function buildFeed(): FeedItem[] {
  const items: FeedItem[] = [];

  // ── Photos disabled: images are gitignored (213MB) and not deployed ──
  // TODO: re-enable when photos are hosted externally (e.g. Cloudinary / S3)

  // ── Projects (all) ──
  projects.forEach((proj, i) => {
    items.push({
      id: `project-${i}`,
      type: "project",
      title: proj.title,
      desc: proj.desc.slice(0, 80) + (proj.desc.length > 80 ? "…" : ""),
      badge: proj.status === "Building" ? "badge-orange" : "badge-green",
      badgeLabel: proj.status === "Building" ? "Building" : "Project",
      link: "/projects",
      date: proj.status,
      sortDate: "2025-06-01", // projects don't have dates, keep them mid-tier
    });
  });

  // ── Career highlights (latest 2 companies) ──
  companies.slice(0, 2).forEach((co, i) => {
    const role = co.type === "single" ? co.roleTitle : co.stations?.[co.stations.length - 1]?.role;
    const dates = co.type === "single" ? co.roleDates : co.subLine;
    items.push({
      id: `career-${i}`,
      type: "career",
      title: co.name,
      desc: role || co.blurbLeft.content.slice(0, 80) + "…",
      badge: "badge-blue",
      badgeLabel: "Career",
      link: "/professional",
      date: dates || "",
      sortDate: co.type === "single" && co.roleDates
        ? `${co.roleDates.split("–")[0].trim().split(" ")[0]}-01-01`
        : "2020-01-01",
    });
  });

  // Sort by date descending, then limit to 6 for a 2×3 grid
  items.sort((a, b) => b.sortDate.localeCompare(a.sortDate));
  return items.slice(0, 6);
}
