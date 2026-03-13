'use client'

/**
 * Photo upload form — supports site tag toggles + optional custom tags.
 * [SQ.S-W-2603-0055]
 */

import { useState, useRef } from 'react'
import { type SiteTag } from '@/lib/tags'

type PhotoUploadProps = {
  siteTags?: SiteTag[]
  onUploaded?: () => void
}

export default function PhotoUpload({ siteTags = [], onUploaded }: PhotoUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [caption, setCaption] = useState('')
  // Selected site tag labels
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  // Free-text custom tags (comma-separated) — for tags not in the site list
  const [customTags, setCustomTags] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length === 0) return
    const limited = selected.slice(0, 10)
    setFiles(limited)
    setError(null)
    setSuccess(false)
    const urls = limited.map(f => URL.createObjectURL(f))
    setPreviews(prev => {
      prev.forEach(u => URL.revokeObjectURL(u))
      return urls
    })
  }

  const removeFile = (idx: number) => {
    URL.revokeObjectURL(previews[idx])
    setFiles(f => f.filter((_, i) => i !== idx))
    setPreviews(p => p.filter((_, i) => i !== idx))
  }

  const toggleTag = (label: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) return

    setUploading(true)
    setError(null)

    // Combine selected site tags + custom tags, deduped
    const customArr = customTags.split(',').map(t => t.trim()).filter(Boolean)
    const allTags = Array.from(new Set([...Array.from(selectedTags), ...customArr]))

    try {
      const formData = new FormData()
      files.forEach(f => formData.append('files', f))
      if (caption.trim()) formData.append('caption', caption.trim())
      if (allTags.length > 0) formData.append('tags', allTags.join(','))

      const res = await fetch('/api/photos', { method: 'POST', body: formData })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Upload failed')
        return
      }

      setSuccess(true)
      setFiles([])
      setPreviews(p => { p.forEach(u => URL.revokeObjectURL(u)); return [] })
      setCaption('')
      setSelectedTags(new Set())
      setCustomTags('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      onUploaded?.()
    } catch {
      setError('Upload failed — please try again')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-3 border-ink bg-bg p-6 mb-6" style={{ boxShadow: '4px 4px 0 var(--ink)' }}>
      <h2 className="font-head font-bold text-[0.9rem] uppercase mb-4">Add Photos</h2>

      {/* File drop area */}
      <label className="block border-3 border-dashed border-ink/30 p-6 text-center cursor-pointer hover:border-ink/60 transition-colors mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleFiles}
          className="hidden"
        />
        <span className="font-head font-bold text-[1.5rem] block mb-1">+</span>
        <span className="font-mono text-[0.75rem] opacity-50">
          Click to select photos (max 10, 10MB each)
        </span>
      </label>

      {/* Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {previews.map((url, i) => (
            <div key={url} className="relative aspect-square border-2 border-ink overflow-hidden group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-ink text-bg font-mono text-[0.6rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Caption */}
      <textarea
        value={caption}
        onChange={e => setCaption(e.target.value)}
        placeholder="Caption (optional)"
        rows={2}
        className="w-full px-3 py-2 border-3 border-ink bg-white font-body text-[0.85rem] focus:outline-none focus:shadow-[3px_3px_0_var(--ink)] transition-shadow resize-none mb-4"
      />

      {/* Tags */}
      <div className="mb-4">
        <div className="font-mono text-[0.65rem] uppercase tracking-wider opacity-50 mb-2">Tags</div>

        {/* Site tag toggles */}
        {siteTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {siteTags.map((tag) => {
              const active = selectedTags.has(tag.label)
              return (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => toggleTag(tag.label)}
                  className={`sticker ${tag.color} transition-all cursor-pointer select-none`}
                  style={{
                    fontSize: '0.68rem',
                    padding: '4px 12px',
                    opacity: active ? 1 : 0.35,
                    boxShadow: active ? '2px 2px 0 var(--ink)' : 'none',
                    outline: active ? '2px solid var(--ink)' : 'none',
                    outlineOffset: active ? '1px' : '0',
                  }}
                >
                  {tag.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Custom tags freetext (secondary) */}
        <input
          type="text"
          value={customTags}
          onChange={e => setCustomTags(e.target.value)}
          placeholder="Custom tags (comma-separated)"
          className="w-full px-3 py-2 border-3 border-ink bg-white font-mono text-[0.78rem] focus:outline-none focus:shadow-[3px_3px_0_var(--ink)] transition-shadow"
        />
        {siteTags.length > 0 && (
          <p className="font-mono text-[0.62rem] opacity-40 mt-1">
            Optional — for tags not in your site list
          </p>
        )}
      </div>

      {error && (
        <div className="border-3 border-red-500 bg-red-50 p-3 font-mono text-[0.78rem] text-red-600 mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="border-3 border-green-500 bg-green-50 p-3 font-mono text-[0.78rem] text-green-700 mb-4">
          Photos uploaded successfully!
        </div>
      )}

      <button
        type="submit"
        disabled={files.length === 0 || uploading}
        className="w-full py-2.5 px-4 bg-ink text-bg font-head font-bold text-[0.82rem] uppercase border-3 border-ink hover:bg-transparent hover:text-ink transition-colors disabled:opacity-40 cursor-pointer"
      >
        {uploading ? 'Uploading…' : `Upload ${files.length > 0 ? files.length : ''} Photo${files.length !== 1 ? 's' : ''}`}
      </button>
    </form>
  )
}
