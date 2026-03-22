"use client";

/**
 * Tube Map Status Filter — London Underground style.
 * [SQ.S-W-2603-0073]
 *
 * Main line: Pre-launch → Crowdfunding → Funded → In Production → Shipped → Delivered
 * Branch fork between Crowdfunding and Funded: Failed / Cancelled / Suspended
 *
 * Desktop: full horizontal tube map with track, coloured station dots, counts, hover tooltips.
 * Mobile: scrollable dot strip (Option C from v3 mockup).
 */

import { useState, useRef, useEffect } from "react";
import {
  MAIN_PIPELINE_STATUSES,
  BRANCH_STATUSES,
  statusStep,
  statusHex,
  type CrowdfundingStatus,
} from "@/lib/crowdfunding-utils";
import type { CrowdfundingProject } from "@/lib/crowdfunding-utils";

type FilterValue = "all" | CrowdfundingStatus;

interface TubeMapFilterProps {
  projects: CrowdfundingProject[];
  activeFilter: FilterValue;
  onFilterChange: (filter: FilterValue) => void;
}

/** Count projects per status */
function countByStatus(projects: CrowdfundingProject[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of projects) {
    counts[p.status] = (counts[p.status] ?? 0) + 1;
  }
  return counts;
}

/** Get first 3 project images for a status (tooltip thumbnails) */
function thumbnailsForStatus(projects: CrowdfundingProject[], status: string): string[] {
  return projects
    .filter((p) => p.status === status && p.image_url)
    .slice(0, 3)
    .map((p) => p.image_url!);
}

export default function TubeMapFilter({ projects, activeFilter, onFilterChange }: TubeMapFilterProps) {
  const counts = countByStatus(projects);
  const [hoveredStation, setHoveredStation] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Find the rightmost "active" main station for the fill line
  const activeMainIndex = (() => {
    let maxIdx = -1;
    for (const p of projects) {
      const idx = (MAIN_PIPELINE_STATUSES as readonly string[]).indexOf(p.status);
      if (idx > maxIdx) maxIdx = idx;
    }
    return maxIdx;
  })();

  // Which branch statuses have projects?
  const activeBranches = BRANCH_STATUSES.filter((s) => (counts[s] ?? 0) > 0);

  return (
    <div className="mb-8">
      {/* Desktop tube map */}
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

      {/* Mobile scrollable dot strip */}
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
  return (
    <div className="relative">
      {/* "All" pill */}
      <button
        onClick={() => onFilterChange("all")}
        className={`font-mono text-[0.6rem] px-3 py-1 mb-3 border-2 border-ink cursor-pointer transition-all ${
          activeFilter === "all" ? "bg-ink text-bg font-bold" : "bg-bg-card hover:bg-ink/5"
        }`}
        style={{ transform: "rotate(-0.3deg)" }}
      >
        All ({totalCount})
      </button>

      {/* Main track + stations */}
      <div className="relative flex items-center" style={{ minHeight: "80px" }}>
        {/* Track line (background) */}
        <div
          className="absolute left-[10px] right-[10px] h-[4px] rounded-full"
          style={{
            top: "10px",
            background: "color-mix(in srgb, var(--ink) 12%, transparent)",
          }}
        />

        {/* Filled track line */}
        {activeMainIndex >= 0 && (
          <div
            className="absolute left-[10px] h-[4px] rounded-full transition-all duration-500"
            style={{
              top: "10px",
              width: `${(activeMainIndex / (MAIN_PIPELINE_STATUSES.length - 1)) * 100}%`,
              maxWidth: "calc(100% - 20px)",
              background: "var(--ink)",
              opacity: 0.3,
            }}
          />
        )}

        {/* Stations */}
        <div className="relative flex justify-between w-full">
          {MAIN_PIPELINE_STATUSES.map((status, i) => {
            const step = statusStep(status);
            const count = counts[status] ?? 0;
            const isActive = activeFilter === status;
            const isHovered = hoveredStation === status;
            const hasProjects = count > 0;
            const hex = statusHex(status);
            const thumbs = thumbnailsForStatus(projects, status);

            return (
              <div
                key={status}
                className="relative flex flex-col items-center cursor-pointer group"
                style={{ flex: "1 1 0", maxWidth: `${100 / MAIN_PIPELINE_STATUSES.length}%` }}
                onClick={() => onFilterChange(isActive ? "all" : status as CrowdfundingStatus)}
                onMouseEnter={() => setHoveredStation(status)}
                onMouseLeave={() => setHoveredStation(null)}
              >
                {/* Station dot */}
                <div
                  className="rounded-full border-2 transition-all duration-200 flex-shrink-0"
                  style={{
                    width: isActive ? "22px" : "20px",
                    height: isActive ? "22px" : "20px",
                    background: hasProjects ? hex : "color-mix(in srgb, var(--ink) 8%, var(--bg))",
                    borderColor: hasProjects ? hex : "color-mix(in srgb, var(--ink) 20%, transparent)",
                    boxShadow: isActive ? `0 0 0 3px ${hex}40` : "none",
                    transform: isActive ? "scale(1.15)" : "scale(1)",
                  }}
                />

                {/* Station name */}
                <span
                  className="font-mono text-[0.55rem] font-bold uppercase mt-1.5 text-center leading-tight transition-opacity"
                  style={{ opacity: hasProjects ? 0.8 : 0.25 }}
                >
                  {step.shortLabel}
                </span>

                {/* Count */}
                <span
                  className="font-mono text-[0.5rem] mt-0.5 transition-opacity"
                  style={{ opacity: hasProjects ? 0.5 : 0.15 }}
                >
                  {count}
                </span>

                {/* Hover tooltip */}
                {isHovered && hasProjects && (
                  <div
                    className="absolute z-50 bg-bg-card border-2 border-ink p-2 shadow-lg"
                    style={{
                      top: "-8px",
                      transform: "translateY(-100%)",
                      minWidth: "120px",
                      pointerEvents: "none",
                    }}
                  >
                    <div className="font-mono text-[0.6rem] font-bold mb-1">
                      {step.label} ({count})
                    </div>
                    {thumbs.length > 0 && (
                      <div className="flex gap-1">
                        {thumbs.map((url, ti) => (
                          <img
                            key={ti}
                            src={url}
                            alt=""
                            className="w-8 h-8 object-cover border border-ink/20"
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

      {/* Branch line — fork off between Crowdfunding (index 1) and Funded (index 2) */}
      {activeBranches.length > 0 && (
        <div className="relative ml-[16.6%] mt-1" style={{ width: "fit-content" }}>
          {/* Diagonal connector */}
          <div
            className="absolute w-[2px] h-[16px] bg-ink/20"
            style={{
              top: "-16px",
              left: "0px",
              transform: "rotate(30deg)",
              transformOrigin: "top left",
            }}
          />

          {/* Branch stations */}
          <div className="flex gap-4 items-center ml-2">
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
                    className="rounded-full border-2 flex-shrink-0"
                    style={{
                      width: "14px",
                      height: "14px",
                      background: hex,
                      borderColor: hex,
                      boxShadow: isActive ? `0 0 0 2px ${hex}40` : "none",
                    }}
                  />
                  <span
                    className="font-mono text-[0.5rem] uppercase"
                    style={{ opacity: 0.5 }}
                  >
                    {step.shortLabel} ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   Mobile Scrollable Dot Strip (Option C)
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
      {/* All button */}
      <button
        onClick={() => onFilterChange("all")}
        className={`font-mono text-[0.6rem] px-3 py-1 mb-3 border-2 border-ink cursor-pointer transition-all ${
          activeFilter === "all" ? "bg-ink text-bg font-bold" : "bg-bg-card hover:bg-ink/5"
        }`}
      >
        All ({totalCount})
      </button>

      {/* Scrollable strip */}
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
                  background: hex,
                  borderColor: hex,
                  boxShadow: isActive ? `0 0 0 3px ${hex}40` : "none",
                }}
              />
              <span className="font-mono text-[0.5rem] font-bold uppercase whitespace-nowrap">
                {step.shortLabel}
              </span>
              <span className="font-mono text-[0.45rem]" style={{ opacity: 0.4 }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
