'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Adventure, LayoutTheme, AdventureStatus, LocationType, Waypoint, Chapter } from '@/lib/adventures'
import { THEME_META, STATUS_META, LAYOUT_THEMES, ADVENTURE_STATUSES, slugifyAdventure } from '@/lib/adventures'
import AdventurePostFeed from './AdventurePostFeed'

interface AdventureEditorFormProps {
  username: string
  adventure?: Partial<Adventure>
}

export default function AdventureEditorForm({ username, adventure }: AdventureEditorFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isNew = !adventure?.id

  const [title, setTitle] = useState(adventure?.title ?? '')
  const [slug, setSlug] = useState(adventure?.slug ?? '')
  const [slugManual, setSlugManual] = useState(!!adventure?.slug)
  const [description, setDescription] = useState(adventure?.description ?? '')
  const [coverUrl, setCoverUrl] = useState(adventure?.cover_image_url ?? '')
  const [layoutTheme, setLayoutTheme] = useState<LayoutTheme>(adventure?.layout_theme ?? 'journal')
  const [startDate, setStartDate] = useState(adventure?.start_date ?? '')
  const [endDate, setEndDate] = useState(adventure?.end_date ?? '')
  const [locationName, setLocationName] = useState(adventure?.location_name ?? '')
  const [locationType, setLocationType] = useState<LocationType>(adventure?.location_type ?? 'single')
  const [route, setRoute] = useState<Waypoint[]>(adventure?.route ?? [])
  const [chapters, setChapters] = useState<Chapter[]>(adventure?.chapters ?? [])
  const [status, setStatus] = useState<AdventureStatus>(adventure?.status ?? 'draft')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const [coverDragOver, setCoverDragOver] = useState(false)
  const [coverCacheBust, setCoverCacheBust] = useState(0)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (!slugManual) setSlug(slugifyAdventure(val))
    setSaved(false)
  }

  const handleCoverUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setCoverUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('context', 'adventures')
      if (adventure?.id) form.append('entityId', adventure.id)
      const res = await fetch('/api/upload-image', { method: 'POST', body: form })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json() as { url: string }
      setCoverUrl(url)
      setCoverCacheBust(Date.now())
      setSaved(false)
    } catch {
      setError('Cover image upload failed')
    } finally {
      setCoverUploading(false)
    }
  }

  const handleDelete = () => {
    if (!adventure?.id) return
    startTransition(async () => {
      const res = await fetch(`/api/adventures/${adventure.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const { error: e } = await res.json().catch(() => ({ error: 'Delete failed' })) as { error: string }
        setError(e)
        return
      }
      router.replace(`/${username}/admin/adventures`)
    })
  }

  const save = () => {
    setError(null)
    startTransition(async () => {
      const payload = {
        title,
        slug,
        description: description.trim() || null,
        cover_image_url: coverUrl.trim() || null,
        layout_theme: layoutTheme,
        start_date: startDate || null,
        end_date: endDate || null,
        location_name: locationType === 'single' ? (locationName.trim() || null) : null,
        location_type: locationType,
        route: locationType === 'multi' ? route : [],
        chapters,
        status,
      }

      const url = adventure?.id
        ? `/api/adventures/${adventure.id}`
        : '/api/adventures'

      const res = await fetch(url, {
        method: adventure?.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const { error: e } = await res.json().catch(() => ({ error: 'Unknown error' })) as { error: string }
        setError(e)
        return
      }

      const { slug: savedSlug } = await res.json() as { id?: string; slug: string }
      setSaved(true)

      if (isNew) {
        router.replace(`/${username}/admin/adventures/${savedSlug}`)
      }
    })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <a
        href={`/${username}/admin/adventures`}
        className="text-sm text-ink/40 hover:text-ink/70 mb-6 inline-block"
      >
        ← All adventures
      </a>

      {/* Cover Image — drag/drop */}
      <div
        className={`relative w-full mb-6  border-2 border-dashed transition-colors cursor-pointer overflow-hidden ${
          coverDragOver ? 'border-blue-400 bg-blue-50'
            : coverUrl ? 'border-transparent'
            : 'border-ink/[var(--opacity-muted)] hover:border-ink/40'
        }`}
        onDragOver={(e) => { e.preventDefault(); setCoverDragOver(true) }}
        onDragLeave={() => setCoverDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setCoverDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleCoverUpload(f) }}
        onClick={() => coverInputRef.current?.click()}
      >
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); e.target.value = '' }}
        />
        {coverUrl ? (
          <div className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverCacheBust ? `${coverUrl}?t=${coverCacheBust}` : coverUrl} alt="Cover" className="w-full h-48 object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
              <span className="text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                {coverUploading ? 'Uploading…' : 'Click or drop to replace'}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setCoverUrl(''); setSaved(false) }}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white  w-7 h-7 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-ink/40">
            {coverUploading ? (
              <span className="text-sm">Uploading…</span>
            ) : (
              <>
                <svg className="w-8 h-8 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <span className="text-sm">Drop a cover image here, or click to browse</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <input
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        placeholder="Adventure title"
        className="w-full text-3xl font-semibold placeholder-ink/30 border-none outline-none mb-2 bg-transparent"
      />

      {/* Slug */}
      <div className="flex items-center gap-2 text-sm text-ink/40 mb-6">
        <span className="shrink-0">{username}/adventures/</span>
        <input
          value={slug}
          onChange={(e) => { setSlugManual(true); setSlug(slugifyAdventure(e.target.value)); setSaved(false) }}
          className="flex-1 border-b border-dashed border-ink/30 outline-none text-ink/60 bg-transparent pb-0.5 min-w-0"
          placeholder="slug"
        />
      </div>

      {/* Description */}
      <textarea
        value={description}
        onChange={(e) => { setDescription(e.target.value); setSaved(false) }}
        placeholder="Brief description — what is this adventure?"
        rows={2}
        className="w-full text-sm border border-ink/[var(--opacity-muted)]  px-3 py-2 outline-none focus:border-ink/40 bg-transparent resize-none mb-6"
      />

      {/* Layout Theme Selector */}
      <div className="mb-6">
        <p className="text-xs font-medium text-ink/50 uppercase tracking-wide mb-3">Layout Theme</p>
        <div className="grid grid-cols-5 gap-3">
          {LAYOUT_THEMES.map((theme) => {
            const meta = THEME_META[theme]
            const selected = layoutTheme === theme
            return (
              <button
                key={theme}
                type="button"
                onClick={() => { setLayoutTheme(theme); setSaved(false) }}
                className={`text-left p-3  border-2 transition-all ${
                  selected
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-ink/[var(--opacity-muted)] hover:border-ink/40'
                }`}
              >
                <div className="text-2xl mb-1">{meta.icon}</div>
                <div className={`text-xs font-medium ${selected ? 'text-orange-700' : 'text-ink/70'}`}>
                  {meta.label}
                </div>
                <div className="text-[10px] text-ink/40 mt-1 line-clamp-2">
                  {meta.bestFor}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Dates + Location + Status */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-xs font-medium text-ink/50 uppercase tracking-wide mb-2">Start date</p>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setSaved(false) }}
            className="w-full text-sm border border-ink/[var(--opacity-muted)]  px-3 py-2 outline-none focus:border-ink/40 bg-transparent"
          />
        </div>
        <div>
          <p className="text-xs font-medium text-ink/50 uppercase tracking-wide mb-2">End date</p>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setSaved(false) }}
            className="w-full text-sm border border-ink/[var(--opacity-muted)]  px-3 py-2 outline-none focus:border-ink/40 bg-transparent"
          />
        </div>
      </div>

      {/* Location type toggle + editor */}
      <div className="mb-6">
        <p className="text-xs font-medium text-ink/50 uppercase tracking-wide mb-2">Location</p>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => { setLocationType('single'); setSaved(false) }}
            className={`px-3 py-1.5 text-xs  border transition-all ${
              locationType === 'single' ? 'border-ink bg-ink text-white' : 'border-ink/[var(--opacity-muted)] text-ink/50 hover:border-ink/40'
            }`}
          >
            📍 Single location
          </button>
          <button
            type="button"
            onClick={() => { setLocationType('multi'); setSaved(false) }}
            className={`px-3 py-1.5 text-xs  border transition-all ${
              locationType === 'multi' ? 'border-ink bg-ink text-white' : 'border-ink/[var(--opacity-muted)] text-ink/50 hover:border-ink/40'
            }`}
          >
            🗺️ Route (multiple stops)
          </button>
        </div>

        {locationType === 'single' ? (
          <input
            value={locationName}
            onChange={(e) => { setLocationName(e.target.value); setSaved(false) }}
            placeholder="Black Rock City, NV"
            className="w-full text-sm border border-ink/[var(--opacity-muted)]  px-3 py-2 outline-none focus:border-ink/40 bg-transparent"
          />
        ) : (
          <div className="space-y-2">
            {route.map((wp, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-ink/40 w-5 text-center flex-shrink-0">{i + 1}</span>
                <input
                  value={wp.name}
                  onChange={(e) => {
                    const next = [...route]
                    next[i] = { ...next[i], name: e.target.value }
                    setRoute(next)
                    setSaved(false)
                  }}
                  placeholder={`Stop ${i + 1}`}
                  className="flex-1 text-sm border border-ink/[var(--opacity-muted)]  px-3 py-2 outline-none focus:border-ink/40 bg-transparent"
                />
                <input
                  type="date"
                  value={wp.arrival_date ?? ''}
                  onChange={(e) => {
                    const next = [...route]
                    next[i] = { ...next[i], arrival_date: e.target.value || undefined }
                    setRoute(next)
                    setSaved(false)
                  }}
                  title="Arrival date"
                  className="text-xs border border-ink/[var(--opacity-muted)]  px-2 py-2 outline-none focus:border-ink/40 bg-transparent w-32"
                />
                <button
                  type="button"
                  onClick={() => {
                    setRoute((prev) => prev.filter((_, j) => j !== i))
                    setSaved(false)
                  }}
                  className="text-xs text-ink/30 hover:text-red-500 transition-colors"
                  title="Remove stop"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const newWp: Waypoint = { name: '' }
                setRoute((prev) => [...prev, newWp])
                setSaved(false)
              }}
              className="text-xs text-ink/50 hover:text-ink/80 transition-colors mt-1"
            >
              + Add stop
            </button>

            {/* Route summary */}
            {route.filter((w) => w.name.trim()).length > 1 && (
              <div className="mt-3 pt-3 border-t border-ink/10">
                <p className="text-xs text-ink/40 mb-2">Route preview</p>
                <p className="text-sm text-ink/60">
                  {route.filter((w) => w.name.trim()).map((w) => w.name.trim()).join(' → ')}
                </p>
              </div>
            )}

            {/* Auto-suggest chapters */}
            {route.filter((w) => w.name.trim()).length > 0 && (
              <div className="mt-3 pt-3 border-t border-ink/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-ink/40">Chapters from route</p>
                  {route.filter((w) => w.name.trim()).length > 0 && chapters.length === 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newChapters = route
                          .filter((w) => w.name.trim())
                          .map((w) => ({ title: w.name.trim(), description: '' }))
                        setChapters(newChapters)
                        setSaved(false)
                      }}
                      className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      Generate chapters from stops →
                    </button>
                  )}
                </div>
                {chapters.length > 0 && (
                  <div className="space-y-1.5">
                    {chapters.map((ch, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-ink/30 w-5 text-center flex-shrink-0">Ch.{i + 1}</span>
                        <input
                          value={ch.title}
                          onChange={(e) => {
                            const next = [...chapters]
                            next[i] = { ...next[i], title: e.target.value }
                            setChapters(next)
                            setSaved(false)
                          }}
                          className="flex-1 text-sm border border-ink/10  px-3 py-1.5 outline-none focus:border-ink/30 bg-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setChapters((prev) => prev.filter((_, j) => j !== i))
                            setSaved(false)
                          }}
                          className="text-xs text-ink/30 hover:text-red-500 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setChapters((prev) => [...prev, { title: '', description: '' }])
                        setSaved(false)
                      }}
                      className="text-xs text-ink/50 hover:text-ink/80 transition-colors"
                    >
                      + Add chapter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status */}
      <div className="mb-6">
        <p className="text-xs font-medium text-ink/50 uppercase tracking-wide mb-2">Status</p>
        <div className="flex gap-2">
          {ADVENTURE_STATUSES.map((s) => {
            const meta = STATUS_META[s]
            return (
              <button
                key={s}
                type="button"
                onClick={() => { setStatus(s); setSaved(false) }}
                className={`px-3 py-2 text-xs  border transition-all ${
                  status === s
                    ? s === 'live' ? 'bg-orange-500 border-orange-500 text-white'
                      : s === 'upcoming' ? 'bg-yellow-500 border-yellow-500 text-white'
                      : s === 'complete' ? 'bg-green-600 border-green-600 text-white'
                      : 'bg-ink border-ink text-white'
                    : 'border-ink/[var(--opacity-muted)] text-ink/50 hover:border-ink/40'
                }`}
              >
                {meta.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={isPending || !title.trim()}
          className="bg-black text-white text-sm px-5 py-2.5  hover:bg-ink/80 disabled:opacity-40 transition-colors"
        >
          {isPending ? 'Saving…' : saved ? 'Saved ✓' : isNew ? 'Create adventure' : 'Save changes'}
        </button>

        {/* Preview */}
        {!isNew && (
          <a
            href={`/${username}/adventures/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm px-4 py-2.5 border border-ink/[var(--opacity-muted)]  hover:border-ink/40 text-ink/60 transition-colors no-underline inline-block"
          >
            👁️ Preview
          </a>
        )}

        {/* Delete */}
        {!isNew && (
          confirmDelete ? (
            <span className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-red-500">Delete this adventure?</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="text-xs px-3 py-1.5 bg-red-600 text-white  hover:bg-red-700 disabled:opacity-40 transition-colors"
              >
                {isPending ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-ink/40 hover:text-ink/60 transition-colors"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="ml-auto text-xs text-ink/30 hover:text-red-500 transition-colors"
            >
              Delete
            </button>
          )
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      {/* Post feed — only for existing adventures */}
      {!isNew && adventure?.id && (
        <AdventurePostFeed adventureId={adventure.id} chapters={chapters} />
      )}
    </div>
  )
}
