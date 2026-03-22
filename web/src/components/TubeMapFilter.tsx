"use client";

/**
 * Tube Map Status Filter — London Underground style, SVG-based.
 * [SQ.S-W-2603-0073] [SQ.S-W-2603-0084] [SQ.S-W-2603-0085]
 *
 * Main line: Pre-Launch → Crowdfunding → Funded/In Production → Shipped → Delivered
 *
 * Two branches, both diverging between Crowd Funding and Funded/In Production:
 *   Branch A (just after Crowd Funding)  → CANCELLED
 *   Branch B (just right of A)           → FAILED / NOT FUNDED
 *
 * Both branch stations sit at the same vertical depth, side by side.
 */

import { useState } from "react";
import {
  MAIN_PIPELINE_STATUSES,
  statusHex,
  normalizeStatus,
  type CrowdfundingStatus,
} from "@/lib/crowdfunding-utils";
import type { CrowdfundingProject } from "@/lib/crowdfunding-utils";

// ─── Display labels ────────────────────────────────────────────────────────
// Defined locally — avoids the duplicate "Fund" shortLabel in shared STEP_MAP
const TUBE_LABELS: Record<string, string[]> = {
  pre_launch:    ["PRE-LAUNCH"],
  crowdfunding:  ["CROWD", "FUNDING"],
  funded:        ["FUNDED /", "IN PROD"],       // merged visual label
  in_production: ["FUNDED /", "IN PROD"],       // same merged label as funded
  shipped:       ["SHIPPED"],
  delivered:     ["HERE!"],
  failed:        ["FAILED /", "NOT FUNDED"],
  cancelled:     ["CANCELLED"],
  suspended:     ["SUSPENDED"],
};

// ─── SVG geometry ─────────────────────────────────────────────────────────
const VW = 880;
const MAIN_Y = 52;
const BRANCH_Y = 162;
const PAD = 60;
const N = MAIN_PIPELINE_STATUSES.length; // 6
const SPACING = (VW - 2 * PAD) / (N - 1); // ≈ 152
const MAIN_XS = Array.from({ length: N }, (_, i) => Math.round(PAD + i * SPACING));
// ≈ [60, 212, 364, 516, 668, 820]
// Indices:  0=pre_launch  1=crowdfunding  2=funded  3=in_production  4=shipped  5=delivered

// Branch diverge points — between crowdfunding (212) and funded (364)
const BRANCH_A_X = 250; // just after crowdfunding
const BRANCH_B_X = 295; // just right of A

// Branch station positions — same Y level, side by side
const CANCELLED_X = 195;
const FAILED_X = 330;
// Suspended (rarely populated) — to the right of failed
const SUSPENDED_X = 465;

const MAIN_R = 12;
const ACTIVE_R = 15;
const BRANCH_R = 10;
const BRANCH_ACTIVE_R = 13;
const TRACK_W = 5;
const BRANCH_TRACK_W = 4;

// For the merged FUNDED/IN PRODUCTION display: treat these two as one visual station
// We only render the in_production circle (index 3), and label it "FUNDED / IN PROD"
// The funded circle (index 2) is skipped visually; projects at "funded" count toward in_production label
const MERGED_STATIONS = new Set(["funded"]); // hidden from main line

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

  const hasCancelled = (counts["cancelled"] ?? 0) > 0;
  const hasFailed    = (counts["failed"]    ?? 0) > 0;
  const hasSuspended = (counts["suspended"] ?? 0) > 0;
  const hasBranch    = hasCancelled || hasFailed || hasSuspended;

  const VH = hasBranch ? 218 : 110;

  // Merge funded count into in_production for the combined visual label
  const mergedInProdCount = (counts["funded"] ?? 0) + (counts["in_production"] ?? 0);

  // Rightmost populated main station index (for progress fill)
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
    // Clicking FUNDED/IN PROD circle toggles both statuses together
    if (status === "in_production") {
      if (activeFilter === "in_production" || activeFilter === "funded") {
        onFilterChange("all");
      } else {
        onFilterChange("in_production");
      }
      return;
    }
    onFilterChange(activeFilter === status ? "all" : (status as CrowdfundingStatus));
  };

  const isInProdActive = activeFilter === "in_production" || activeFilter === "funded";

  return (
    <div className="mb-8">
      {/* ── Desktop SVG tube map ───────────────────────────────── */}
      <div className="hidden md:block">
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
          {/* ── Main track (background) ──────────────────────── */}
          <line
            x1={MAIN_XS[0]} y1={MAIN_Y}
            x2={MAIN_XS[N - 1]} y2={MAIN_Y}
            stroke="currentColor" strokeOpacity={0.12}
            strokeWidth={TRACK_W} strokeLinecap="round"
          />

          {/* ── Main track (progress fill) ──────────────────── */}
          {activeMainIndex > 0 && (
            <line
              x1={MAIN_XS[0]} y1={MAIN_Y}
              x2={MAIN_XS[activeMainIndex]} y2={MAIN_Y}
              stroke="currentColor" strokeOpacity={0.28}
              strokeWidth={TRACK_W} strokeLinecap="round"
            />
          )}

          {/* ── Branch tracks ────────────────────────────────── */}
          {hasBranch && (
            <>
              {/* Branch A: just after crowdfunding → CANCELLED (curves left) */}
              {hasCancelled && (
                <path
                  d={`M ${BRANCH_A_X} ${MAIN_Y} Q ${BRANCH_A_X} ${BRANCH_Y} ${CANCELLED_X} ${BRANCH_Y}`}
                  fill="none"
                  stroke="currentColor" strokeOpacity={0.18}
                  strokeWidth={BRANCH_TRACK_W} strokeLinecap="round"
                />
              )}

              {/* Branch B: just right of A → FAILED/NOT FUNDED (curves right) */}
              {hasFailed && (
                <path
                  d={`M ${BRANCH_B_X} ${MAIN_Y} Q ${BRANCH_B_X} ${BRANCH_Y} ${FAILED_X} ${BRANCH_Y}`}
                  fill="none"
                  stroke="currentColor" strokeOpacity={0.18}
                  strokeWidth={BRANCH_TRACK_W} strokeLinecap="round"
                />
              )}

              {/* Suspended: horizontal extension from failed if populated */}
              {hasSuspended && hasFailed && (
                <line
                  x1={FAILED_X} y1={BRANCH_Y}
                  x2={SUSPENDED_X} y2={BRANCH_Y}
                  stroke="currentColor" strokeOpacity={0.14}
                  strokeWidth={BRANCH_TRACK_W} strokeLinecap="round"
                />
              )}
              {hasSuspended && !hasFailed && (
                <path
                  d={`M ${BRANCH_B_X} ${MAIN_Y} Q ${BRANCH_B_X} ${BRANCH_Y} ${SUSPENDED_X} ${BRANCH_Y}`}
                  fill="none"
                  stroke="currentColor" strokeOpacity={0.14}
                  strokeWidth={BRANCH_TRACK_W} strokeLinecap="round"
                />
              )}
            </>
          )}

          {/* ── Main stations ──────────────────────────────────── */}
          {MAIN_PIPELINE_STATUSES.map((status, i) => {
            // Skip "funded" — it's merged into the in_production circle
            if (MERGED_STATIONS.has(status)) return null;

            const rawCount = counts[status] ?? 0;
            const displayCount = status === "in_production" ? mergedInProdCount : rawCount;
            const isActive = status === "in_production" ? isInProdActive : activeFilter === status;
            const isHov = hovered === status;
            const hex = statusHex(status);
            const r = isActive ? ACTIVE_R : MAIN_R;
            const hasProjects = displayCount > 0;
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
                {isActive && (
                  <circle cx={cx} cy={MAIN_Y} r={r + 6}
                    fill={hex} fillOpacity={0.15} />
                )}
                <circle
                  cx={cx} cy={MAIN_Y} r={r}
                  fill={hasProjects ? hex : "var(--bg)"}
                  stroke={hasProjects ? hex : "currentColor"}
                  strokeOpacity={hasProjects ? 1 : 0.2}
                  strokeWidth={2.5}
                  opacity={isHov && hasProjects ? 0.82 : 1}
                />
                {isActive && (
                  <circle cx={cx} cy={MAIN_Y} r={r - 4}
                    fill="var(--bg)" fillOpacity={0.65} />
                )}

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
                    style={{ letterSpacing: "0.04em" }}
                  >
                    {line}
                  </text>
                ))}

                {hasProjects && (
                  <text
                    x={cx}
                    y={MAIN_Y + ACTIVE_R + 12 + labels.length * 11 + 4}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                    fill={isActive ? hex : "currentColor"}
                    fillOpacity={isActive ? 1 : 0.45}
                  >
                    {displayCount}
                  </text>
                )}
              </g>
            );
          })}

          {/* ── Branch stations ────────────────────────────────── */}
          {([
            hasCancelled && { status: "cancelled", cx: CANCELLED_X },
            hasFailed    && { status: "failed",    cx: FAILED_X    },
            hasSuspended && { status: "suspended", cx: SUSPENDED_X },
          ] as const).filter(Boolean).map((item: any) => {
            const { status, cx } = item;
            const count = counts[status] ?? 0;
            if (count === 0) return null;

            const isActive = activeFilter === status;
            const isHov = hovered === status;
            const hex = statusHex(status);
            const r = isActive ? BRANCH_ACTIVE_R : BRANCH_R;
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
                  fill={hex} stroke={hex} strokeWidth={2.5}
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
                    style={{ letterSpacing: "0.04em" }}
                  >
                    {line}
                  </text>
                ))}

                <text
                  x={cx}
                  y={BRANCH_Y + BRANCH_ACTIVE_R + 12 + labels.length * 11 + 4}
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
          mergedInProdCount={mergedInProdCount}
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
          totalCount={projects.length}
        />
      </div>
    </div>
  );
}

/* ─── Mobile Dot Strip ────────────────────────────────────────────────────── */

interface MobileProps {
  counts: Record<string, number>;
  mergedInProdCount: number;
  activeFilter: FilterValue;
  onFilterChange: (f: FilterValue) => void;
  totalCount: number;
}

function MobileDotStrip({ counts, mergedInProdCount, activeFilter, onFilterChange, totalCount }: MobileProps) {
  const stations = [
    ...MAIN_PIPELINE_STATUSES
      .filter(s => s !== "funded")
      .map(s => ({
        status: s,
        count: s === "in_production" ? mergedInProdCount : (counts[s] ?? 0),
        label: s === "in_production" ? "F/IP" : (TUBE_LABELS[s]?.[0] ?? s),
      })),
    { status: "cancelled", count: counts["cancelled"] ?? 0, label: "CANC" },
    { status: "failed",    count: counts["failed"]    ?? 0, label: "FAIL" },
    { status: "suspended", count: counts["suspended"] ?? 0, label: "SUSP" },
  ].filter(s => s.count > 0);

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
        {stations.map(({ status, count, label }) => {
          const isActive = activeFilter === status ||
            (status === "in_production" && activeFilter === "funded");
          const hex = statusHex(status);
          return (
            <button
              key={status}
              onClick={() => onFilterChange(isActive ? "all" : (status as CrowdfundingStatus))}
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
                {label} ({count})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
