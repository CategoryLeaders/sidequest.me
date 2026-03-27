/* ── MicroblogImageMosaic — thin adapter over shared ImageMosaic ── [SQ.S-W-2603-0062]
 *
 * Maps MicroblogImage[] → ImageMosaicItem[] and delegates all tiling/lightbox
 * logic to src/components/ui/ImageMosaic. The algorithm lives there.
 * ──────────────────────────────────────────────────────────────────────────── */

'use client'

import type { MicroblogImage } from '@/lib/microblogs'
import { ImageMosaic } from '@/components/ui/ImageMosaic'

interface Props {
  images: MicroblogImage[]
}

export function MicroblogImageMosaic({ images }: Props) {
  const items = images.map((img) => ({
    url: img.url,
    alt: img.alt_text ?? undefined,
    width: img.width,
    height: img.height,
  }))

  return <ImageMosaic images={items} />
}
