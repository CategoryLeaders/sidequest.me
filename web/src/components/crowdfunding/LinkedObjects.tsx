"use client";

/**
 * Displays a list of object links as compact cards.
 * [SQ.S-W-2603-0076]
 */

import Link from "next/link";
import type { EnrichedObjectLink } from "@/lib/object-links";

interface LinkedObjectsProps {
  links: EnrichedObjectLink[];
  /** Section title */
  title?: string;
}

export default function LinkedObjects({ links, title = "Linked" }: LinkedObjectsProps) {
  if (links.length === 0) return null;

  return (
    <div className="mb-4">
      <span className="font-mono text-[0.55rem] uppercase opacity-40 block mb-2">
        {title}
      </span>
      <div className="flex flex-col gap-2">
        {links.map((link) => (
          <div
            key={link.id}
            className="flex items-center gap-3 p-2 border border-ink/10 hover:border-ink/25 transition-colors"
          >
            {/* Thumbnail */}
            {link.displayImage && (
              <img
                src={link.displayImage}
                alt=""
                className="w-10 h-10 object-cover border border-ink/10 flex-shrink-0"
              />
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              {link.displayHref ? (
                <Link
                  href={link.displayHref}
                  className="font-mono text-[0.65rem] font-bold uppercase no-underline hover:text-orange transition-colors truncate block"
                >
                  {link.displayTitle}
                </Link>
              ) : (
                <span className="font-mono text-[0.65rem] font-bold uppercase truncate block">
                  {link.displayTitle}
                </span>
              )}

              {link.label && (
                <span className="font-mono text-[0.5rem] opacity-30 uppercase">
                  {link.label}
                </span>
              )}
            </div>

            {/* Type badge */}
            <span className="font-mono text-[0.45rem] uppercase opacity-20 flex-shrink-0">
              {link.target_type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
