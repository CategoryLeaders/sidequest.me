"use client";

/**
 * Review display component — shows a backer's review of a crowdfunding project.
 * Used in lightbox, detail page, and thoughtstream.
 * [SQ.S-W-2603-0075]
 */

import type { Tables } from "@/types/database";
import StarRating from "./StarRating";

type CrowdfundingReview = Tables<"crowdfunding_reviews">;

interface ReviewDisplayProps {
  review: CrowdfundingReview;
  /** Whether to show full body or truncate */
  variant?: "full" | "compact";
}

export default function ReviewDisplay({ review, variant = "full" }: ReviewDisplayProps) {
  const images = (review.images as Array<{ url: string; alt?: string }>) ?? [];

  return (
    <div className="border-2 border-ink/10 p-4 bg-ink/2" style={{ transform: "rotate(0.2deg)" }}>
      {/* Rating */}
      {review.rating && (
        <div className="mb-1.5">
          <StarRating rating={review.rating} size={variant === "full" ? "md" : "sm"} />
        </div>
      )}

      {/* Title */}
      {review.title && (
        <h4 className="font-head font-bold text-[0.85rem] uppercase leading-tight mb-1">
          {review.title}
        </h4>
      )}

      {/* Body */}
      {review.body_html ? (
        <div
          className={`text-[0.8rem] leading-relaxed opacity-70 ${
            variant === "compact" ? "line-clamp-3" : ""
          }`}
          dangerouslySetInnerHTML={{ __html: review.body_html }}
        />
      ) : (
        <p
          className={`text-[0.8rem] leading-relaxed opacity-70 whitespace-pre-wrap ${
            variant === "compact" ? "line-clamp-3" : ""
          }`}
        >
          {review.body}
        </p>
      )}

      {/* Images (full variant only) */}
      {variant === "full" && images.length > 0 && (
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {images.map((img, i) => (
            <img
              key={i}
              src={img.url}
              alt={img.alt ?? "Review image"}
              className="h-24 w-auto object-cover border border-ink/10"
            />
          ))}
        </div>
      )}

      {/* Visibility badge */}
      {review.visibility === "private" && (
        <span className="font-mono text-[0.5rem] uppercase opacity-30 mt-2 block">
          Private review
        </span>
      )}

      {/* Date */}
      <span className="font-mono text-[0.5rem] opacity-30 mt-1 block">
        {new Date(review.created_at).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </span>
    </div>
  );
}
