/* ── ExpandableBody — client wrapper for truncatable post body ── */
'use client'

import { useState } from 'react'

interface Props {
  bodyHtml: string | null
  bodyText: string | null
  /** Character threshold above which the "Read more" toggle is shown */
  threshold?: number
  /** Tailwind text-size class, e.g. "text-[0.92rem]" */
  textSize?: string
}

export function ExpandableBody({
  bodyHtml,
  bodyText,
  threshold = 280,
  textSize = 'text-[0.92rem]',
}: Props) {
  const [expanded, setExpanded] = useState(false)

  const rawLength = bodyText?.length ?? bodyHtml?.length ?? 0
  const isTruncatable = rawLength > threshold

  const clampClass = !expanded && isTruncatable ? 'line-clamp-4' : ''

  return (
    <div>
      {bodyHtml ? (
        <div
          className={`${textSize} leading-relaxed prose-sm prose-a:text-[var(--orange)] prose-a:underline ${clampClass}`}
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      ) : (
        <p className={`${textSize} leading-relaxed whitespace-pre-wrap ${clampClass}`}>
          {bodyText}
        </p>
      )}

      {isTruncatable && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-[0.78rem] text-[var(--orange)] font-mono mt-1.5 hover:underline cursor-pointer block"
        >
          Read more →
        </button>
      )}
      {isTruncatable && expanded && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-[0.78rem] font-mono mt-1.5 text-ink/40 hover:text-ink/60 cursor-pointer block"
        >
          ↑ Collapse
        </button>
      )}
    </div>
  )
}
