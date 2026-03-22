"use client";

/**
 * Client component for the "Backed" sub-tab on the Projects page.
 * V2: Uses TubeMapFilter for status filtering, updated for V2 pipeline.
 * [SQ.S-W-2603-0073]
 */

import { useState } from "react";
import Link from "next/link";
import type { CrowdfundingProject, CrowdfundingStatus } from "@/lib/crowdfunding-utils";
import { formatPledge } from "@/lib/crowdfunding-utils";
import StatusPipeline from "@/components/StatusPipeline";
import TubeMapFilter from "@/components/TubeMapFilter";

const rotations = ["-0.3deg", "0.4deg", "-0.2deg", "0.5deg", "-0.4deg", "0.3deg"];

type FilterValue = "all" | CrowdfundingStatus;

interface BackedProjectsProps {
  projects: CrowdfundingProject[];
  username: string;
  writingCounts: Record<string, number>;
}

export default function BackedProjects({ projects, username, writingCounts }: BackedProjectsProps) {
  const [filter, setFilter] = useState<FilterValue>("all");

  const filtered = filter === "all"
    ? projects
    : projects.filter((p) => p.status === filter);

  return (
    <>
      {/* Tube Map Filter */}
      <TubeMapFilter
        projects={projects}
        activeFilter={filter}
        onFilterChange={setFilter}
      />

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
              {/* Image */}
              {project.image_url ? (
                <div className="w-full mb-3 border-2 border-ink/10 bg-ink/5 flex items-center justify-center">
                  <img
                    src={project.image_url}
                    alt={project.title}
                    className="w-full h-auto object-contain"
                  />
                </div>
              ) : (
                <div className="w-full h-20 mb-3 bg-ink/5 flex items-center justify-center border-2 border-ink/10">
                  <span className="font-mono text-[0.6rem] opacity-30 uppercase">
                    {project.platform}
                  </span>
                </div>
              )}

              {/* Header: short_name + tagline */}
              <h3 className="font-head font-bold text-[0.9rem] uppercase leading-tight mb-0.5">
                {project.external_url ? (
                  <a
                    href={project.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="no-underline hover:text-orange transition-colors"
                  >
                    {(project as any).short_name || project.title}
                  </a>
                ) : (
                  (project as any).short_name || project.title
                )}
              </h3>
              {(project as any).tagline && (
                <p className="text-[0.72rem] italic opacity-50 leading-snug mb-1.5 line-clamp-2">
                  {(project as any).tagline}
                </p>
              )}
              <div className="mb-2">
                <StatusPipeline status={project.status} />
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
