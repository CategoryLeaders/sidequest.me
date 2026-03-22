"use client";

/**
 * Calendar view for backed projects.
 * Fixed 12-month rolling grid starting from the current month.
 * [SQ.S-W-2603-0083]
 *
 * - Always shows 12 months from today (current + next 11).
 * - Projects with past delivery dates appear in the "Past" section.
 * - Projects with no parseable date appear in "Unscheduled".
 */

import { useMemo } from "react";
import type { CrowdfundingProject } from "@/lib/crowdfunding-utils";
import { statusHex, parseDeliveryDeadline } from "@/lib/crowdfunding-utils";

interface CalendarViewProps {
  projects: CrowdfundingProject[];
  onProjectClick: (project: CrowdfundingProject) => void;
}

const now = new Date();
const CURRENT_MONTH_KEY = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

/** Generate a fixed 12-month grid from the current month */
function getFixedMonthGrid(): string[] {
  const result: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return result;
}

/** Group projects by YYYY-MM key, splitting into future/current, past, and unscheduled */
function groupProjects(projects: CrowdfundingProject[], gridKeys: Set<string>) {
  const scheduled = new Map<string, CrowdfundingProject[]>();
  const past: CrowdfundingProject[] = [];
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
      if (gridKeys.has(key)) {
        // Fits in the 12-month grid
        if (!scheduled.has(key)) scheduled.set(key, []);
        scheduled.get(key)!.push(p);
      } else {
        // Outside the grid window — put in past section
        past.push(p);
      }
    } else {
      unscheduled.push(p);
    }
  }

  return { scheduled, past, unscheduled };
}

/** Get month label from YYYY-MM key */
function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

export default function CalendarView({ projects, onProjectClick }: CalendarViewProps) {
  const gridKeys = useMemo(() => getFixedMonthGrid(), []);
  const gridKeySet = useMemo(() => new Set(gridKeys), [gridKeys]);
  const { scheduled, past, unscheduled } = useMemo(
    () => groupProjects(projects, gridKeySet),
    [projects, gridKeySet]
  );

  return (
    <div>
      {/* Fixed 12-month grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {gridKeys.map((key) => {
          const monthProjects = scheduled.get(key) ?? [];
          const isCurrent = key === CURRENT_MONTH_KEY;

          return (
            <div
              key={key}
              className="border-2 p-3 min-h-[100px]"
              style={{
                borderColor: isCurrent
                  ? "var(--orange)"
                  : "color-mix(in srgb, var(--ink) 15%, transparent)",
              }}
            >
              {/* Month header */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className="font-head font-bold text-[0.7rem] uppercase"
                  style={{ opacity: isCurrent ? 1 : 0.5 }}
                >
                  {monthLabel(key)}
                </span>
                {isCurrent && (
                  <span className="font-mono text-[0.4rem] uppercase px-1 py-0.5 bg-orange text-bg font-bold">
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

      {/* Past deliveries (before current month) */}
      {past.length > 0 && (
        <div className="border-t-2 border-ink/10 pt-4 mb-4">
          <span className="font-mono text-[0.6rem] uppercase opacity-40 block mb-3">
            Past ({past.length})
          </span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {past.map((p) => {
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

      {/* Unscheduled (no date) */}
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
