"use client";

/**
 * Calendar view for backed projects — quarter-based grid.
 * [SQ.S-W-2603-0083]
 *
 * - Always aligned to calendar quarters: Q1 Jan–Mar, Q2 Apr–Jun, Q3 Jul–Sep, Q4 Oct–Dec
 * - Shows 2 years at a time (8 quarters), navigable by year
 * - Past quarters greyed with dashed border
 * - Current quarter highlighted with orange border + "NOW" badge
 * - Projects outside the visible window fall to "Unscheduled"
 */

import { useState, useMemo } from "react";
import type { CrowdfundingProject } from "@/lib/crowdfunding-utils";
import { statusHex, parseDeliveryDeadline } from "@/lib/crowdfunding-utils";

interface CalendarViewProps {
  projects: CrowdfundingProject[];
  onProjectClick: (project: CrowdfundingProject) => void;
}

// ─── Quarter helpers ────────────────────────────────────────────────────────

const TODAY = new Date();
const CURRENT_YEAR = TODAY.getFullYear();
const CURRENT_Q_NUM = Math.floor(TODAY.getMonth() / 3) + 1; // 1–4
const CURRENT_QUARTER_KEY = `${CURRENT_YEAR}-Q${CURRENT_Q_NUM}`;

const QUARTER_LABELS: Record<string, string> = {
  Q1: "Jan – Mar",
  Q2: "Apr – Jun",
  Q3: "Jul – Sep",
  Q4: "Oct – Dec",
};

/** Map a Date to its quarter key, e.g. "2026-Q2" */
function dateToQuarterKey(d: Date): string {
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()}-Q${q}`;
}

/** Is this quarter key in the past? */
function isPastQuarter(key: string): boolean {
  return key < CURRENT_QUARTER_KEY;
}

/** Generate the 8 quarter keys for the two years starting at baseYear */
function getQuarterGrid(baseYear: number): string[] {
  const keys: string[] = [];
  for (let dy = 0; dy <= 1; dy++) {
    for (let q = 1; q <= 4; q++) {
      keys.push(`${baseYear + dy}-Q${q}`);
    }
  }
  return keys;
}

/** Group projects by quarter key or into unscheduled */
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
      const key = dateToQuarterKey(deadline);
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

// ─── Component ──────────────────────────────────────────────────────────────

export default function CalendarView({ projects, onProjectClick }: CalendarViewProps) {
  // Default: show current year + next year
  const [baseYear, setBaseYear] = useState(CURRENT_YEAR);

  const gridKeys = useMemo(() => getQuarterGrid(baseYear), [baseYear]);
  const gridKeySet = useMemo(() => new Set(gridKeys), [gridKeys]);
  const { scheduled, unscheduled } = useMemo(
    () => groupProjects(projects, gridKeySet),
    [projects, gridKeySet]
  );

  const yearA = baseYear;
  const yearB = baseYear + 1;

  return (
    <div>
      {/* ── Year navigation ────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setBaseYear(y => y - 1)}
          className="font-mono text-[0.55rem] uppercase px-2.5 py-1 border-2 border-ink/30 hover:border-ink/60 cursor-pointer transition-all bg-transparent"
        >
          ← {baseYear - 1}
        </button>
        <span className="font-mono text-[0.6rem] uppercase opacity-50 font-bold tracking-widest">
          {yearA} – {yearB}
        </span>
        <button
          onClick={() => setBaseYear(y => y + 1)}
          className="font-mono text-[0.55rem] uppercase px-2.5 py-1 border-2 border-ink/30 hover:border-ink/60 cursor-pointer transition-all bg-transparent"
        >
          {baseYear + 2} →
        </button>
      </div>

      {/* ── Quarter grid — 4 columns × 2 rows ─────────────────── */}
      {[yearA, yearB].map(year => (
        <div key={year} className="mb-4">
          {/* Year label */}
          <div className="mb-2">
            <span className="font-mono text-[0.55rem] uppercase opacity-35 font-bold tracking-widest">
              {year}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(qNum => {
              const key = `${year}-Q${qNum}`;
              const qLabel = `Q${qNum}`;
              const monthRange = QUARTER_LABELS[qLabel];
              const quarterProjects = scheduled.get(key) ?? [];
              const isCurrent = key === CURRENT_QUARTER_KEY;
              const isPast = isPastQuarter(key);

              return (
                <div
                  key={key}
                  className="p-3 min-h-[110px] transition-opacity"
                  style={{
                    border: isCurrent
                      ? "2px solid var(--orange)"
                      : isPast
                      ? "2px dashed color-mix(in srgb, var(--ink) 12%, transparent)"
                      : "2px solid color-mix(in srgb, var(--ink) 15%, transparent)",
                    opacity: isPast ? 0.5 : 1,
                  }}
                >
                  {/* Quarter header */}
                  <div className="flex items-start justify-between mb-2 gap-1">
                    <div>
                      <span
                        className="font-head font-bold text-[0.75rem] uppercase leading-tight block"
                        style={{ opacity: isCurrent ? 1 : 0.75 }}
                      >
                        {qLabel}
                      </span>
                      <span
                        className="font-mono text-[0.5rem] uppercase leading-none block mt-0.5"
                        style={{ opacity: isCurrent ? 0.6 : 0.35 }}
                      >
                        {monthRange}
                      </span>
                    </div>
                    {isCurrent && (
                      <span className="font-mono text-[0.4rem] uppercase px-1 py-0.5 bg-orange text-bg font-bold flex-shrink-0">
                        Now
                      </span>
                    )}
                  </div>

                  {/* Projects in this quarter */}
                  {quarterProjects.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      {quarterProjects.map(p => {
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
        </div>
      ))}

      {/* ── Unscheduled ────────────────────────────────────────── */}
      {unscheduled.length > 0 && (
        <div className="border-t-2 border-ink/10 pt-4">
          <span className="font-mono text-[0.6rem] uppercase opacity-40 block mb-3">
            Unscheduled ({unscheduled.length})
          </span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {unscheduled.map(p => {
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

      {/* ── Empty state ────────────────────────────────────────── */}
      {projects.length === 0 && (
        <p className="text-center opacity-40 font-mono text-[0.8rem] py-12">
          No projects to show.
        </p>
      )}
    </div>
  );
}
