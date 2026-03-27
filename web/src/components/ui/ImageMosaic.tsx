/* ── ImageMosaic — canonical shared tiling algorithm ─────────────────────────
 *
 * Single source of truth for multi-image grid layouts across the app.
 * Used by: MicroblogImageMosaic (thoughts feed) · AdventurePostFeed (adventures)
 *
 * Tiling rules:
 *   1 image  → full width, natural aspect ratio (no crop)
 *   2 images → 50/50 side-by-side, fixed height, object-cover + smart objectPosition
 *   3 images → left hero (2/3) + 2 stacked right (1/3), fixed height grid
 *   4+ images → 6-col grid: hero (4 cols × 2 rows) fills left 2/3;
 *               exactly 2 small cells (2 cols × 1 row) fill right 1/3.
 *               "+N more" overlay on the last small cell when images > 3.
 *
 * Why fixed heights for 3-img and per-cell aspectRatio for 2-img:
 *   Two equal cells sharing equal columns → aspectRatio resolves cleanly.
 *   Mixed spans (one cell spanning 2 rows, others spanning 1) → cell
 *   aspect-ratios fight the fr rows and leave whitespace. Fixed px height wins.
 *
 * [SQ.S-W-2603-0062]
 * ──────────────────────────────────────────────────────────────────────────── */

'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import type { ReactNode } from 'react'

// ── Public type ───────────────────────────────────────────────────────────────

export interface ImageMosaicItem {
  url: string
  alt?: string
  /** Stored pixel width — enables natural-ratio rendering for single images */
  width?: number
  /** Stored pixel height — enables smart objectPosition for portrait images */
  height?: number
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Portrait images show from the top (preserves faces). Landscape: centre. */
function objectPos(img: ImageMosaicItem): string {
  if (!img.width || !img.height) return 'center'
  return img.height > img.width * 1.05 ? 'top' : 'center'
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({
  images,
  startIdx,
  onClose,
}: {
  images: ImageMosaicItem[]
  startIdx: number
  onClose: () => void
}) {
  const [idx, setIdx] = useState(startIdx)
  const img = images[idx]

  const prev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), [])
  const next = useCallback(() => setIdx((i) => Math.min(images.length - 1, i + 1)), [images.length])

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handle)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handle)
      document.body.style.overflow = ''
    }
  }, [onClose, prev, next])

  return (
    <div
      className="fixed inset-0 z-[200] bg-ink/90 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative bg-[#111] border-3 border-ink"
        style={{ width: '95vw', maxWidth: '960px', maxHeight: '92vh', boxShadow: '6px 6px 0 rgba(0,0,0,0.4)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image — object-contain, zero crop */}
        <div className="flex items-center justify-center bg-[#0a0a0a]" style={{ minHeight: '60vh', maxHeight: '80vh' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.url}
            alt={img.alt ?? ''}
            style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block' }}
          />
        </div>

        {/* Prev / Next */}
        {images.length > 1 && (
          <>
            <button onClick={prev} disabled={idx === 0}
              className={`absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-bg/80 border-2 border-ink flex items-center justify-center font-head font-bold text-lg cursor-pointer hover:bg-ink hover:text-bg transition-colors ${idx === 0 ? 'opacity-20' : ''}`}>
              ‹
            </button>
            <button onClick={next} disabled={idx === images.length - 1}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-bg/80 border-2 border-ink flex items-center justify-center font-head font-bold text-lg cursor-pointer hover:bg-ink hover:text-bg transition-colors ${idx === images.length - 1 ? 'opacity-20' : ''}`}>
              ›
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)}
                  className={`w-2 h-2 border border-ink/60 cursor-pointer transition-colors ${i === idx ? 'bg-white' : 'bg-white/20'}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Close */}
        <button onClick={onClose}
          className="absolute top-2 right-2 w-8 h-8 bg-bg/80 border-2 border-ink flex items-center justify-center font-head font-bold text-sm cursor-pointer hover:bg-ink hover:text-bg transition-colors z-10">
          ✕
        </button>

        {/* Counter */}
        {images.length > 1 && (
          <div className="absolute top-2 left-2 font-mono text-[0.6rem] text-white/50 bg-black/60 px-2 py-0.5">
            {idx + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  images: ImageMosaicItem[]
  /**
   * Which image index is the hero in 4+ mosaics. Default 0.
   * In AdventurePostFeed this is the user-starred photo.
   */
  featuredIndex?: number
  /**
   * If provided, this fires on cell click instead of opening the lightbox.
   * Use for interactive/editor contexts (e.g. starring a photo).
   */
  onImageClick?: (index: number) => void
  /**
   * Render additional content inside each image cell (e.g. star/edit buttons).
   * Receives the original image index and whether this cell is the featured hero.
   */
  renderOverlay?: (index: number, isFeatured: boolean) => ReactNode
  /** Gap between cells in pixels. Default 2. */
  gap?: number
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ImageMosaic({
  images,
  featuredIndex = 0,
  onImageClick,
  renderOverlay,
  gap = 2,
}: Props) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  const count = images.length
  if (count === 0) return null

  const gapPx = `${gap}px`

  const handleClick = (idx: number) => {
    if (onImageClick) {
      onImageClick(idx)
    } else {
      setLightboxIdx(idx)
    }
  }

  const close = () => setLightboxIdx(null)

  // ── 1 image: natural dimensions, no crop ────────────────────────────────────
  if (count === 1) {
    const img = images[0]
    const hasDims = (img.width ?? 0) > 0 && (img.height ?? 0) > 0
    return (
      <>
        <button type="button" className="block w-full cursor-zoom-in bg-[#0a0a0a]" onClick={() => handleClick(0)}>
          {hasDims ? (
            <Image
              src={img.url}
              alt={img.alt ?? ''}
              width={img.width}
              height={img.height}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              sizes="(max-width: 768px) 100vw, 640px"
            />
          ) : (
            <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <Image src={img.url} alt={img.alt ?? ''} fill className="object-contain"
                sizes="(max-width: 768px) 100vw, 640px" />
            </div>
          )}
          {renderOverlay?.(0, true)}
        </button>
        {lightboxIdx !== null && <Lightbox images={images} startIdx={lightboxIdx} onClose={close} />}
      </>
    )
  }

  // ── 2 images: 50/50 side-by-side ────────────────────────────────────────────
  // Both cells have the same aspectRatio so 1fr columns resolve cleanly.
  if (count === 2) {
    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: gapPx }}>
          {images.map((img, i) => (
            <button key={i} type="button"
              className="relative overflow-hidden block cursor-zoom-in"
              style={{ aspectRatio: '3/2' }}
              onClick={() => handleClick(i)}
            >
              <Image src={img.url} alt={img.alt ?? ''} fill className="object-cover"
                style={{ objectPosition: objectPos(img) }}
                sizes="(max-width: 768px) 50vw, 320px" />
              {renderOverlay?.(i, i === featuredIndex)}
            </button>
          ))}
        </div>
        {lightboxIdx !== null && <Lightbox images={images} startIdx={lightboxIdx} onClose={close} />}
      </>
    )
  }

  // ── 3 images: large left + 2 stacked right ───────────────────────────────────
  // Fixed height grid — per-cell aspectRatio fights the 1fr rows and leaves gaps.
  if (count === 3) {
    const heroIdx = featuredIndex < 3 ? featuredIndex : 0
    // Put hero first, others follow in order
    const orderedIndices = [heroIdx, ...([0, 1, 2].filter((i) => i !== heroIdx))]
    return (
      <>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gridTemplateRows: '1fr 1fr',
          height: '400px',
          gap: gapPx,
        }}>
          {orderedIndices.map((imgIdx, pos) => {
            const img = images[imgIdx]
            const isHero = pos === 0
            return (
              <button key={imgIdx} type="button"
                className="relative overflow-hidden block cursor-zoom-in"
                style={isHero ? { gridRow: '1 / 3' } : undefined}
                onClick={() => handleClick(imgIdx)}
              >
                <Image src={img.url} alt={img.alt ?? ''} fill className="object-cover"
                  style={{ objectPosition: objectPos(img) }}
                  sizes={isHero ? '(max-width: 768px) 67vw, 427px' : '(max-width: 768px) 33vw, 213px'} />
                {renderOverlay?.(imgIdx, isHero)}
              </button>
            )
          })}
        </div>
        {lightboxIdx !== null && <Lightbox images={images} startIdx={lightboxIdx} onClose={close} />}
      </>
    )
  }

  // ── 4+ images: 6-col mosaic ──────────────────────────────────────────────────
  // Hero (featuredIndex) → 4 cols × 2 rows (left 2/3).
  // Exactly 2 small cells (right 1/3, 2 cols × 1 row each). "+N more" on last.
  // MAX_SMALL=2 keeps the grid to exactly 2 rows — no partial 3rd row with blank cols.
  const MAX_SMALL = 2
  const heroIdx = featuredIndex < count ? featuredIndex : 0
  const smallIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    .filter((i) => i < count && i !== heroIdx)
    .slice(0, MAX_SMALL)
  const remaining = count - 1 - MAX_SMALL // images beyond what's visible

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gridAutoRows: '130px',
        gap: gapPx,
      }}>
        {/* Hero — 4 cols × 2 rows */}
        <button type="button"
          className="relative overflow-hidden block cursor-zoom-in"
          style={{ gridColumn: 'span 4', gridRow: 'span 2' }}
          onClick={() => handleClick(heroIdx)}
        >
          <Image src={images[heroIdx].url} alt={images[heroIdx].alt ?? ''} fill className="object-cover"
            style={{ objectPosition: objectPos(images[heroIdx]) }}
            sizes="(max-width: 768px) 67vw, 427px" />
          {renderOverlay?.(heroIdx, true)}
        </button>

        {/* Small cells — right side */}
        {smallIndices.map((imgIdx, pos) => {
          const isLast = pos === smallIndices.length - 1 && remaining > 0
          return (
            <button key={imgIdx} type="button"
              className="relative overflow-hidden block cursor-zoom-in"
              style={{ gridColumn: 'span 2', gridRow: 'span 1' }}
              onClick={() => handleClick(imgIdx)}
            >
              <Image src={images[imgIdx].url} alt={images[imgIdx].alt ?? ''} fill className="object-cover"
                style={{ objectPosition: objectPos(images[imgIdx]) }}
                sizes="(max-width: 768px) 33vw, 213px" />
              {isLast && (
                <div className="absolute inset-0 bg-black/55 flex items-center justify-center pointer-events-none">
                  <span className="font-head font-[900] text-white text-xl">+{remaining + 1}</span>
                </div>
              )}
              {renderOverlay?.(imgIdx, false)}
            </button>
          )
        })}
      </div>
      {lightboxIdx !== null && <Lightbox images={images} startIdx={lightboxIdx} onClose={close} />}
    </>
  )
}
