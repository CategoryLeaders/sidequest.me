"use client";

/**
 * Status pipeline indicator for crowdfunding projects.
 * Shows 4 dots connected by lines with a highlighted label for the current stage.
 * Visually distinct from sticker/tag components.
 */

import { statusStep } from "@/lib/crowdfunding-utils";

interface StatusPipelineProps {
  status: string;
  /** Use compact variant (smaller dots/lines, for inline use) */
  compact?: boolean;
}

const TOTAL_STEPS = 4;

export default function StatusPipeline({ status, compact = false }: StatusPipelineProps) {
  const step = statusStep(status);

  const elements: React.ReactNode[] = [];

  for (let i = 0; i < TOTAL_STEPS; i++) {
    // Add connecting line before dots 1-3
    if (i > 0) {
      elements.push(
        <div
          key={`line-${i}`}
          className={`pipeline-line ${i <= step.step ? "pipeline-line-done" : ""}`}
        />
      );
    }

    // Dot
    const isDone = i < step.step;
    const isCurrent = i === step.step;
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
      <span className={`pipeline-label ${step.highlightClass}`}>
        {step.label}
      </span>
    </div>
  );
}
