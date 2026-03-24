"use client";

/**
 * Calendar view for backed projects — month-based grid grouped by quarter.
 * [SQ.S-W-2603-0083]
 *
 * - Grouped by calendar quarters: Q1 Jan–Mar, Q2 Apr–Jun, Q3 Jul–Sep, Q4 Oct–Dec
 * - Shows 2 years at a time (8 quarters), navigable by year
 * - Each quarter row shows 3 month columns
 * - Past months greyed with dashed border
 * - Current month highlighted with orange border + "NOW" badge
 * - Projects outside the visible window fall to "Unscheduled"
 */

import { useState, useMemo } from "react";
import type { CrowdfundingProject } from "@/lib/crowdfunding-utils";
import { statusHex, statusStep, parseDeliveryDeadline } from "@/lib/crowdfunding-utils";

interface CalendarViewProps {
  projects: CrowdfundingProject[];
  onProjectClick: (project: CrowdfundingProject) => void;
}

// ─── Month helpers ────────────────────────────────────────────────────────────

const TODAY = new Date();
const CURRENT_YEAR = TODAY.getFullYear();
const CURRENT_MONTH = TODAY.getMonth() + 1; // 1–12
const CURRENT_MONTH_KEY = `${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, "0")}`;

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const QUARTERS = [
  { q: 1, label: "Q1", months: [1, 2, 3] },
  { q: 2, label: "Q2", months: [4, 5, 6] },
  { q: 3, label: "Q3", months: [7, 8, 9] },
  { q: 4, label: "Q4", months: [10, 11, 12] },
];

/** Map a Date to its month key, e.g. "2026-03" */
function dateToMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Is this month key in the past? */
function isPastMonth(key: string): boolean {
  return key < CURRENT_MONTH_KEY;
}

/** Generate all 24 month keys for the two years starting at baseYear */
function getMonthGrid(baseYear: number): string[] {
  const keys: string[] = [];
  for (let dy = 0; dy <= 1; dy++) {
    for (let m = 1; m <= 12; m++) {
      keys.push(`${baseYear + dy}-${String(m).padStart(2, "0")}`);
    }
  }
  return keys;
}

/** Group projects by month key or into unscheduled */
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
      const key = dateToMonthKey(deadline);
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

  const gridKeys = useMemo(() => getMonthGrid(baseYear), [baseYear]);
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

      {/* ── Quarter rows — per year ─────────────────────────────── */}
      {[yearA, yearB].map(year => (
        <div key={year} className="mb-6">
          {/* Year label */}
          <div className="mb-3">
            <span className="font-mono text-[0.55rem] uppercase opacity-35 font-bold tracking-widest">
              {year}
            </span>
          </div>

          {QUARTERS.map(({ q, label, months }) => (
            <div key={q} className="mb-5">
              {/* Quarter label */}
              <div className="mb-2">
                <span className="font-mono text-[0.5rem] uppercase opacity-40 font-bold tracking-wider">
                  {label}
                </span>
              </div>

              {/* 3-column month grid */}
              <div className="grid grid-cols-3 gap-2">
                {months.map(mNum => {
                  const key = `${year}-${String(mNum).padStart(2, "0")}`;
                  const monthName = MONTH_NAMES[mNum - 1];
                  const monthProjects = scheduled.get(key) ?? [];
                  const isCurrent = key === CURRENT_MONTH_KEY;
                  const isPast = isPastMonth(key);

                  return (
                    <div
                      key={key}
                      className="p-2.5 min-h-[90px] transition-opacity"
                      style={{
                        border: isCurrent
                          ? "2px solid var(--orange)"
                          : isPast
                          ? "2px dashed color-mix(in srgb, var(--ink) 12%, transparent)"
                          : "2px solid color-mix(in srgb, var(--ink) 15%, transparent)",
                        opacity: isPast ? 0.5 : 1,
                      }}
                    >
                      {/* Month header */}
                      <div className="flex items-start justify-between mb-1.5 gap-1">
                        <span
                          className="font-head font-bold text-[0.7rem] uppercase leading-tight"
                          style={{ opacity: isCurrent ? 1 : 0.75 }}
                        >
                          {monthName}
                        </span>
                        {isCurrent && (
                          <span className="font-mono text-[0.4rem] uppercase px-1 py-0.5 bg-orange text-bg font-bold flex-shrink-0">
                            Now
                          </span>
                        )}
                      </div>

                      {/* Projects in this month */}
                      {monthProjects.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {monthProjects.map(p => {
                            const hex = statusHex(p.status);
                            return (
                              <button
                                key={p.id}
                                onClick={() => onProjectClick(p)}
                                className="flex items-center gap-1.5 p-1 border border-ink/10 hover:border-ink/30 transition-colors cursor-pointer bg-transparent text-left w-full"
                              >
                                <span
                                  className="font-mono text-[0.35rem] font-bold uppercase px-1 py-0.5 flex-shrink-0 leading-none"
                                  style={{ background: hex, color: '#fff', letterSpacing: '0.03em' }}
                                >
                                  {statusStep(p.status).shortLabel}
                                </span>
                                {p.image_url && (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={p.image_url}
                                    alt=""
                                    className="w-5 h-5 object-cover border border-ink/10 flex-shrink-0"
                                  />
                                )}
                                <span className="font-mono text-[0.48rem] font-bold uppercase truncate leading-tight">
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
                  <span
                    className="font-mono text-[0.35rem] font-bold uppercase px-1 py-0.5 flex-shrink-0 leading-none"
                    style={{ background: hex, color: '#fff', letterSpacing: '0.03em' }}
                  >
                    {statusStep(p.status).shortLabel}
                  </span>
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
