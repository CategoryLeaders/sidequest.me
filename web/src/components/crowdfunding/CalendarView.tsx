"use client";

/**
 * Calendar view for backed projects.
 * Navigable 12-month rolling grid with greyed past months.
 * [SQ.S-W-2603-0083]
 *
 * - Default window: 3 months back → 8 months forward (12 total).
 * - Months before today shown greyed with dashed border.
 * - Prev / Next navigation moves the window by 3 months.
 * - Year label shown in each cell; year-change cells get a subtle year banner.
 * - Projects outside the 12-month window appear in "Unscheduled".
 */

import { useState, useMemo } from "react";
import type { CrowdfundingProject } from "@/lib/crowdfunding-utils";
import { statusHex, parseDeliveryDeadline } from "@/lib/crowdfunding-utils";

interface CalendarViewProps {
  projects: CrowdfundingProject[];
  onProjectClick: (project: CrowdfundingProject) => void;
}

const TODAY = new Date();
const CURRENT_MONTH_KEY = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, "0")}`;

/** Generate 12-month window starting at (today + offsetMonths) */
function getMonthGrid(offsetMonths: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(TODAY.getFullYear(), TODAY.getMonth() + offsetMonths + i, 1);
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return result;
}

/** Group projects into the grid window or unscheduled */
function groupProjects(projects: CrowdfundingProject[], gridKeySet: Set<string>) {
  const scheduled = new Map<string, CrowdfundingProject[]>();
  const unscheduled: CrowdfundingProject[] = [];

  for (const p of projects) {
    let deadline: Date | null = null;

    if ((p as any).est_delivery_deadline) {
      deadline = new Date((p as any).est_delivery_deadline);
    } else if (p.est_delivery) {
      deadline = parseDeliveryDeadline(p.est_delivery);
    }

    if (deadline && !isNaN(deadline.getTime())) {
      const key = `${deadline.getFullYear()}-${String(deadline.getMonth() + 1).padStart(2, "0")}`;
      if (gridKeySet.has(key)) {
        if (!scheduled.has(key)) scheduled.set(key, []);
        scheduled.get(key)!.push(p);
      } else {
        unscheduled.push(p);
      }
    } else {
      unscheduled.push(p);
    }
  }

  return { scheduled, unscheduled };
}

/** "Mar 2026" style label */
function monthLabel(key: string): { month: string; year: string } {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return {
    month: date.toLocaleDateString("en-GB", { month: "short" }).toUpperCase(),
    year: String(year),
  };
}

/** Is this month key before the current month? */
function isPastMonth(key: string): boolean {
  return key < CURRENT_MONTH_KEY;
}

export default function CalendarView({ projects, onProjectClick }: CalendarViewProps) {
  // Default: start 3 months back so past months are visible
  const [offset, setOffset] = useState(-3);

  const gridKeys = useMemo(() => getMonthGrid(offset), [offset]);
  const gridKeySet = useMemo(() => new Set(gridKeys), [gridKeys]);
  const { scheduled, unscheduled } = useMemo(
    () => groupProjects(projects, gridKeySet),
    [projects, gridKeySet]
  );

  return (
    <div>
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setOffset((o) => o - 3)}
          className="font-mono text-[0.55rem] uppercase px-2.5 py-1 border-2 border-ink/30 hover:border-ink/60 cursor-pointer transition-all bg-transparent"
        >
          ← 3 months
        </button>
        <span className="font-mono text-[0.55rem] uppercase opacity-30">
          {gridKeys[0] && monthLabel(gridKeys[0]).month} {gridKeys[0] && monthLabel(gridKeys[0]).year}
          {" — "}
          {gridKeys[11] && monthLabel(gridKeys[11]).month} {gridKeys[11] && monthLabel(gridKeys[11]).year}
        </span>
        <button
          onClick={() => setOffset((o) => o + 3)}
          className="font-mono text-[0.55rem] uppercase px-2.5 py-1 border-2 border-ink/30 hover:border-ink/60 cursor-pointer transition-all bg-transparent"
        >
          3 months →
        </button>
      </div>

      {/* 12-month grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {gridKeys.map((key, idx) => {
          const monthProjects = scheduled.get(key) ?? [];
          const isCurrent = key === CURRENT_MONTH_KEY;
          const isPast = isPastMonth(key);
          const { month, year } = monthLabel(key);

          // Show year when it changes from previous cell (or first cell)
          const prevYear = idx > 0 ? monthLabel(gridKeys[idx - 1]).year : null;
          const showYear = !prevYear || year !== prevYear;

          return (
            <div
              key={key}
              className="p-3 min-h-[100px] transition-opacity"
              style={{
                border: isCurrent
                  ? "2px solid var(--orange)"
                  : isPast
                  ? "2px dashed color-mix(in srgb, var(--ink) 12%, transparent)"
                  : "2px solid color-mix(in srgb, var(--ink) 15%, transparent)",
                opacity: isPast ? 0.55 : 1,
              }}
            >
              {/* Month header */}
              <div className="flex items-start justify-between mb-2 gap-1">
                <div>
                  <span
                    className="font-head font-bold text-[0.7rem] uppercase leading-tight block"
                    style={{ opacity: isCurrent ? 1 : 0.7 }}
                  >
                    {month}
                  </span>
                  {showYear && (
                    <span
                      className="font-mono text-[0.5rem] uppercase leading-none block"
                      style={{ opacity: isCurrent ? 0.6 : 0.35 }}
                    >
                      {year}
                    </span>
                  )}
                </div>
                {isCurrent && (
                  <span className="font-mono text-[0.4rem] uppercase px-1 py-0.5 bg-orange text-bg font-bold flex-shrink-0">
                    Now
                  </span>
                )}
              </div>

              {/* Projects in this month */}
              {monthProjects.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {monthProjects.map((p) => {
                    const hex = statusHex(p.status);
                    return (
                      <button
                        key={p.id}
                        onClick={() => onProjectClick(p)}
                        className="flex items-center gap-1.5 p-1 border border-ink/10 hover:border-ink/30 transition-colors cursor-pointer bg-transparent text-left w-full"
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: hex }}
                        />
                        {p.image_url && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={p.image_url}
                            alt=""
                            className="w-6 h-6 object-cover border border-ink/10 flex-shrink-0"
                          />
                        )}
                        <span className="font-mono text-[0.5rem] font-bold uppercase truncate leading-tight">
                          {(p as any).short_name || p.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <span className="font-mono text-[0.45rem] opacity-15 uppercase">—</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Unscheduled (no date or outside window) */}
      {unscheduled.length > 0 && (
        <div className="border-t-2 border-ink/10 pt-4">
          <span className="font-mono text-[0.6rem] uppercase opacity-40 block mb-3">
            Unscheduled ({unscheduled.length})
          </span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {unscheduled.map((p) => {
              const hex = statusHex(p.status);
              return (
                <button
                  key={p.id}
                  onClick={() => onProjectClick(p)}
                  className="flex items-center gap-2 p-2 border border-ink/10 hover:border-ink/30 transition-colors cursor-pointer bg-transparent text-left"
                >
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: hex }} />
                  <span className="font-mono text-[0.5rem] font-bold uppercase truncate">
                    {(p as any).short_name || p.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {projects.length === 0 && (
        <p className="text-center opacity-40 font-mono text-[0.8rem] py-12">
          No projects to show.
        </p>
      )}
    </div>
  );
}
