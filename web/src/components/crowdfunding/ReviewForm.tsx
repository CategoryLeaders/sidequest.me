"use client";

/**
 * Review form — allows the project owner to write/edit a review.
 * [SQ.S-W-2603-0075]
 */

import { useState } from "react";
import type { Tables } from "@/types/database";

type CrowdfundingReview = Tables<"crowdfunding_reviews">;

interface ReviewFormProps {
  projectId: string;
  /** Existing review to edit (null = new review) */
  existing?: CrowdfundingReview | null;
  onSave: (review: {
    rating: number | null;
    title: string;
    body: string;
    visibility: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export default function ReviewForm({ projectId, existing, onSave, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState<number | null>(existing?.rating ?? null);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [visibility, setVisibility] = useState(existing?.visibility ?? "public");
  const [saving, setSaving] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    try {
      await onSave({ rating, title: title.trim(), body: body.trim(), visibility });
    } finally {
      setSaving(false);
    }
  };

  const displayRating = hoverRating ?? rating;

  return (
    <form onSubmit={handleSubmit} className="border-2 border-ink/10 p-4 bg-ink/2">
      <h4 className="font-head font-bold text-[0.75rem] uppercase mb-3">
        {existing ? "Edit Review" : "Write a Review"}
      </h4>

      {/* Star rating selector */}
      <div className="mb-3">
        <label className="font-mono text-[0.55rem] uppercase opacity-40 block mb-1">
          Rating (optional)
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="text-[1.2rem] cursor-pointer bg-transparent border-0 p-0 transition-transform hover:scale-110"
              style={{ opacity: displayRating && star <= displayRating ? 1 : 0.2 }}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
              onClick={() => setRating(rating === star ? null : star)}
            >
              ★
            </button>
          ))}
          {rating && (
            <button
              type="button"
              className="font-mono text-[0.5rem] opacity-30 cursor-pointer bg-transparent border-0 ml-2"
              onClick={() => setRating(null)}
            >
              clear
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="mb-3">
        <label className="font-mono text-[0.55rem] uppercase opacity-40 block mb-1">
          Title (optional)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief summary of your review"
          className="w-full px-3 py-1.5 border-2 border-ink/20 bg-bg font-mono text-[0.75rem] focus:border-ink/50 outline-none"
        />
      </div>

      {/* Body */}
      <div className="mb-3">
        <label className="font-mono text-[0.55rem] uppercase opacity-40 block mb-1">
          Review *
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share your thoughts on this project..."
          rows={5}
          required
          className="w-full px-3 py-1.5 border-2 border-ink/20 bg-bg font-mono text-[0.75rem] focus:border-ink/50 outline-none resize-y"
        />
      </div>

      {/* Visibility */}
      <div className="mb-4">
        <label className="font-mono text-[0.55rem] uppercase opacity-40 block mb-1">
          Visibility
        </label>
        <div className="flex gap-3">
          {(["public", "private"] as const).map((v) => (
            <label key={v} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value={v}
                checked={visibility === v}
                onChange={() => setVisibility(v)}
                className="accent-orange"
              />
              <span className="font-mono text-[0.6rem] uppercase">{v}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !body.trim()}
          className="font-mono text-[0.6rem] font-bold uppercase px-4 py-1.5 border-2 border-ink bg-ink text-bg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-ink/80 transition-colors"
        >
          {saving ? "Saving..." : existing ? "Update" : "Publish"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="font-mono text-[0.6rem] uppercase px-4 py-1.5 border-2 border-ink/20 cursor-pointer hover:border-ink/40 transition-colors bg-transparent"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
