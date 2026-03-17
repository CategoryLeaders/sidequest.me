"use client";

/**
 * Client component for the "Backed" sub-tab on the Projects page.
 * Renders a filterable grid of crowdfunding project cards.
 */

import { useState } from "react";
import Link from "next/link";
import type { CrowdfundingProject } from "@/lib/crowdfunding-utils";
import { formatPledge, statusColor, statusLabel, CROWDFUNDING_STATUSES } from "@/lib/crowdfunding-utils";

const rotations = ["-0.3deg", "0.4deg", "-0.2deg", "0.5deg", "-0.4deg", "0.3deg"];

type StatusFilter = "all" | "crowdfunding" | "in_production" | "shipping" | "received";

interface BackedProjectsProps {
  projects: CrowdfundingProject[];
  username: string;
  writingCounts: Record<string, number>;
}

export default function BackedProjects({ projects, username, writingCounts }: BackedProjectsProps) {
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filtered = filter === "all"
    ? projects
    : projects.filter((p) => {
        // Map legacy statuses to new equivalents for filtering
        const mapped = p.status === "active" ? "crowdfunding"
          : p.status === "delivered" ? "received"
          : p.status === "shipped" ? "shipping"
          : p.status;
        return mapped === filter;
      });

  // Count including legacy status mappings
  const statusBucket = (s: string) =>
    s === "active" ? "crowdfunding"
    : s === "delivered" ? "received"
    : s === "shipped" ? "shipping"
    : s;

  const counts = {
    all: projects.length,
    crowdfunding: projects.filter((p) => statusBucket(p.status) === "crowdfunding").length,
    in_production: projects.filter((p) => statusBucket(p.status) === "in_production").length,
    shipping: projects.filter((p) => statusBucket(p.status) === "shipping").length,
    received: projects.filter((p) => statusBucket(p.status) === "received").length,
  };

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    ...(counts.crowdfunding > 0 ? [{ key: "crowdfunding" as StatusFilter, label: "Crowdfunding" }] : []),
    ...(counts.in_production > 0 ? [{ key: "in_production" as StatusFilter, label: "In Production" }] : []),
    ...(counts.shipping > 0 ? [{ key: "shipping" as StatusFilter, label: "Shipping" }] : []),
    ...(counts.received > 0 ? [{ key: "received" as StatusFilter, label: "Received" }] : []),
  ];

  return (
    <>
      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`font-mono text-[0.65rem] px-3 py-1 border-2 border-ink cursor-pointer transition-all ${
              filter === f.key
                ? "bg-ink text-bg font-bold"
                : "bg-bg-card hover:bg-ink/5"
            }`}
            style={{ transform: "rotate(-0.3deg)" }}
          >
            {f.label} ({counts[f.key]})
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((project, i) => {
          const wCount = writingCounts[project.id] ?? 0;
          return (
            <div
              key={project.id}
              className="border-3 border-ink p-5 bg-bg-card card-hover flex flex-col"
              style={{ transform: `rotate(${rotations[i % rotations.length]})` }}
            >
              {/* Image placeholder */}
              {project.image_url ? (
                <div className="w-full h-32 mb-3 overflow-hidden border-2 border-ink/10">
                  <img
                    src={project.image_url}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-20 mb-3 bg-ink/5 flex items-center justify-center border-2 border-ink/10">
                  <span className="font-mono text-[0.6rem] opacity-30 uppercase">
                    {project.platform}
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className="font-head font-bold text-[0.9rem] uppercase leading-tight flex-1">
                  {project.external_url ? (
                    <a
                      href={project.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="no-underline hover:text-orange transition-colors"
                    >
                      {project.title}
                    </a>
                  ) : (
                    project.title
                  )}
                </h3>
                <span className={`sticker text-[0.55rem] px-2 py-0.5 whitespace-nowrap ${statusColor(project.status)}`}>
                  {statusLabel(project.status)}
                </span>
              </div>

              {/* Pledge amount (only if toggled on) */}
              {project.show_pledge_amount && project.pledge_amount && (
                <p className="font-mono text-[0.75rem] font-bold mb-1">
                  {formatPledge(project.pledge_amount, project.pledge_currency)}
                </p>
              )}

              {/* Reward tier */}
              {project.reward_tier && (
                <p className="text-[0.75rem] opacity-50 leading-snug mb-2 line-clamp-2">
                  {project.reward_tier}
                </p>
              )}

              {/* Est delivery */}
              {project.est_delivery && (
                <p className="font-mono text-[0.6rem] opacity-40 mb-2">
                  Est. {project.est_delivery}
                </p>
              )}

              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-auto pt-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-mono text-[0.55rem] px-1.5 py-0.5 border border-ink/20 opacity-50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Writing link */}
              {wCount > 0 && (
                <div className="mt-3 pt-2 border-t border-ink/10">
                  <Link
                    href={`/${username}/writings?crowdfunding=${project.slug}`}
                    className="font-mono text-[0.6rem] font-semibold uppercase text-orange no-underline opacity-60 hover:opacity-100 transition-opacity"
                  >
                    Read my review →
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center opacity-40 font-mono text-[0.8rem] py-12">
          No projects match this filter.
        </p>
      )}
    </>
  );
}
