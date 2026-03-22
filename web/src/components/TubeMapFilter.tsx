"use client";

/**
 * Tube Map Status Filter — London Underground style.
 * [SQ.S-W-2603-0073] [SQ.S-W-2603-0084] [SQ.S-W-2603-0085]
 *
 * Main line: Pre-launch → Crowdfunding → Funded → In Production → Shipped → Delivered
 * Branch:    Failed / Cancelled / Suspended — shown as an "off-track" secondary row.
 *
 * Layout note: the track line is absolutely positioned at top:10px (= half of 20px
 * circle diameter) so it runs through the circle centers. The stations use a CSS grid
 * (not items-center flex) so the circles sit at the top of the container and the track
 * aligns correctly. Track left/right are set to 50/N% so the line starts and ends at
 * the center of the first/last circle, not at the container edge.
 */

import { useState, useRef } from "react";
import {
  MAIN_PIPELINE_STATUSES,
  BRANCH_STATUSES,
  statusStep,
  statusHex,
  normalizeStatus,
  type CrowdfundingStatus,
} from "@/lib/crowdfunding-utils";
import type { CrowdfundingProject } from "@/lib/crowdfunding-utils";

const N = MAIN_PIPELINE_STATUSES.length; // 6 — used for track positioning
const CIRCLE_D = 20; // default circle diameter px
const TRACK_TOP = CIRCLE_D / 2; // track y = circle center

type FilterValue = "all" | CrowdfundingStatus;

interface TubeMapFilterProps {
  projects: CrowdfundingProject[];
  activeFilter: FilterValue;
  onFilterChange: (filter: FilterValue) => void;
}

/** Count projects per canonical status */
function countByStatus(projects: CrowdfundingProject[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of projects) {
    const canonical = normalizeStatus(p.status);
    counts[canonical] = (counts[canonical] ?? 0) + 1;
  }
  return counts;
}

/** First 3 project images for a status */
function thumbnailsForStatus(projects: CrowdfundingProject[], status: string): string[] {
  return projects
    .filter((p) => normalizeStatus(p.status) === status && p.image_url)
    .slice(0, 3)
    .map((p) => p.image_url!);
}

export default function TubeMapFilter({ projects, activeFilter, onFilterChange }: TubeMapFilterProps) {
  const counts = countByStatus(projects);
  const [hoveredStation, setHoveredStation] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Rightmost active station on main line
  const activeMainIndex = (() => {
    let maxIdx = -1;
    for (const p of projects) {
      const canonical = normalizeStatus(p.status);
      const idx = (MAIN_PIPELINE_STATUSES as readonly string[]).indexOf(canonical);
      if (idx > maxIdx) maxIdx = idx;
    }
    return maxIdx;
  })();

  const activeBranches = BRANCH_STATUSES.filter((s) => (counts[s] ?? 0) > 0);

  return (
    <div className="mb-8">
      <div className="hidden md:block">
        <DesktopTubeMap
          counts={counts}
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
          activeMainIndex={activeMainIndex}
          activeBranches={activeBranches}
          hoveredStation={hoveredStation}
          setHoveredStation={setHoveredStation}
          projects={projects}
          totalCount={projects.length}
        />
      </div>
      <div className="md:hidden">
        <MobileDotStrip
          counts={counts}
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
          scrollRef={scrollRef}
          totalCount={projects.length}
        />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   Desktop Tube Map
   ════════════════════════════════════════════════════ */

interface DesktopProps {
  counts: Record<string, number>;
  activeFilter: FilterValue;
  onFilterChange: (f: FilterValue) => void;
  activeMainIndex: number;
  activeBranches: string[];
  hoveredStation: string | null;
  setHoveredStation: (s: string | null) => void;
  projects: CrowdfundingProject[];
  totalCount: number;
}

function DesktopTubeMap({
  counts, activeFilter, onFilterChange, activeMainIndex, activeBranches,
  hoveredStation, setHoveredStation, projects, totalCount,
}: DesktopProps) {
  // Track spans from center of first circle to center of last circle.
  // Each grid cell = 100/N %, so circle center = (i + 0.5) * (100/N) %.
  // First center = 50/N %, last center = (N - 0.5) * 100/N % → right offset = 50/N %.
  const trackInset = `${50 / N}%`;

  // Filled track width: from center of station 0 to center of station activeMainIndex.
  // Width = (activeMainIndex * 100/N) %.
  const filledWidth = activeMainIndex > 0
    ? `${activeMainIndex * (100 / N)}%`
    : "0%";

  return (
    <div>
      {/* "All" pill */}
      <button
        onClick={() => onFilterChange("all")}
        className={`font-mono text-[0.6rem] px-3 py-1 mb-4 border-2 border-ink cursor-pointer transition-all ${
          activeFilter === "all" ? "bg-ink text-bg font-bold" : "bg-bg-card hover:bg-ink/5"
        }`}
        style={{ transform: "rotate(-0.3deg)" }}
      >
        All ({totalCount})
      </button>

      {/* ── Main line ─────────────────────────────────────────────────── */}
      <div className="relative" style={{ paddingBottom: "6px" }}>

        {/* Track background — z-index 0, circles z-index 1 sit on top */}
        <div
          className="absolute h-[3px] rounded-full"
          style={{
            top: TRACK_TOP,
            left: trackInset,
            right: trackInset,
            background: "color-mix(in srgb, var(--ink) 12%, transparent)",
            zIndex: 0,
          }}
        />

        {/* Filled portion (progress indicator) */}
        {activeMainIndex > 0 && (
          <div
            className="absolute h-[3px] rounded-full transition-all duration-500"
            style={{
              top: TRACK_TOP,
              left: trackInset,
              width: filledWidth,
              background: "var(--ink)",
              opacity: 0.25,
              zIndex: 0,
            }}
          />
        )}

        {/* Stations — CSS grid so each cell is equal width, circles at top */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${N}, 1fr)`,
            position: "relative",
            zIndex: 1,
          }}
        >
          {MAIN_PIPELINE_STATUSES.map((status) => {
            const step = statusStep(status);
            const count = counts[status] ?? 0;
            const isActive = activeFilter === status;
            const isHovered = hoveredStation === status;
            const hasProjects = count > 0;
            const hex = statusHex(status);
            const thumbs = thumbnailsForStatus(projects, status);
            const circleSize = isActive ? CIRCLE_D + 2 : CIRCLE_D;

            return (
              <div
                key={status}
                className="flex flex-col items-center cursor-pointer"
                onClick={() => onFilterChange(isActive ? "all" : status as CrowdfundingStatus)}
                onMouseEnter={() => setHoveredStation(status)}
                onMouseLeave={() => setHoveredStation(null)}
              >
                {/* Circle — sits directly at top of grid cell, track passes through its center */}
                <div
                  className="rounded-full border-2 transition-all duration-150 flex-shrink-0"
                  style={{
                    width: circleSize,
                    height: circleSize,
                    background: hasProjects
                      ? hex
                      : "color-mix(in srgb, var(--ink) 8%, var(--bg))",
                    borderColor: hasProjects
                      ? hex
                      : "color-mix(in srgb, var(--ink) 20%, transparent)",
                    boxShadow: isActive ? `0 0 0 3px ${hex}33` : "none",
                    transform: isActive ? "scale(1.15)" : "scale(1)",
                    // White center ring for active (interchange style)
                    outline: isActive ? `2px solid var(--bg)` : "none",
                    outlineOffset: "-4px",
                  }}
                />

                {/* Label + count */}
                <span
                  className="font-mono text-[0.48rem] font-bold uppercase mt-1.5 text-center leading-tight"
                  style={{
                    opacity: hasProjects ? (isActive ? 1 : 0.65) : 0.2,
                    color: isActive ? hex : "var(--ink)",
                  }}
                >
                  {step.shortLabel}
                  {hasProjects ? ` (${count})` : ""}
                </span>

                {/* Hover tooltip */}
                {isHovered && hasProjects && (
                  <div
                    className="absolute z-50 bg-bg-card border-2 border-ink p-2 shadow-lg"
                    style={{
                      top: "-4px",
                      transform: "translateY(-100%)",
                      minWidth: "130px",
                      pointerEvents: "none",
                    }}
                  >
                    <div className="font-mono text-[0.6rem] font-bold mb-1.5">
                      {step.label} · {count}
                    </div>
                    {thumbs.length > 0 && (
                      <div className="flex gap-1">
                        {thumbs.map((url, ti) => (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            key={ti}
                            src={url}
                            alt=""
                            className="w-9 h-9 object-cover border border-ink/20"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Branch / off-track row ───────────────────────────────────── */}
      {activeBranches.length > 0 && (
        <div
          className="flex items-center gap-4 flex-wrap mt-3 pt-2"
          style={{
            borderTop: "1px dashed color-mix(in srgb, var(--ink) 15%, transparent)",
            marginLeft: "2px",
          }}
        >
          <span
            className="font-mono text-[0.42rem] font-bold uppercase tracking-widest"
            style={{ opacity: 0.3 }}
          >
            off-track
          </span>

          {activeBranches.map((status) => {
            const step = statusStep(status);
            const count = counts[status] ?? 0;
            const isActive = activeFilter === status;
            const hex = statusHex(status);

            return (
              <button
                key={status}
                onClick={() => onFilterChange(isActive ? "all" : status as CrowdfundingStatus)}
                onMouseEnter={() => setHoveredStation(status)}
                onMouseLeave={() => setHoveredStation(null)}
                className="flex items-center gap-1.5 cursor-pointer bg-transparent border-0 p-0"
              >
                <div
                  className="rounded-full border-2 flex-shrink-0 transition-all"
                  style={{
                    width: "13px",
                    height: "13px",
                    background: isActive ? hex : "transparent",
                    borderColor: hex,
                    boxShadow: isActive ? `0 0 0 2px ${hex}33` : "none",
                    transform: isActive ? "scale(1.15)" : "scale(1)",
                  }}
                />
                <span
                  className="font-mono text-[0.48rem] font-bold uppercase"
                  style={{
                    opacity: isActive ? 1 : 0.5,
                    color: isActive ? hex : "var(--ink)",
                  }}
                >
                  {step.shortLabel} ({count})
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   Mobile Scrollable Dot Strip
   ════════════════════════════════════════════════════ */

interface MobileProps {
  counts: Record<string, number>;
  activeFilter: FilterValue;
  onFilterChange: (f: FilterValue) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  totalCount: number;
}

function MobileDotStrip({ counts, activeFilter, onFilterChange, scrollRef, totalCount }: MobileProps) {
  const allStatuses = [...MAIN_PIPELINE_STATUSES, ...BRANCH_STATUSES];

  return (
    <div>
      <button
        onClick={() => onFilterChange("all")}
        className={`font-mono text-[0.6rem] px-3 py-1 mb-3 border-2 border-ink cursor-pointer transition-all ${
          activeFilter === "all" ? "bg-ink text-bg font-bold" : "bg-bg-card hover:bg-ink/5"
        }`}
      >
        All ({totalCount})
      </button>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
      >
        {allStatuses.map((status) => {
          const step = statusStep(status);
          const count = counts[status] ?? 0;
          const isActive = activeFilter === status;
          const hex = statusHex(status);
          const hasProjects = count > 0;

          if (!hasProjects) return null;

          return (
            <button
              key={status}
              onClick={() => onFilterChange(isActive ? "all" : status as CrowdfundingStatus)}
              className="flex flex-col items-center gap-1 cursor-pointer bg-transparent border-0 p-1 flex-shrink-0"
            >
              <div
                className="rounded-full border-2 transition-all"
                style={{
                  width: isActive ? "28px" : "24px",
                  height: isActive ? "28px" : "24px",
                  background: isActive ? hex : "transparent",
                  borderColor: hex,
                  boxShadow: isActive ? `0 0 0 3px ${hex}33` : "none",
                }}
              />
              <span
                className="font-mono text-[0.45rem] font-bold uppercase whitespace-nowrap"
                style={{ color: isActive ? hex : "var(--ink)", opacity: isActive ? 1 : 0.65 }}
              >
                {step.shortLabel} ({count})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
