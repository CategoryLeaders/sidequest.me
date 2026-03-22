"use client";

/**
 * Star rating display — shows filled/empty stars.
 * [SQ.S-W-2603-0075]
 */

interface StarRatingProps {
  rating: number | null;
  /** Maximum stars */
  max?: number;
  /** Size variant */
  size?: "sm" | "md";
}

export default function StarRating({ rating, max = 5, size = "sm" }: StarRatingProps) {
  if (rating === null || rating === undefined) return null;

  const sizeClass = size === "sm" ? "text-[0.65rem]" : "text-[0.9rem]";

  return (
    <span className={`${sizeClass} tracking-wider`} aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          style={{ opacity: i < rating ? 1 : 0.2 }}
        >
          ★
        </span>
      ))}
    </span>
  );
}
