"use client";

/**
 * Project lightbox — modal overlay with full project details.
 * [SQ.S-W-2603-0074]
 *
 * Opens when clicking a project card. Shows all details, countdown,
 * linked review, and "Open full page →" link.
 */

import { useEffect, useCallback } from "react";
import Link from "next/link";
import type { CrowdfundingProject } from "@/lib/crowdfunding-utils";
import type { Tables } from "@/types/database";
import {
  formatPledge,
  statusStep,
  statusHex,
  platformLabel,
  parseDeliveryDeadline,
} from "@/lib/crowdfunding-utils";
import StatusPipeline from "@/components/StatusPipeline";
import CountdownBadge from "./CountdownBadge";
import ReviewDisplay from "./ReviewDisplay";

interface ProjectLightboxProps {
  project: CrowdfundingProject;
  username: string;
  writingCount: number;
  /** Pre-fetched review for this project (if any) */
  review?: Tables<"crowdfunding_reviews"> | null;
  onClose: () => void;
}

export default function ProjectLightbox({
  project,
  username,
  writingCount,
  review,
  onClose,
}: ProjectLightboxProps) {
  // Lock body scroll and handle Escape
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const step = statusStep(project.status);
  const hex = statusHex(project.status);

  // Determine countdown deadline
  const showCampaignCountdown = project.status === "crowdfunding" && project.deadline;
  const deliveryDeadline = project.est_delivery
    ? parseDeliveryDeadline(project.est_delivery)
    : null;
  const showDeliveryCountdown =
    (project.status === "in_production" || project.status === "shipped") &&
    deliveryDeadline &&
    deliveryDeadline.getTime() > Date.now();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-bg-card border-3 border-ink w-full max-w-lg max-h-[85vh] overflow-y-auto"
        style={{ transform: "rotate(-0.3deg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center border-2 border-ink bg-bg-card cursor-pointer font-mono text-[0.8rem] font-bold hover:bg-ink hover:text-bg transition-colors"
          aria-label="Close"
        >
          ×
        </button>

        {/* Image */}
        <div className="relative">
          {project.image_url ? (
            <img
              src={project.image_url}
              alt={project.title}
              className="w-full h-auto object-contain border-b-2 border-ink"
            />
          ) : (
            <div className="w-full h-32 bg-ink/5 flex items-center justify-center border-b-2 border-ink">
              <span className="font-mono text-[0.7rem] opacity-30 uppercase">
                {platformLabel(project.platform)}
              </span>
            </div>
          )}

          {/* Campaign countdown badge */}
          {showCampaignCountdown && (
            <CountdownBadge deadline={project.deadline!} label="Ends in" />
          )}
        </div>

        <div className="p-5">
          {/* Platform badge + Status */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className="font-mono text-[0.5rem] font-bold uppercase px-2 py-0.5 border border-ink/20"
              style={{ opacity: 0.5 }}
            >
              {platformLabel(project.platform)}
            </span>
            <span
              className="font-mono text-[0.5rem] font-bold uppercase px-2 py-0.5"
              style={{
                background: `${hex}30`,
                color: hex,
                border: `1px solid ${hex}50`,
              }}
            >
              {step.label}
            </span>
          </div>

          {/* Title */}
          <h2 className="font-head font-bold text-[1.1rem] uppercase leading-tight mb-1">
            {(project as any).short_name || project.title}
          </h2>

          {/* Tagline */}
          {(project as any).tagline && (
            <p className="text-[0.8rem] italic opacity-50 leading-snug mb-3">
              {(project as any).tagline}
            </p>
          )}

          {/* Pipeline */}
          <div className="mb-3">
            <StatusPipeline status={project.status} compact />
          </div>

          {/* Description */}
          {project.description && (
            <p className="text-[0.8rem] leading-relaxed mb-3 opacity-70">
              {project.description}
            </p>
          )}

          {/* Pledge + Reward */}
          {project.show_pledge_amount && project.pledge_amount && (
            <div className="mb-2">
              <span className="font-mono text-[0.6rem] uppercase opacity-40 block mb-0.5">
                Pledged
              </span>
              <span className="font-mono text-[0.9rem] font-bold">
                {formatPledge(project.pledge_amount, project.pledge_currency)}
              </span>
            </div>
          )}

          {project.reward_tier && (
            <div className="mb-3">
              <span className="font-mono text-[0.6rem] uppercase opacity-40 block mb-0.5">
                Reward
              </span>
              <span className="text-[0.8rem] opacity-60">{project.reward_tier}</span>
            </div>
          )}

          {/* Delivery estimate + countdown */}
          {project.est_delivery && (
            <div className="mb-3">
              <span className="font-mono text-[0.6rem] uppercase opacity-40 block mb-0.5">
                Est. Delivery
              </span>
              <span className="font-mono text-[0.8rem]">
                {project.est_delivery}
              </span>
              {showDeliveryCountdown && deliveryDeadline && (
                <span className="ml-2">
                  <CountdownBadge
                    deadline={deliveryDeadline.toISOString()}
                    label="Due in"
                    variant="inline"
                  />
                </span>
              )}
            </div>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-3">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[0.55rem] px-1.5 py-0.5 border border-ink/20 opacity-50"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Review */}
          {review && (
            <div className="mb-3">
              <span className="font-mono text-[0.55rem] uppercase opacity-40 block mb-1.5">
                My Review
              </span>
              <ReviewDisplay review={review} variant="full" />
            </div>
          )}

          {/* Action links */}
          <div className="flex flex-col gap-2 pt-3 border-t border-ink/10">
            {project.external_url && (
              <a
                href={project.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[0.65rem] font-bold uppercase text-orange no-underline hover:opacity-70 transition-opacity"
              >
                View on {platformLabel(project.platform)} →
              </a>
            )}

            {writingCount > 0 && (
              <Link
                href={`/${username}/writings?crowdfunding=${project.slug}`}
                className="font-mono text-[0.65rem] font-bold uppercase text-orange no-underline hover:opacity-70 transition-opacity"
                onClick={onClose}
              >
                Read my review →
              </Link>
            )}

            <Link
              href={`/${username}/backed/${project.slug}`}
              className="font-mono text-[0.65rem] font-bold uppercase no-underline opacity-40 hover:opacity-70 transition-opacity"
              onClick={onClose}
            >
              Open full page →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
