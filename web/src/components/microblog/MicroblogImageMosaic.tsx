/* ── MicroblogImageMosaic — client component: mosaic + lightbox ── [SQ.S-W-2603-0062] */
'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import type { MicroblogImage } from '@/lib/microblogs'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Portrait images → show top of frame (preserves faces). Landscape → centre. */
function objectPos(img: MicroblogImage): string {
  if (!img.width || !img.height) return 'center'
  return img.height > img.width * 1.05 ? 'top' : 'center'
}

// ── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  images,
  startIdx,
  onClose,
}: {
  images: MicroblogImage[]
  startIdx: number
  onClose: () => void
}) {
  const [idx, setIdx] = useState(startIdx)
  const img = images[idx]

  const prev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), [])
  const next = useCallback(() => setIdx((i) => Math.min(images.length - 1, i + 1)), [images.length])

  // Keyboard nav + body scroll lock
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
        style={{
          width: '95vw',
          maxWidth: '960px',
          maxHeight: '92vh',
          boxShadow: '6px 6px 0 rgba(0,0,0,0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Image ── */}
        <div
          className="relative flex items-center justify-center bg-[#0a0a0a]"
          style={{ minHeight: '60vh', maxHeight: '80vh' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.url}
            alt={img.alt_text ?? ''}
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>

        {/* ── Prev / Next ── */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              disabled={idx === 0}
              className={`absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-bg/80 border-2 border-ink flex items-center justify-center font-head font-bold text-lg cursor-pointer hover:bg-ink hover:text-bg transition-colors ${idx === 0 ? 'opacity-20' : ''}`}
            >
              ‹
            </button>
            <button
              onClick={next}
              disabled={idx === images.length - 1}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-bg/80 border-2 border-ink flex items-center justify-center font-head font-bold text-lg cursor-pointer hover:bg-ink hover:text-bg transition-colors ${idx === images.length - 1 ? 'opacity-20' : ''}`}
            >
              ›
            </button>

            {/* Dot strip */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`w-2 h-2 rounded-full border border-ink/60 cursor-pointer transition-colors ${i === idx ? 'bg-white' : 'bg-white/20'}`}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Close ── */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-8 h-8 bg-bg/80 border-2 border-ink flex items-center justify-center font-head font-bold text-sm cursor-pointer hover:bg-ink hover:text-bg transition-colors z-10"
        >
          ✕
        </button>

        {/* ── Counter ── */}
        {images.length > 1 && (
          <div className="absolute top-2 left-2 font-mono text-[0.6rem] text-white/50 bg-black/60 px-2 py-0.5">
            {idx + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

interface Props {
  images: MicroblogImage[]
}

export function MicroblogImageMosaic({ images }: Props) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  const count = images.length
  if (count === 0) return null

  const open = (idx: number) => setLightboxIdx(idx)
  const close = () => setLightboxIdx(null)

  // ── 1 image: full natural dimensions — zero cropping ──
  // Use width/height props so Next.js sizes the image correctly with height:auto.
  // Falls back to a fill+object-contain container if dimensions are missing.
  if (count === 1) {
    const img = images[0]
    const hasDims = img.width > 0 && img.height > 0
    return (
      <>
        <button
          type="button"
          className="block w-full cursor-zoom-in bg-[#0a0a0a]"
          onClick={() => open(0)}
        >
          {hasDims ? (
            <Image
              src={img.url}
              alt={img.alt_text ?? ''}
              width={img.width}
              height={img.height}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              sizes="(max-width: 768px) 100vw, 640px"
            />
          ) : (
            /* fallback when no dimensions stored */
            <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <Image
                src={img.url}
                alt={img.alt_text ?? ''}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 640px"
              />
            </div>
          )}
        </button>
        {lightboxIdx !== null && (
          <Lightbox images={images} startIdx={lightboxIdx} onClose={close} />
        )}
      </>
    )
  }

  // ── 2 images: equal side-by-side ──
  if (count === 2) {
    return (
      <>
        <div className="grid gap-[2px]" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              className="relative overflow-hidden block cursor-zoom-in"
              style={{ aspectRatio: '3/2' }}
              onClick={() => open(i)}
            >
              <Image
                src={img.url}
                alt={img.alt_text ?? ''}
                fill
                className="object-cover"
                style={{ objectPosition: objectPos(img) }}
                sizes="(max-width: 768px) 50vw, 320px"
              />
            </button>
          ))}
        </div>
        {lightboxIdx !== null && (
          <Lightbox images={images} startIdx={lightboxIdx} onClose={close} />
        )}
      </>
    )
  }

  // ── 3 images: large left + 2 stacked right ──
  if (count === 3) {
    return (
      <>
        <div
          className="gap-[2px]"
          style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr 1fr' }}
        >
          <button
            type="button"
            className="relative overflow-hidden block cursor-zoom-in"
            style={{ gridRow: '1 / 3', aspectRatio: '3/4' }}
            onClick={() => open(0)}
          >
            <Image
              src={images[0].url}
              alt={images[0].alt_text ?? ''}
              fill
              className="object-cover"
              style={{ objectPosition: objectPos(images[0]) }}
              sizes="(max-width: 768px) 67vw, 427px"
            />
          </button>
          {images.slice(1).map((img, i) => (
            <button
              key={i}
              type="button"
              className="relative overflow-hidden block cursor-zoom-in"
              style={{ aspectRatio: '3/2' }}
              onClick={() => open(i + 1)}
            >
              <Image
                src={img.url}
                alt={img.alt_text ?? ''}
                fill
                className="object-cover"
                style={{ objectPosition: objectPos(img) }}
                sizes="(max-width: 768px) 33vw, 213px"
              />
            </button>
          ))}
        </div>
        {lightboxIdx !== null && (
          <Lightbox images={images} startIdx={lightboxIdx} onClose={close} />
        )}
      </>
    )
  }

  // ── 4+ images: adventure-style mosaic ──
  // 6-col grid: hero (4 cols × 2 rows) + small (2 cols × 1 row)
  const MAX_SMALL = 4
  const heroImage = images[0]
  const smallImages = images.slice(1, 1 + MAX_SMALL)
  const remaining = images.length - 1 - MAX_SMALL

  return (
    <>
      <div
        className="gap-[2px]"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gridAutoRows: '130px',
        }}
      >
        {/* Hero — 4 cols × 2 rows */}
        <button
          type="button"
          className="relative overflow-hidden block cursor-zoom-in"
          style={{ gridColumn: 'span 4', gridRow: 'span 2' }}
          onClick={() => open(0)}
        >
          <Image
            src={heroImage.url}
            alt={heroImage.alt_text ?? ''}
            fill
            className="object-cover"
            style={{ objectPosition: objectPos(heroImage) }}
            sizes="(max-width: 768px) 67vw, 427px"
          />
        </button>

        {/* Small images */}
        {smallImages.map((img, i) => {
          const isLast = i === smallImages.length - 1 && remaining > 0
          return (
            <button
              key={i}
              type="button"
              className="relative overflow-hidden block cursor-zoom-in"
              style={{ gridColumn: 'span 2', gridRow: 'span 1' }}
              onClick={() => open(i + 1)}
            >
              <Image
                src={img.url}
                alt={img.alt_text ?? ''}
                fill
                className="object-cover"
                style={{ objectPosition: objectPos(img) }}
                sizes="(max-width: 768px) 33vw, 213px"
              />
              {isLast && (
                <div className="absolute inset-0 bg-black/55 flex items-center justify-center pointer-events-none">
                  <span className="font-head font-[900] text-white text-xl">
                    +{remaining + 1}
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </div>
      {lightboxIdx !== null && (
        <Lightbox images={images} startIdx={lightboxIdx} onClose={close} />
      )}
    </>
  )
}
