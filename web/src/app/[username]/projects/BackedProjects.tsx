"use client";

/**
 * Client component for the "Backed" sub-tab on the Projects page.
 * V2: TubeMapFilter, lightbox on card click, countdown badges.
 * [SQ.S-W-2603-0073] [SQ.S-W-2603-0074]
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CrowdfundingProject, CrowdfundingStatus } from "@/lib/crowdfunding-utils";
import { formatPledge, parseDeliveryDeadline, normalizeStatus, statusHex } from "@/lib/crowdfunding-utils";
import StatusPipeline from "@/components/StatusPipeline";
import TubeMapFilter from "@/components/TubeMapFilter";
import CountdownBadge from "@/components/crowdfunding/CountdownBadge";
import CalendarView from "@/components/crowdfunding/CalendarView";
import StarRating from "@/components/crowdfunding/StarRating";
import { ContentActions } from "@/components/shared/ContentActions";
import type { Tables } from "@/types/database";

type ViewMode = "grid" | "calendar";

const rotations = ["-0.3deg", "0.4deg", "-0.2deg", "0.5deg", "-0.4deg", "0.3deg"];

type FilterValue = "all" | CrowdfundingStatus;

interface BackedProjectsProps {
  projects: CrowdfundingProject[];
  username: string;
  writingCounts: Record<string, number>;
  /** Map of projectId → rating (null if review exists but no rating) */
  reviewRatings?: Record<string, number | null>;
  /** Map of projectId → full review object */
  reviews?: Record<string, Tables<"crowdfunding_reviews">>;
  /** True when the authenticated user owns this profile */
  isOwner?: boolean;
}

export default function BackedProjects({ projects, username, writingCounts, reviewRatings = {}, reviews = {}, isOwner = false }: BackedProjectsProps) {
  const [filter, setFilter] = useState<FilterValue>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [search, setSearch] = useState("");
  const router = useRouter();

  const statusFiltered = filter === "all"
    ? projects
    : projects.filter((p) => normalizeStatus(p.status) === filter);

  const filtered = search.trim()
    ? statusFiltered.filter((p) => {
        const q = search.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          ((p as any).short_name ?? "").toLowerCase().includes(q) ||
          ((p as any).tagline ?? "").toLowerCase().includes(q) ||
          (p.tags ?? []).some((t) => t.toLowerCase().includes(q))
        );
      })
    : statusFiltered;

  return (
    <>
      {/* Tube Map Filter + View Toggle */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <TubeMapFilter
            projects={projects}
            activeFilter={filter}
            onFilterChange={setFilter}
          />
        </div>
        <div className="flex gap-1 flex-shrink-0 mt-1">
          {(["grid", "calendar"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`font-mono text-[0.55rem] uppercase px-2.5 py-1 border-2 cursor-pointer transition-all ${
                viewMode === mode
                  ? "border-ink bg-ink text-bg font-bold"
                  : "border-ink/20 hover:border-ink/40 bg-transparent"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Search bar */}
      <div className="mt-3" style={{ position: "relative" }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects…"
          className="w-full px-3 py-2 border-2 border-ink/20 bg-bg-card font-mono text-[0.75rem] focus:outline-none focus:border-ink/50 transition-colors placeholder:opacity-40"
          style={{ paddingRight: search ? "2rem" : undefined }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear search"
            style={{
              position: "absolute",
              right: "0.5rem",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "0.75rem",
              lineHeight: 1,
              opacity: 0.4,
              color: "var(--ink)",
              padding: "4px",
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <CalendarView
          projects={filtered}
          onProjectClick={(p) => router.push(`/${username}/backed/${p.slug}`)}
        />
      )}

      {/* Grid View */}
      {viewMode === "grid" && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((project, i) => {
          const wCount = writingCounts[project.id] ?? 0;

          // Countdown logic (normalise: "live" is a legacy alias for "crowdfunding")
          const showCampaignCountdown = normalizeStatus(project.status) === "crowdfunding" && project.deadline;
          const deliveryDeadline = project.est_delivery
            ? parseDeliveryDeadline(project.est_delivery)
            : null;
          const showDeliveryCountdown =
            (project.status === "in_production" || project.status === "shipped") &&
            deliveryDeadline &&
            deliveryDeadline.getTime() > Date.now();

          return (
            <div
              key={project.id}
              className="border-3 border-ink p-5 bg-bg-card card-hover flex flex-col cursor-pointer"
              style={{ transform: `rotate(${rotations[i % rotations.length]})` }}
              onClick={() => router.push(`/${username}/backed/${project.slug}`)}
            >
              {/* Image with countdown badge */}
              <div className="relative">
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

                {/* Campaign countdown badge overlay */}
                {showCampaignCountdown && (
                  <CountdownBadge
                    deadline={project.deadline!}
                    label="Ends in"
                    color={statusHex(normalizeStatus(project.status))}
                  />
                )}

                {/* Delivery countdown badge overlay */}
                {showDeliveryCountdown && deliveryDeadline && (
                  <CountdownBadge
                    deadline={deliveryDeadline.toISOString()}
                    label="Due"
                    color={statusHex(normalizeStatus(project.status))}
                  />
                )}
              </div>

              {/* Header */}
              <div className="flex items-start justify-between gap-1 mb-0.5">
                <h3 className="font-head font-bold text-[0.9rem] uppercase leading-tight">
                  {(project as any).short_name || project.title}
                </h3>
                {isOwner && (
                  <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0 -mt-1 -mr-1">
                    <ContentActions
                      contentType="crowdfunding_project"
                      contentId={project.id}
                      editData={{
                        title: project.title,
                        description: project.description ?? "",
                        status: project.status,
                        est_delivery: project.est_delivery ?? "",
                        reward_tier: project.reward_tier ?? "",
                        show_pledge_amount: project.show_pledge_amount ?? false,
                        external_url: project.external_url ?? "",
                        tags: project.tags ?? [],
                      }}
                    />
                  </div>
                )}
              </div>
              {(project as any).tagline && (
                <p className="text-[0.72rem] italic opacity-50 leading-snug mb-1.5 line-clamp-2">
                  {(project as any).tagline}
                </p>
              )}
              <div className="mb-2 flex items-center gap-2">
                <StatusPipeline status={project.status} />
                {reviewRatings[project.id] !== undefined && (
                  <StarRating rating={reviewRatings[project.id]} />
                )}
              </div>

              {/* Pledge amount */}
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

              {/* Writing link / Review CTA */}
              {wCount > 0 ? (
                <div className="mt-3 pt-2 border-t border-ink/10">
                  <span className="font-mono text-[0.6rem] font-semibold uppercase text-orange opacity-60">
                    Has review
                  </span>
                </div>
              ) : isOwner && (normalizeStatus(project.status) === "delivered" || normalizeStatus(project.status) === "shipped") && reviewRatings[project.id] === undefined ? (
                <div className="mt-3 pt-2 border-t border-ink/10" onClick={(e) => e.stopPropagation()}>
                  <Link
                    href={`/${username}/backed/${project.slug}#review`}
                    className="font-mono text-[0.6rem] font-semibold uppercase text-orange no-underline hover:opacity-70 transition-opacity"
                  >
                    Leave a review →
                  </Link>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>}

      {filtered.length === 0 && (
        <p className="text-center opacity-40 font-mono text-[0.8rem] py-12">
          No projects match this filter.
        </p>
      )}

    </>
  );
}
