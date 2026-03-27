'use client'

import { useState, useCallback, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { JSONContent } from '@tiptap/core'
import type { Writing, WritingStatus } from '@/lib/writings'
import { slugifyTitle } from '@/lib/writings'
import type { SiteTag } from '@/lib/tags'

// Lazy-load editor to avoid SSR issues with ProseMirror
const WritingEditor = dynamic(() => import('./WritingEditor'), { ssr: false })

/* ── Linkable entity types passed from server ── */
interface LinkableCompany { id: string; name: string; slug: string; brandColour: string | null }
interface LinkableProject { id: string; name: string; slug: string }
interface LinkableItem { id: string; label: string }

export interface LinkableEntities {
  companies: LinkableCompany[]
  projects: LinkableProject[]
  crowdfunding?: LinkableProject[]
  likes: LinkableItem[]
  dislikes: LinkableItem[]
}

export interface WritingLinkRef {
  entity_type: string
  entity_id: string
  is_primary?: boolean
}

interface WritingEditorFormProps {
  username: string
  writing?: Partial<Writing>           // undefined = new post
  availableTags?: SiteTag[]            // profile site tags with colours
  linkableEntities?: LinkableEntities
  existingLinks?: WritingLinkRef[]
}

export default function WritingEditorForm({
  username,
  writing,
  availableTags = [],
  linkableEntities,
  existingLinks = [],
}: WritingEditorFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const isNew = !writing?.id

  const [title, setTitle] = useState(writing?.title ?? '')
  const [slug, setSlug] = useState(writing?.slug ?? '')
  const [slugManual, setSlugManual] = useState(!!writing?.slug)
  const [body, setBody] = useState<JSONContent | null>(writing?.body ?? null)
  const [bodyHtml, setBodyHtml] = useState(writing?.body_html ?? '')
  const [wordCount, setWordCount] = useState(writing?.word_count ?? 0)
  const [tags, setTags] = useState<string[]>(writing?.tags ?? [])
  const [customTag, setCustomTag] = useState('')
  const [externalUrl, setExternalUrl] = useState(writing?.external_url ?? '')
  const [publishedAt, setPublishedAt] = useState(writing?.published_at ?? '')
  const [imageUrl, setImageUrl] = useState(writing?.image_url ?? '')
  const [links, setLinks] = useState<WritingLinkRef[]>(existingLinks)
  const [status, setStatus] = useState<WritingStatus>(writing?.status ?? 'draft')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [tagsOpen, setTagsOpen] = useState(true)
  const [backedExpanded, setBackedExpanded] = useState(false)
  const [hashtagsExpanded, setHashtagsExpanded] = useState(false)
  const [heroUploading, setHeroUploading] = useState(false)
  const [heroDragOver, setHeroDragOver] = useState(false)
  const [heroCacheBust, setHeroCacheBust] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const heroInputRef = useRef<HTMLInputElement>(null)

  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (!slugManual) setSlug(slugifyTitle(val))
    setSaved(false)
  }

  const handleSlugChange = (val: string) => {
    setSlugManual(true)
    setSlug(slugifyTitle(val))
    setSaved(false)
  }

  const handleEditorChange = useCallback(
    (json: JSONContent, html: string, wc: number) => {
      setBody(json)
      setBodyHtml(html)
      setWordCount(wc)
      setSaved(false)
    },
    [],
  )

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
    setSaved(false)
  }

  const addCustomTag = () => {
    const t = customTag.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t])
    setCustomTag('')
    setSaved(false)
  }

  /* ── Link toggling ── */
  const toggleLink = (entityType: string, entityId: string) => {
    setLinks((prev) => {
      const exists = prev.some((l) => l.entity_type === entityType && l.entity_id === entityId)
      if (exists) {
        const next = prev.filter((l) => !(l.entity_type === entityType && l.entity_id === entityId))
        // If we removed the primary, promote the first remaining of same type
        const removedWasPrimary = prev.find((l) => l.entity_type === entityType && l.entity_id === entityId)?.is_primary
        if (removedWasPrimary) {
          const firstRemaining = next.find((l) => l.entity_type === entityType)
          if (firstRemaining) firstRemaining.is_primary = true
        }
        return next
      }
      // New link: mark as primary if it's the first of its type
      const alreadyHasPrimary = prev.some((l) => l.entity_type === entityType && l.is_primary)
      return [...prev, { entity_type: entityType, entity_id: entityId, is_primary: !alreadyHasPrimary }]
    })
    setSaved(false)
  }

  const isLinked = (entityType: string, entityId: string) =>
    links.some((l) => l.entity_type === entityType && l.entity_id === entityId)

  const isPrimary = (entityType: string, entityId: string) =>
    links.some((l) => l.entity_type === entityType && l.entity_id === entityId && l.is_primary)

  const setPrimaryLink = (entityType: string, entityId: string) => {
    setLinks((prev) => prev.map((l) =>
      l.entity_type === entityType
        ? { ...l, is_primary: l.entity_id === entityId }
        : l
    ))
    setSaved(false)
  }

  const linkedCompanies = links.filter((l) => l.entity_type === 'company')

  const handleImageUpload = async (file: File): Promise<string> => {
    const form = new FormData()
    form.append('file', file)
    form.append('context', 'writings')
    const res = await fetch('/api/upload-image', { method: 'POST', body: form })
    if (!res.ok) throw new Error('Upload failed')
    const { url } = await res.json() as { url: string }
    return url
  }

  const handleHeroUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setHeroUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('context', 'writings')
      if (writing?.id) form.append('entityId', writing.id)
      const res = await fetch('/api/upload-image', { method: 'POST', body: form })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json() as { url: string }
      setImageUrl(url)
      setHeroCacheBust(Date.now())
      setSaved(false)
    } catch {
      setError('Hero image upload failed')
    } finally {
      setHeroUploading(false)
    }
  }

  const handleHeroDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setHeroDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleHeroUpload(file)
  }

  const handleDelete = () => {
    if (!writing?.id) return
    startTransition(async () => {
      const res = await fetch(`/api/writings/${writing.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const { error: e } = await res.json().catch(() => ({ error: 'Delete failed' })) as { error: string }
        setError(e)
        return
      }
      router.replace(`/${username}/admin/writings`)
    })
  }

  const save = (nextStatus?: WritingStatus) => {
    const targetStatus = nextStatus ?? status
    setError(null)
    startTransition(async () => {
      const payload = {
        title,
        slug,
        body,
        body_html: bodyHtml,
        word_count: wordCount,
        tags,
        status: targetStatus,
        external_url: externalUrl.trim() || null,
        image_url: imageUrl.trim() || null,
        published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
      }

      const url = writing?.id
        ? `/api/writings/${writing.id}`
        : '/api/writings'

      const res = await fetch(url, {
        method: writing?.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const { error: e } = await res.json().catch(() => ({ error: 'Unknown error' })) as { error: string }
        setError(e)
        return
      }

      const { id: savedId, slug: savedSlug } = await res.json() as { id?: string; slug: string }
      const writingId = writing?.id ?? savedId

      // Sync writing links
      if (writingId) {
        await fetch('/api/writing-links', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ writing_id: writingId, links }),
        })
      }

      setStatus(targetStatus)
      setSaved(true)

      if (isNew) {
        router.replace(`/${username}/admin/writings/${savedSlug}`)
      }
    })
  }

  const statusLabel: Record<WritingStatus, string> = {
    draft:     'Save draft',
    scheduled: 'Schedule',
    published: 'Publish changes',
    unlisted:  'Save as unlisted',
  }

  const hasLinkable = linkableEntities && (
    linkableEntities.companies.length > 0 ||
    linkableEntities.projects.length > 0 ||
    (linkableEntities.crowdfunding?.length ?? 0) > 0 ||
    linkableEntities.likes.length > 0 ||
    linkableEntities.dislikes.length > 0
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Back */}
      <a
        href={`/${username}/admin/writings`}
        className="text-sm text-gray-400 hover:text-gray-700 mb-6 inline-block"
      >
        ← All writings
      </a>

      {/* Hero Image — drag/drop + click to upload */}
      <div
        className={`relative w-full mb-6 rounded-lg border-2 border-dashed transition-colors cursor-pointer overflow-hidden ${
          heroDragOver
            ? 'border-blue-400 bg-blue-50'
            : imageUrl
              ? 'border-transparent'
              : 'border-gray-200 hover:border-gray-400'
        }`}
        onDragOver={(e) => { e.preventDefault(); setHeroDragOver(true) }}
        onDragLeave={() => setHeroDragOver(false)}
        onDrop={handleHeroDrop}
        onClick={() => heroInputRef.current?.click()}
      >
        <input
          ref={heroInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleHeroUpload(file)
            e.target.value = ''
          }}
        />
        {imageUrl ? (
          <div className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroCacheBust ? `${imageUrl}?t=${heroCacheBust}` : imageUrl} alt="Hero" className="w-full h-48 object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
              <span className="text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                {heroUploading ? 'Uploading…' : 'Click or drop to replace'}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setImageUrl(''); setSaved(false) }}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            {heroUploading ? (
              <span className="text-sm">Uploading…</span>
            ) : (
              <>
                <svg className="w-8 h-8 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <span className="text-sm">Drop a hero image here, or click to browse</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <input
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        placeholder="Post title"
        className="w-full text-3xl font-semibold placeholder-gray-300 border-none outline-none mb-2 bg-transparent"
      />

      {/* Slug */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <span className="shrink-0">{username}/writings/</span>
        <input
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          className="flex-1 border-b border-dashed border-gray-300 outline-none text-gray-600 bg-transparent pb-0.5 min-w-0"
          placeholder="slug"
        />
      </div>

      {/* Editor */}
      <WritingEditor
        initialContent={body ?? undefined}
        onChange={handleEditorChange}
        onImageUpload={handleImageUpload}
      />

      {/* Tags — always expanded */}
      <div className="mt-6">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          Tags{tags.length > 0 && ` (${tags.length})`}
        </p>

        {/* Site tags — always visible, styled with their configured colours */}
        <div className="flex flex-wrap gap-2 mb-3">
          {availableTags.map((siteTag) => {
            const isActive = tags.includes(siteTag.label)
            return (
              <button
                key={siteTag.label}
                type="button"
                onClick={() => toggleTag(siteTag.label)}
                className={`sticker ${siteTag.color} cursor-pointer text-[0.75rem] transition-all ${
                  isActive ? 'shadow-[2px_2px_0_var(--ink)] opacity-100' : 'opacity-30 hover:opacity-60'
                }`}
              >
                {siteTag.icon ? `${siteTag.icon} ${siteTag.label}` : siteTag.label}
              </button>
            )
          })}
        </div>

        {/* Custom tags + input */}
        <div className="flex gap-2 flex-wrap items-center">
          <input
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
            placeholder="Add custom tag…"
            className="text-sm border border-gray-200 rounded-md px-3 py-1.5 outline-none focus:border-gray-400 w-48"
          />
          {tags.filter((t) => !availableTags.some((st) => st.label === t)).map((t) => (
            <span
              key={t}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-sm border border-gray-300 text-gray-600"
            >
              {t}
              <button
                type="button"
                onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                className="text-gray-400 hover:text-black ml-0.5"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Related to — link picker */}
      {hasLinkable && (
        <div className="mt-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Related to</p>

          {/* Companies */}
          {linkableEntities!.companies.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-400 mb-1.5">Companies</p>
              <div className="flex flex-wrap gap-2">
                {linkableEntities!.companies.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleLink('company', c.id)}
                    className={`px-3 py-1 rounded-full text-sm border transition-all ${
                      isLinked('company', c.id)
                        ? 'text-white'
                        : 'border-gray-200 text-gray-500 hover:border-gray-400'
                    }`}
                    style={isLinked('company', c.id)
                      ? { background: c.brandColour ?? '#000', borderColor: c.brandColour ?? '#000' }
                      : undefined
                    }
                  >
                    {c.name}
                  </button>
                ))}
              </div>
              {/* Primary selector — only shown when 2+ companies are linked */}
              {linkedCompanies.length >= 2 && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-400">Primary context:</span>
                  {linkableEntities!.companies
                    .filter((c) => isLinked('company', c.id))
                    .map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setPrimaryLink('company', c.id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-all ${
                          isPrimary('company', c.id)
                            ? 'text-white font-medium'
                            : 'border-gray-200 text-gray-500 hover:border-gray-400'
                        }`}
                        style={isPrimary('company', c.id)
                          ? { background: c.brandColour ?? '#000', borderColor: c.brandColour ?? '#000' }
                          : undefined
                        }
                      >
                        {isPrimary('company', c.id) ? '★' : '☆'} {c.name}
                      </button>
                    ))
                  }
                </div>
              )}
            </div>
          )}

          {/* Projects */}
          {linkableEntities!.projects.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-400 mb-1.5">Projects</p>
              <div className="flex flex-wrap gap-2">
                {linkableEntities!.projects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleLink('project', p.id)}
                    className={`px-3 py-1 rounded-full text-sm border transition-all ${
                      isLinked('project', p.id)
                        ? 'border-black bg-black text-white'
                        : 'border-gray-200 text-gray-500 hover:border-gray-400'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Crowdfunding (Backed Projects) — collapsed to 8, expandable */}
          {(linkableEntities!.crowdfunding?.length ?? 0) > 0 && (() => {
            const allBacked = linkableEntities!.crowdfunding!
            const limit = 8
            const shown = backedExpanded ? allBacked : allBacked.slice(0, limit)
            const hasMore = allBacked.length > limit
            return (
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-1.5">Backed Projects</p>
                <div className="flex flex-wrap gap-2">
                  {shown.map((cf) => (
                    <button
                      key={cf.id}
                      type="button"
                      onClick={() => toggleLink('crowdfunding', cf.id)}
                      className={`px-3 py-1 rounded-full text-sm border transition-all ${
                        isLinked('crowdfunding', cf.id)
                          ? 'border-orange bg-orange text-white'
                          : 'border-gray-200 text-gray-500 hover:border-gray-400'
                      }`}
                    >
                      {cf.name}
                    </button>
                  ))}
                  {hasMore && !backedExpanded && (
                    <button
                      type="button"
                      onClick={() => setBackedExpanded(true)}
                      className="px-3 py-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      +{allBacked.length - limit} more…
                    </button>
                  )}
                  {backedExpanded && hasMore && (
                    <button
                      type="button"
                      onClick={() => setBackedExpanded(false)}
                      className="px-3 py-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      Show less
                    </button>
                  )}
                </div>
              </div>
            )
          })()}

          {/* Likes — collapsed to 10, expandable */}
          {linkableEntities!.likes.length > 0 && (() => {
            const all = linkableEntities!.likes
            const limit = 10
            const shown = hashtagsExpanded ? all : all.slice(0, limit)
            const hasMore = all.length > limit
            return (
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-1.5">Likes</p>
                <div className="flex flex-wrap gap-2">
                  {shown.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => toggleLink('like', l.id)}
                      className={`px-3 py-1 rounded-full text-sm border transition-all ${
                        isLinked('like', l.id)
                          ? 'border-green-600 bg-green-600 text-white'
                          : 'border-gray-200 text-gray-500 hover:border-gray-400'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                  {hasMore && !hashtagsExpanded && (
                    <button
                      type="button"
                      onClick={() => setHashtagsExpanded(true)}
                      className="px-3 py-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      +{all.length - limit} more…
                    </button>
                  )}
                </div>
              </div>
            )
          })()}

          {/* Dislikes — collapsed to 10, expandable (shares expand state with likes) */}
          {linkableEntities!.dislikes.length > 0 && (() => {
            const all = linkableEntities!.dislikes
            const limit = 10
            const shown = hashtagsExpanded ? all : all.slice(0, limit)
            const hasMore = all.length > limit
            return (
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-1.5">Hates</p>
                <div className="flex flex-wrap gap-2">
                  {shown.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleLink('dislike', d.id)}
                      className={`px-3 py-1 rounded-full text-sm border transition-all ${
                        isLinked('dislike', d.id)
                          ? 'border-red-600 bg-red-600 text-white'
                          : 'border-gray-200 text-gray-500 hover:border-gray-400'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                  {hasMore && !hashtagsExpanded && (
                    <button
                      type="button"
                      onClick={() => setHashtagsExpanded(true)}
                      className="px-3 py-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      +{all.length - limit} more…
                    </button>
                  )}
                </div>
              </div>
            )
          })()}

          {/* Show less for likes/dislikes */}
          {hashtagsExpanded && (linkableEntities!.likes.length > 10 || linkableEntities!.dislikes.length > 10) && (
            <button
              type="button"
              onClick={() => setHashtagsExpanded(false)}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors mt-1"
            >
              Show less
            </button>
          )}
        </div>
      )}

      {/* Publish date + External URL */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Publish date</p>
          <input
            type="date"
            value={publishedAt ? new Date(publishedAt).toISOString().split('T')[0] : ''}
            onChange={(e) => { setPublishedAt(e.target.value ? new Date(e.target.value + 'T12:00:00').toISOString() : ''); setSaved(false) }}
            className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 outline-none focus:border-gray-400 bg-transparent"
          />
          <p className="text-xs text-gray-400 mt-1">Leave empty to auto-set on publish</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">External URL</p>
          <input
            value={externalUrl}
            onChange={(e) => { setExternalUrl(e.target.value); setSaved(false) }}
            placeholder="https://… (link to the original if hosted elsewhere)"
            className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 outline-none focus:border-gray-400 bg-transparent"
          />
        </div>
      </div>

      {/* Featured Image URL is now the drag/drop zone above the title */}

      {/* Actions */}
      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={() => save()}
          disabled={isPending || !title.trim()}
          className="bg-black text-white text-sm px-5 py-2.5 rounded-lg hover:bg-gray-800 disabled:opacity-40 transition-colors"
        >
          {isPending ? 'Saving…' : saved ? 'Saved ✓' : statusLabel[status]}
        </button>

        {/* Quick-publish toggle */}
        {status !== 'published' && (
          <button
            type="button"
            onClick={() => save('published')}
            disabled={isPending || !title.trim()}
            className="text-sm px-4 py-2.5 border border-gray-200 rounded-lg hover:border-gray-400 text-gray-600 disabled:opacity-40 transition-colors"
          >
            Publish now
          </button>
        )}
        {status === 'published' && (
          <button
            type="button"
            onClick={() => save('unlisted')}
            disabled={isPending}
            className="text-sm px-4 py-2.5 border border-gray-200 rounded-lg hover:border-gray-400 text-gray-600 disabled:opacity-40 transition-colors"
          >
            Unpublish
          </button>
        )}
        {status !== 'draft' && (
          <button
            type="button"
            onClick={() => save('draft')}
            disabled={isPending}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            Revert to draft
          </button>
        )}

        {/* Delete */}
        {!isNew && (
          confirmDelete ? (
            <span className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-red-500">Delete this writing?</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-40 transition-colors"
              >
                {isPending ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="ml-auto text-xs text-gray-300 hover:text-red-500 transition-colors"
            >
              Delete
            </button>
          )
        )}

        {(isNew || confirmDelete) && (
          <span className={`${confirmDelete ? '' : 'ml-auto'} text-xs text-gray-400`}>
            {wordCount} words
          </span>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
