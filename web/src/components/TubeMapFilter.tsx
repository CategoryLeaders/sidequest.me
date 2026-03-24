"use client";

/**
 * Tube Map Status Filter — London Underground style, two-line layout.
 * [SQ.S-W-2603-0073] [SQ.S-W-2603-0084] [SQ.S-W-2603-0085]
 *
 * GOOD LINE (green): Pre-Launch → Crowd Funding → Funded/In Prod → Shipping → Delivered
 * BAD LINE  (red):   Cancelled → Not Funded → Failed
 *
 * Three parallel diagonal connectors (42° from vertical) link the lines.
 * Stations are hollow circles (London Tube interchange style).
 *
 * Geometry from playground:
 *   Gaps: [137, 192, 148, 80]  |  Vert: 90px  |  Diag: 42°  |  Arrival gap: 65px
 */

import { useState } from "react";
import {
  MAIN_PIPELINE_STATUSES,
  normalizeStatus,
  type CrowdfundingStatus,
} from "@/lib/crowdfunding-utils";
import type { CrowdfundingProject } from "@/lib/crowdfunding-utils";

// ─── Hover icons per stage ──────────────────────────────────────────────
const STATION_ICONS: Record<string, string> = {
  pre_launch:    "🚀",
  crowdfunding:  "💰",
  in_production: "⚙",
  shipped:       "📦",
  delivered:     "✓",
  cancelled:     "✕",
  failed:        "✗",
  suspended:     "⏸",
};

// ─── Display labels ─────────────────────────────────────────────────────
const TUBE_LABELS: Record<string, string[]> = {
  pre_launch:    ["PRE-LAUNCH"],
  crowdfunding:  ["CROWD", "FUNDING"],
  in_production: ["FUNDED /", "IN PROD"],
  shipped:       ["SHIPPING"],
  delivered:     ["DELIVERED"],
  cancelled:     ["CANCELLED"],
  failed:        ["NOT", "FUNDED"],
  suspended:     ["FAILED"],
};

// ─── Colour scheme ──────────────────────────────────────────────────────
const GOOD_HEX: Record<string, string> = {
  pre_launch:    "#6db36d",
  crowdfunding:  "#2a9d4a",
  in_production: "#1d7a3f",
  shipped:       "#3a8a6a",
  delivered:     "#1e5c3a",
};
const BAD_HEX: Record<string, string> = {
  cancelled: "#e07070",
  failed:    "#c03a3a",
  suspended: "#8b1a1a",
};
const GOOD_TRACK = "#2a9d4a";
const BAD_TRACK  = "#c03a3a";

// ─── SVG geometry (from playground — locked alignment) ──────────────────
const PAD     = 52;
const MAIN_Y  = 60;
const LOWER_Y = 150;
const VW      = 661;

// Good station positions (irregular spacing: 137, 192, 148, 80)
const GOOD_STATIONS = ["pre_launch", "crowdfunding", "in_production", "shipped", "delivered"] as const;
const GOOD_XS: Record<string, number> = {
  pre_launch:    52,
  crowdfunding:  189,
  in_production: 381,
  shipped:       529,
  delivered:     609,
};

// Bad station positions (locked alignment — NF below FIP, Failed below Delivered)
const BAD_STATIONS = ["cancelled", "failed", "suspended"] as const;
const BAD_XS: Record<string, number> = {
  cancelled: 226,   // CF + 37
  failed:    381,   // = FIP_X  (Not Funded)
  suspended: 609,   // = DEL_X  (Failed)
};

// Bad track extents
const LOWER_START = 145;
const LOWER_END   = 645;

// Three parallel diagonals (42° from vertical)
const DIAGS = [
  { topX: 80,  botX: 161 },
  { topX: 235, botX: 316 },
  { topX: 463, botX: 544 },
];

// Sizing
const R         = 11;
const ACTIVE_R  = 14;
const TRACK_W   = 7;
const DIAG_W    = 4;
const STROKE_W  = 3;

// "funded" counts merge into "in_production" visual
const MERGED_INTO_FIP = new Set(["funded"]);

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

  const mergedFipCount = (counts["funded"] ?? 0) + (counts["in_production"] ?? 0);
  const hasBadLine = BAD_STATIONS.some(s => (counts[s] ?? 0) > 0);
  const VH = hasBadLine ? 210 : 115;

  const getCount = (status: string) =>
    status === "in_production" ? mergedFipCount : (counts[status] ?? 0);

  const isActive = (status: string) =>
    status === "in_production"
      ? activeFilter === "in_production" || activeFilter === "funded"
      : activeFilter === status;

  const handleStation = (status: string) => {
    if (status === "in_production") {
      onFilterChange(
        activeFilter === "in_production" || activeFilter === "funded" ? "all" : "in_production"
      );
      return;
    }
    onFilterChange(activeFilter === status ? "all" : (status as CrowdfundingStatus));
  };

  return (
    <div className="mb-8">
      {/* ── Desktop SVG tube map ────────────────────────────────── */}
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
          {/* ── Good track (green) ───────────────────────────── */}
          <line
            x1={GOOD_XS.pre_launch} y1={MAIN_Y}
            x2={GOOD_XS.delivered} y2={MAIN_Y}
            stroke={GOOD_TRACK} strokeOpacity={0.35}
            strokeWidth={TRACK_W} strokeLinecap="round"
          />

          {/* ── Bad track (red) ──────────────────────────────── */}
          {hasBadLine && (
            <line
              x1={LOWER_START} y1={LOWER_Y}
              x2={LOWER_END} y2={LOWER_Y}
              stroke={BAD_TRACK} strokeOpacity={0.35}
              strokeWidth={TRACK_W} strokeLinecap="round"
            />
          )}

          {/* ── Diagonal connectors ─────────────────────────── */}
          {hasBadLine && DIAGS.map(({ topX, botX }, i) => (
            <g key={i}>
              <line
                x1={topX} y1={MAIN_Y} x2={botX} y2={LOWER_Y}
                stroke="currentColor" strokeOpacity={0.2}
                strokeWidth={DIAG_W} strokeLinecap="round"
              />
              <circle cx={topX} cy={MAIN_Y}  r={3} fill="currentColor" fillOpacity={0.14} />
              <circle cx={botX} cy={LOWER_Y} r={3} fill="currentColor" fillOpacity={0.14} />
            </g>
          ))}

          {/* ── Good stations (hollow green circles) ─────────── */}
          {GOOD_STATIONS.map((status) => {
            const cx     = GOOD_XS[status];
            const count  = getCount(status);
            const active = isActive(status);
            const isHov  = hovered === status;
            const hex    = GOOD_HEX[status];
            const r      = active ? ACTIVE_R : R;
            const hasP   = count > 0;
            const labels = TUBE_LABELS[status] ?? [status];

            return (
              <g
                key={status}
                onClick={() => hasP && handleStation(status)}
                onMouseEnter={() => setHovered(status)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: hasP ? "pointer" : "default" }}
              >
                {active && (
                  <circle cx={cx} cy={MAIN_Y} r={r + 6}
                    fill={hex} fillOpacity={0.12} />
                )}
                <circle
                  cx={cx} cy={MAIN_Y} r={r}
                  fill="var(--bg)"
                  stroke={hex}
                  strokeWidth={active ? STROKE_W + 1 : STROKE_W}
                  strokeOpacity={hasP ? 1 : 0.2}
                  opacity={isHov && hasP ? 0.82 : 1}
                />
                {isHov && hasP && STATION_ICONS[status] && (
                  <text
                    x={cx} y={MAIN_Y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="10"
                    style={{ userSelect: "none", pointerEvents: "none" }}
                  >
                    {STATION_ICONS[status]}
                  </text>
                )}
                {labels.map((line, li) => (
                  <text
                    key={li} x={cx}
                    y={MAIN_Y + r + 13 + li * 11}
                    textAnchor="middle" fontSize="9" fontFamily="monospace" fontWeight="bold"
                    fill="currentColor"
                    fillOpacity={hasP ? (active ? 1 : 0.65) : 0.2}
                    style={{ letterSpacing: "0.04em" }}
                  >
                    {line}
                  </text>
                ))}
                {hasP && (
                  <text
                    x={cx}
                    y={MAIN_Y + r + 13 + labels.length * 11 + 4}
                    textAnchor="middle" fontSize="9.5" fontFamily="monospace" fontWeight="bold"
                    fill={active ? hex : "currentColor"}
                    fillOpacity={active ? 1 : 0.45}
                  >
                    {count}
                  </text>
                )}
              </g>
            );
          })}

          {/* ── Bad stations (hollow red circles) ────────────── */}
          {hasBadLine && BAD_STATIONS.map((status) => {
            const cx     = BAD_XS[status];
            const count  = counts[status] ?? 0;
            if (count === 0) return null;

            const active = isActive(status);
            const isHov  = hovered === status;
            const hex    = BAD_HEX[status];
            const r      = active ? ACTIVE_R : R;
            const labels = TUBE_LABELS[status] ?? [status];

            return (
              <g
                key={status}
                onClick={() => handleStation(status)}
                onMouseEnter={() => setHovered(status)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                {active && (
                  <circle cx={cx} cy={LOWER_Y} r={r + 5}
                    fill={hex} fillOpacity={0.12} />
                )}
                <circle
                  cx={cx} cy={LOWER_Y} r={r}
                  fill="var(--bg)"
                  stroke={hex}
                  strokeWidth={active ? STROKE_W + 1 : STROKE_W}
                  opacity={isHov ? 0.82 : 1}
                />
                {isHov && STATION_ICONS[status] && (
                  <text
                    x={cx} y={LOWER_Y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="10"
                    style={{ userSelect: "none", pointerEvents: "none" }}
                  >
                    {STATION_ICONS[status]}
                  </text>
                )}
                {labels.map((line, li) => (
                  <text
                    key={li} x={cx}
                    y={LOWER_Y + r + 13 + li * 11}
                    textAnchor="middle" fontSize="9" fontFamily="monospace" fontWeight="bold"
                    fill="currentColor"
                    fillOpacity={active ? 1 : 0.65}
                    style={{ letterSpacing: "0.04em" }}
                  >
                    {line}
                  </text>
                ))}
                <text
                  x={cx}
                  y={LOWER_Y + r + 13 + labels.length * 11 + 4}
                  textAnchor="middle" fontSize="9.5" fontFamily="monospace" fontWeight="bold"
                  fill={active ? hex : "currentColor"}
                  fillOpacity={active ? 1 : 0.45}
                >
                  {count}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Mobile scrollable dot strip ────────────────────────── */}
      <div className="md:hidden">
        <MobileDotStrip
          counts={counts}
          mergedFipCount={mergedFipCount}
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
          totalCount={projects.length}
        />
      </div>
    </div>
  );
}

/* ─── Mobile Dot Strip ───────────────────────────────────────────────────── */

interface MobileProps {
  counts: Record<string, number>;
  mergedFipCount: number;
  activeFilter: FilterValue;
  onFilterChange: (f: FilterValue) => void;
  totalCount: number;
}

function MobileDotStrip({ counts, mergedFipCount, activeFilter, onFilterChange, totalCount }: MobileProps) {
  const stations = [
    ...GOOD_STATIONS.map(s => ({
      status: s,
      count: s === "in_production" ? mergedFipCount : (counts[s] ?? 0),
      label: (TUBE_LABELS[s]?.[0] ?? s),
      hex: GOOD_HEX[s],
    })),
    ...BAD_STATIONS.map(s => ({
      status: s,
      count: counts[s] ?? 0,
      label: (TUBE_LABELS[s]?.[0] ?? s),
      hex: BAD_HEX[s],
    })),
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
        {stations.map(({ status, count, label, hex }) => {
          const isAct = activeFilter === status ||
            (status === "in_production" && activeFilter === "funded");
          return (
            <button
              key={status}
              onClick={() => onFilterChange(isAct ? "all" : (status as CrowdfundingStatus))}
              className="flex flex-col items-center gap-1 cursor-pointer bg-transparent border-0 p-1 flex-shrink-0"
            >
              <div
                className="rounded-full transition-all"
                style={{
                  width: isAct ? "28px" : "24px",
                  height: isAct ? "28px" : "24px",
                  background: "var(--bg)",
                  border: `3px solid ${hex}`,
                  boxShadow: isAct ? `0 0 0 3px ${hex}33` : "none",
                }}
              />
              <span
                className="font-mono text-[0.45rem] font-bold uppercase whitespace-nowrap"
                style={{ color: isAct ? hex : "var(--ink)", opacity: isAct ? 1 : 0.65 }}
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
