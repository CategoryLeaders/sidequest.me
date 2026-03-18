'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'

const Picker = dynamic(() => import('@emoji-mart/react').then((m) => m.default), {
  ssr: false,
  loading: () => <div className="w-[352px] h-[435px] bg-white border border-gray-200 rounded-lg flex items-center justify-center text-sm text-gray-400">Loading...</div>,
})

interface EmojiPickerProps {
  value: string
  onChange: (emoji: string) => void
}

export default function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-10 h-10 flex items-center justify-center border-3 border-ink bg-bg-card text-[1.1rem] cursor-pointer hover:bg-ink/5 transition-colors flex-shrink-0 ${
          open ? 'ring-2 ring-orange/50' : ''
        }`}
        title="Pick an emoji"
      >
        {value || '🏷️'}
      </button>
      {value && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(''); }}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center hover:bg-red-600"
          title="Remove icon"
        >
          ✕
        </button>
      )}
      {open && (
        <div className="absolute z-50 top-full left-0 mt-2 shadow-xl rounded-lg">
          <Picker
            data={async () => (await import('@emoji-mart/data')).default}
            onEmojiSelect={(emoji: { native: string }) => {
              onChange(emoji.native)
              setOpen(false)
            }}
            theme="light"
            previewPosition="none"
            skinTonePosition="search"
            maxFrequentRows={2}
          />
        </div>
      )}
    </div>
  )
}
