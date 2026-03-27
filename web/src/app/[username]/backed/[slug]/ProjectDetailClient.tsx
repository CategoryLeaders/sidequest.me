"use client";

/**
 * Client-side parts of the project detail page.
 * Handles countdown timers that need client-side rendering.
 * [SQ.S-W-2603-0074]
 */

import type { CrowdfundingProject } from "@/lib/crowdfunding-utils";
import { parseDeliveryDeadline } from "@/lib/crowdfunding-utils";
import CountdownBadge from "@/components/crowdfunding/CountdownBadge";

interface ProjectDetailClientProps {
  project: CrowdfundingProject;
}

export default function ProjectDetailClient({ project }: ProjectDetailClientProps) {
  const showCampaignCountdown = project.status === "crowdfunding" && project.deadline;

  const deliveryDeadline = project.est_delivery
    ? parseDeliveryDeadline(project.est_delivery)
    : null;
  const showDeliveryCountdown =
    (project.status === "in_production" || project.status === "shipped") &&
    deliveryDeadline &&
    deliveryDeadline.getTime() > Date.now();

  if (!showCampaignCountdown && !showDeliveryCountdown) return null;

  return (
    <div className="mb-4 p-3 border-2 border-ink/10 bg-ink/2">
      {showCampaignCountdown && (
        <div className="flex items-center gap-2">
          <span className="font-mono text-[0.6rem] uppercase opacity-40">Campaign ends in:</span>
          <CountdownBadge deadline={project.deadline!} variant="inline" />
        </div>
      )}
      {showDeliveryCountdown && deliveryDeadline && (
        <div className="flex items-center gap-2">
          <span className="font-mono text-[0.6rem] uppercase opacity-40">Expected delivery in:</span>
          <CountdownBadge deadline={deliveryDeadline.toISOString()} variant="inline" />
        </div>
      )}
    </div>
  );
}
