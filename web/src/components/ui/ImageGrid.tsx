/* ── ImageGrid — standardized image display with lightbox ── */
"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageLightbox } from "./ImageLightbox";

interface GridImage {
  url: string;
  alt?: string;
}

interface Props {
  images: GridImage[];
  /** Max images to display before "+N more" */
  maxVisible?: number;
  /** Aspect ratio CSS value (e.g. "4/3", "1/1", "16/9") */
  aspectRatio?: string;
  className?: string;
}

export function ImageGrid({
  images,
  maxVisible = 4,
  aspectRatio = "4/3",
  className = "",
}: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  const visible = images.slice(0, maxVisible);
  const remaining = images.length - maxVisible;

  const gridCols =
    visible.length === 1
      ? "grid-cols-1"
      : "grid-cols-2";

  return (
    <>
      <div className={`grid ${gridCols} gap-2 ${className}`}>
        {visible.map((img, i) => (
          <button
            key={i}
            onClick={() => setLightboxIndex(i)}
            className={`border-2 border-ink overflow-hidden relative cursor-zoom-in group ${
              visible.length === 3 && i === 0 ? "row-span-2" : ""
            }`}
            style={{ aspectRatio }}
          >
            <Image
              src={img.url}
              alt={img.alt ?? ""}
              fill
              className="object-cover transition-transform group-hover:scale-[1.02]"
              sizes="(max-width: 800px) 50vw, 400px"
            />
            {/* "+N more" overlay on last image */}
            {i === visible.length - 1 && remaining > 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-head font-bold text-lg">
                  +{remaining}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
