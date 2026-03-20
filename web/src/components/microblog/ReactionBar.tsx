/* ── ReactionBar — compact emoji reaction display ── [SQ.S-W-2603-0062] */

import type { ReactionCount } from "@/lib/microblogs";

interface Props {
  counts: ReactionCount[];
}

export function ReactionBar({ counts }: Props) {
  if (counts.length === 0) return null;

  const total = counts.reduce((sum, r) => sum + r.count, 0);

  return (
    <span className="inline-flex items-center gap-1 text-[0.65rem] font-mono opacity-50">
      {counts
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((r) => (
          <span key={r.emoji} title={`${r.emoji} ${r.count}`}>
            {r.emoji}
          </span>
        ))}
      <span className="opacity-60">{total}</span>
    </span>
  );
}
