"use client";

/**
 * Status pipeline indicator for crowdfunding projects.
 * V2: 6 main stages (pre_launch → delivered) + branch statuses.
 * Shows coloured dots connected by lines with a highlighted label.
 */

import { useMemo } from "react";
import { statusStep, MAIN_PIPELINE_STATUSES, statusHex } from "@/lib/crowdfunding-utils";

interface StatusPipelineProps {
  status: string;
  /** Use compact variant (smaller dots/lines, for inline use) */
  compact?: boolean;
}

const TOTAL_STEPS = MAIN_PIPELINE_STATUSES.length; // 6

/** Random rotation between -5 and +5 degrees */
function randomRotation(): string {
  const deg = (Math.random() * 10 - 5).toFixed(1);
  return `${deg}deg`;
}

export default function StatusPipeline({ status, compact = false }: StatusPipelineProps) {
  const step = statusStep(status);
  const hlRotate = useMemo(() => randomRotation(), []);

  const isBranch = step.step === -1;
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < TOTAL_STEPS; i++) {
    // Add connecting line before dots 1-5
    if (i > 0) {
      const lineDone = !isBranch && i <= step.step;
      elements.push(
        <div
          key={`line-${i}`}
          className={`pipeline-line ${lineDone ? "pipeline-line-done" : ""}`}
        />
      );
    }

    // Dot
    const isDone = !isBranch && i < step.step;
    const isCurrent = !isBranch && i === step.step;
    elements.push(
      <div
        key={`dot-${i}`}
        className={`pipeline-dot ${isDone ? "pipeline-dot-done" : ""} ${isCurrent ? "pipeline-dot-current" : ""}`}
      />
    );
  }

  return (
    <div className={`pipeline ${compact ? "pipeline-compact" : ""}`}>
      {elements}
      <span
        className={`pipeline-label ${step.highlightClass}`}
        style={{ "--hl-rotate": hlRotate } as React.CSSProperties}
      >
        {step.label}
      </span>
    </div>
  );
}
