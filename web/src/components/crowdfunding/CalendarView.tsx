"use client";

/**
 * Calendar view for backed projects.
 * Monthly grid showing projects placed by est_delivery_deadline.
 * [SQ.S-W-2603-0078]
 */

import { useState, useMemo } from "react";
import type { CrowdfundingProject } from "@/lib/crowdfunding-utils";
import { statusHex, parseDeliveryDeadline } from "@/lib/crowdfunding-utils";

interface CalendarViewProps {
  projects: CrowdfundingProject[];
  onProjectClick: (project: CrowdfundingProject) => void;
}

/** Group projects by YYYY-MM key from est_delivery_deadline */
function groupByMonth(projects: CrowdfundingProject[]) {
  const scheduled = new Map<string, CrowdfundingProject[]>();
  const unscheduled: CrowdfundingProject[] = [];

  for (const p of projects) {
    // Use est_delivery_deadline if present, otherwise try parsing est_delivery
    let deadline: Date | null = null;

    if ((p as any).est_delivery_deadline) {
      deadline = new Date((p as any).est_delivery_deadline);
    } else if (p.est_delivery) {
      deadline = parseDeliveryDeadline(p.est_delivery);
    }

    if (deadline && !isNaN(deadline.getTime())) {
      const key = `${deadline.getFullYear()}-${String(deadline.getMonth() + 1).padStart(2, "0")}`;
      if (!scheduled.has(key)) scheduled.set(key, []);
      scheduled.get(key)!.push(p);
    } else {
      unscheduled.push(p);
    }
  }

  return { scheduled, unscheduled };
}

/** Get month label from YYYY-MM key */
function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

/** Get sorted month keys spanning from earliest to latest, including empty months */
function getMonthRange(keys: string[]): string[] {
  if (keys.length === 0) return [];

  const sorted = [...keys].sort();
  const [startYear, startMonth] = sorted[0].split("-").map(Number);
  const [endYear, endMonth] = sorted[sorted.length - 1].split("-").map(Number);

  const result: string[] = [];
  let y = startYear;
  let m = startMonth;

  while (y < endYear || (y === endYear && m <= endMonth)) {
    result.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }

  return result;
}

export default function CalendarView({ projects, onProjectClick }: CalendarViewProps) {
  const { scheduled, unscheduled } = useMemo(() => groupByMonth(projects), [projects]);
  const monthKeys = useMemo(() => getMonthRange(Array.from(scheduled.keys())), [scheduled]);

  // Navigation: show 3 months at a time
  const [startIdx, setStartIdx] = useState(0);
  const visibleMonths = monthKeys.slice(startIdx, startIdx + 3);

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div>
      {/* Month navigation */}
      {monthKeys.length > 3 && (
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setStartIdx(Math.max(0, startIdx - 3))}
            disabled={startIdx === 0}
            className="font-mono text-[0.6rem] uppercase px-3 py-1 border-2 border-ink/20 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed hover:border-ink/40 transition-colors bg-transparent"
          >
            ← Earlier
          </button>
          <span className="font-mono text-[0.55rem] uppercase opacity-40">
            {visibleMonths.length > 0 && `${monthLabel(visibleMonths[0])} — ${monthLabel(visibleMonths[visibleMonths.length - 1])}`}
          </span>
          <button
            onClick={() => setStartIdx(Math.min(monthKeys.length - 3, startIdx + 3))}
            disabled={startIdx + 3 >= monthKeys.length}
            className="font-mono text-[0.6rem] uppercase px-3 py-1 border-2 border-ink/20 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed hover:border-ink/40 transition-colors bg-transparent"
          >
            Later →
          </button>
        </div>
      )}

      {/* Month grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {visibleMonths.map((key) => {
          const monthProjects = scheduled.get(key) ?? [];
          const isCurrent = key === currentMonthKey;
          const isPast = key < currentMonthKey;

          return (
            <div
              key={key}
              className="border-2 p-3 min-h-[140px]"
              style={{
                borderColor: isCurrent ? "var(--orange)" : "color-mix(in srgb, var(--ink) 15%, transparent)",
                opacity: isPast ? 0.5 : 1,
              }}
            >
              {/* Month header */}
              <div className="flex items-center justify-between mb-3">
                <span
                  className="font-head font-bold text-[0.75rem] uppercase"
                  style={{ opacity: isCurrent ? 1 : 0.5 }}
                >
                  {monthLabel(key)}
                </span>
                {isCurrent && (
                  <span className="font-mono text-[0.45rem] uppercase px-1.5 py-0.5 bg-orange text-bg font-bold">
                    Now
                  </span>
                )}
              </div>

              {/* Projects in this month */}
              {monthProjects.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {monthProjects.map((p) => {
                    const hex = statusHex(p.status);
                    return (
                      <button
                        key={p.id}
                        onClick={() => onProjectClick(p)}
                        className="flex items-center gap-2 p-1.5 border border-ink/10 hover:border-ink/30 transition-colors cursor-pointer bg-transparent text-left w-full"
                      >
                        {/* Status dot */}
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ background: hex }}
                        />

                        {/* Thumbnail */}
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt=""
                            className="w-8 h-8 object-cover border border-ink/10 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-ink/5 flex-shrink-0" />
                        )}

                        {/* Title */}
                        <span className="font-mono text-[0.55rem] font-bold uppercase truncate">
                          {(p as any).short_name || p.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <span className="font-mono text-[0.5rem] opacity-20 uppercase">
                  No deliveries
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty months message */}
      {monthKeys.length === 0 && unscheduled.length === 0 && (
        <p className="text-center opacity-40 font-mono text-[0.8rem] py-12">
          No delivery dates set.
        </p>
      )}

      {/* Unscheduled section */}
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
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: hex }}
                  />
                  <span className="font-mono text-[0.5rem] font-bold uppercase truncate">
                    {(p as any).short_name || p.title}
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
