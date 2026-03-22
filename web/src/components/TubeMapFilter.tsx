"use client";

/**
 * Tube Map Status Filter — London Underground style, SVG-based.
 * [SQ.S-W-2603-0073] [SQ.S-W-2603-0084] [SQ.S-W-2603-0085]
 *
 * Main line: Pre-Launch → Crowdfunding → Funded → In Production → Shipped → Delivered
 * Branch:    Bezier curve diverging from the Crowdfunding station down to
 *            Failed / Cancelled / Suspended circles.
 *
 * Desktop: SVG viewBox scales with container.
 * Mobile:  Scrollable dot strip.
 */

import { useState } from "react";
import {
  MAIN_PIPELINE_STATUSES,
  BRANCH_STATUSES,
  statusHex,
  normalizeStatus,
  type CrowdfundingStatus,
} from "@/lib/crowdfunding-utils";
import type { CrowdfundingProject } from "@/lib/crowdfunding-utils";

// Local display labels — avoids the duplicate "Fund" in shared STEP_MAP
const TUBE_LABELS: Record<string, string[]> = {
  pre_launch:    ["Pre-Launch"],
  crowdfunding:  ["Crowd", "Funding"],
  funded:        ["Funded"],
  in_production: ["In Prod"],
  shipped:       ["Shipped"],
  delivered:     ["Here!"],
  failed:        ["Failed"],
  cancelled:     ["Cancelled"],
  suspended:     ["Suspended"],
};

// ─── SVG geometry ─────────────────────────────────────────────────────────
const VW = 880;
const MAIN_Y = 52;
const BRANCH_Y = 158;
const PAD = 60;
const N = MAIN_PIPELINE_STATUSES.length; // 6
const SPACING = (VW - 2 * PAD) / (N - 1); // 152
const MAIN_XS = Array.from({ length: N }, (_, i) => Math.round(PAD + i * SPACING));
// ≈ [60, 212, 364, 516, 668, 820]

// Branch diverges from the Crowdfunding station (index 1)
const BRANCH_JOIN_X = MAIN_XS[1]; // 212
const BRANCH_STATION_START_X = 330;
const BRANCH_STATION_SPACING = 145;
const BRANCH_XS = BRANCH_STATUSES.map((_, i) => BRANCH_STATION_START_X + i * BRANCH_STATION_SPACING);
// ≈ [330, 475, 620]

const MAIN_R = 12;
const ACTIVE_R = 15;
const BRANCH_R = 10;
const BRANCH_ACTIVE_R = 13;
const TRACK_W = 5;
const BRANCH_TRACK_W = 4;

type FilterValue = "all" | CrowdfundingStatus;

interface TubeMapFilterProps {
  projects: CrowdfundingProject[];
  activeFilter: FilterValue;
  onFilterChange: (filter: FilterValue) => void;
}

function countByStatus(projects: CrowdfundingProject[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of projects) {
    const canonical = normalizeStatus(p.status);
    counts[canonical] = (counts[canonical] ?? 0) + 1;
  }
  return counts;
}

export default function TubeMapFilter({ projects, activeFilter, onFilterChange }: TubeMapFilterProps) {
  const counts = countByStatus(projects);
  const [hovered, setHovered] = useState<string | null>(null);

  const hasBranch = BRANCH_STATUSES.some((s) => (counts[s] ?? 0) > 0);

  // Height: with branch ~210, without ~110
  const VH = hasBranch ? 210 : 110;

  // Rightmost active station index on the main line (for progress track)
  const activeMainIndex = (() => {
    let maxIdx = -1;
    for (const p of projects) {
      const canonical = normalizeStatus(p.status);
      const idx = (MAIN_PIPELINE_STATUSES as readonly string[]).indexOf(canonical);
      if (idx > maxIdx) maxIdx = idx;
    }
    return maxIdx;
  })();

  const handleStation = (status: string) => {
    if (activeFilter === status) {
      onFilterChange("all");
    } else {
      onFilterChange(status as CrowdfundingStatus);
    }
  };

  return (
    <div className="mb-8">
      {/* ── Desktop SVG tube map ──────────────────────────────────── */}
      <div className="hidden md:block">
        {/* "All" pill */}
        <button
          onClick={() => onFilterChange("all")}
          className={`font-mono text-[0.6rem] px-3 py-1 mb-4 border-2 border-ink cursor-pointer transition-all ${
            activeFilter === "all" ? "bg-ink text-bg font-bold" : "bg-bg-card hover:bg-ink/5"
          }`}
          style={{ transform: "rotate(-0.3deg)" }}
        >
          All ({projects.length})
        </button>

        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          width="100%"
          style={{ overflow: "visible", userSelect: "none", display: "block" }}
        >
          {/* ── Main track (background) ────────────────────────── */}
          <line
            x1={MAIN_XS[0]} y1={MAIN_Y}
            x2={MAIN_XS[N - 1]} y2={MAIN_Y}
            stroke="currentColor"
            strokeOpacity={0.12}
            strokeWidth={TRACK_W}
            strokeLinecap="round"
          />

          {/* ── Main track (progress fill) ─────────────────────── */}
          {activeMainIndex > 0 && (
            <line
              x1={MAIN_XS[0]} y1={MAIN_Y}
              x2={MAIN_XS[activeMainIndex]} y2={MAIN_Y}
              stroke="currentColor"
              strokeOpacity={0.28}
              strokeWidth={TRACK_W}
              strokeLinecap="round"
            />
          )}

          {/* ── Branch track: bezier curve + horizontal run ─────── */}
          {hasBranch && (
            <>
              {/* Bezier: from crowdfunding station straight down then sweeping right */}
              <path
                d={`M ${BRANCH_JOIN_X} ${MAIN_Y} Q ${BRANCH_JOIN_X} ${BRANCH_Y} ${BRANCH_STATION_START_X} ${BRANCH_Y}`}
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.18}
                strokeWidth={BRANCH_TRACK_W}
                strokeLinecap="round"
              />
              {/* Horizontal extension to last branch station */}
              {BRANCH_XS.length > 1 && (
                <line
                  x1={BRANCH_STATION_START_X} y1={BRANCH_Y}
                  x2={BRANCH_XS[BRANCH_XS.length - 1]} y2={BRANCH_Y}
                  stroke="currentColor"
                  strokeOpacity={0.18}
                  strokeWidth={BRANCH_TRACK_W}
                  strokeLinecap="round"
                />
              )}
            </>
          )}

          {/* ── Main stations ──────────────────────────────────────── */}
          {MAIN_PIPELINE_STATUSES.map((status, i) => {
            const count = counts[status] ?? 0;
            const isActive = activeFilter === status;
            const isHov = hovered === status;
            const hex = statusHex(status);
            const r = isActive ? ACTIVE_R : MAIN_R;
            const hasProjects = count > 0;
            const cx = MAIN_XS[i];
            const labels = TUBE_LABELS[status] ?? [status];

            return (
              <g
                key={status}
                onClick={() => hasProjects && handleStation(status)}
                onMouseEnter={() => setHovered(status)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: hasProjects ? "pointer" : "default" }}
              >
                {/* Glow halo for active */}
                {isActive && (
                  <circle cx={cx} cy={MAIN_Y} r={r + 6}
                    fill={hex} fillOpacity={0.15} />
                )}

                {/* Station circle */}
                <circle
                  cx={cx} cy={MAIN_Y} r={r}
                  fill={hasProjects ? hex : "var(--bg)"}
                  stroke={hasProjects ? hex : "currentColor"}
                  strokeOpacity={hasProjects ? 1 : 0.2}
                  strokeWidth={2.5}
                  style={{ transition: "r 0.15s, opacity 0.15s" }}
                  opacity={isHov && hasProjects ? 0.82 : 1}
                />

                {/* White interchange ring for active station */}
                {isActive && (
                  <circle cx={cx} cy={MAIN_Y} r={r - 4}
                    fill="var(--bg)" fillOpacity={0.65} />
                )}

                {/* Station labels */}
                {labels.map((line, li) => (
                  <text
                    key={li}
                    x={cx}
                    y={MAIN_Y + ACTIVE_R + 12 + li * 11}
                    textAnchor="middle"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                    fill="currentColor"
                    fillOpacity={hasProjects ? (isActive ? 1 : 0.65) : 0.2}
                    style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}
                  >
                    {line}
                  </text>
                ))}

                {/* Count on its own line */}
                {hasProjects && (
                  <text
                    x={cx}
                    y={MAIN_Y + ACTIVE_R + 12 + labels.length * 11 + 3}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                    fill={isActive ? hex : "currentColor"}
                    fillOpacity={isActive ? 1 : 0.45}
                  >
                    {count}
                  </text>
                )}
              </g>
            );
          })}

          {/* ── Branch stations ────────────────────────────────────── */}
          {hasBranch && BRANCH_STATUSES.map((status, i) => {
            const count = counts[status] ?? 0;
            if (count === 0) return null;

            const isActive = activeFilter === status;
            const isHov = hovered === status;
            const hex = statusHex(status);
            const r = isActive ? BRANCH_ACTIVE_R : BRANCH_R;
            const cx = BRANCH_XS[i];
            const labels = TUBE_LABELS[status] ?? [status];

            return (
              <g
                key={status}
                onClick={() => handleStation(status)}
                onMouseEnter={() => setHovered(status)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                {isActive && (
                  <circle cx={cx} cy={BRANCH_Y} r={r + 5}
                    fill={hex} fillOpacity={0.15} />
                )}

                <circle
                  cx={cx} cy={BRANCH_Y} r={r}
                  fill={hex}
                  stroke={hex}
                  strokeWidth={2.5}
                  opacity={isHov ? 0.82 : 1}
                />

                {isActive && (
                  <circle cx={cx} cy={BRANCH_Y} r={r - 3}
                    fill="var(--bg)" fillOpacity={0.65} />
                )}

                {labels.map((line, li) => (
                  <text
                    key={li}
                    x={cx}
                    y={BRANCH_Y + BRANCH_ACTIVE_R + 12 + li * 11}
                    textAnchor="middle"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                    fill="currentColor"
                    fillOpacity={isActive ? 1 : 0.65}
                    style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}
                  >
                    {line}
                  </text>
                ))}

                <text
                  x={cx}
                  y={BRANCH_Y + BRANCH_ACTIVE_R + 12 + labels.length * 11 + 3}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                  fill={isActive ? hex : "currentColor"}
                  fillOpacity={isActive ? 1 : 0.45}
                >
                  {count}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Mobile scrollable dot strip ──────────────────────────── */}
      <div className="md:hidden">
        <MobileDotStrip
          counts={counts}
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
          totalCount={projects.length}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Mobile Scrollable Dot Strip
   ═══════════════════════════════════════════════════════════════════════════ */

interface MobileProps {
  counts: Record<string, number>;
  activeFilter: FilterValue;
  onFilterChange: (f: FilterValue) => void;
  totalCount: number;
}

function MobileDotStrip({ counts, activeFilter, onFilterChange, totalCount }: MobileProps) {
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

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
        {allStatuses.map((status) => {
          const count = counts[status] ?? 0;
          if (count === 0) return null;

          const isActive = activeFilter === status;
          const hex = statusHex(status);
          const labels = TUBE_LABELS[status] ?? [status];

          return (
            <button
              key={status}
              onClick={() =>
                onFilterChange(isActive ? "all" : (status as CrowdfundingStatus))
              }
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
                {labels[0]} ({count})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
