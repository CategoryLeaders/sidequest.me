'use client'

import { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { JSONContent } from '@tiptap/core'
import type { Writing, WritingStatus } from '@/lib/writings'
import { slugifyTitle } from '@/lib/writings'

// Lazy-load editor to avoid SSR issues with ProseMirror
const WritingEditor = dynamic(() => import('./WritingEditor'), { ssr: false })

/* ── Linkable entity types passed from server ── */
interface LinkableCompany { id: string; name: string; slug: string; brandColour: string | null }
interface LinkableProject { id: string; name: string; slug: string }
interface LinkableItem { id: string; label: string }

export interface LinkableEntities {
  companies: LinkableCompany[]
  projects: LinkableProject[]
  likes: LinkableItem[]
  dislikes: LinkableItem[]
}

export interface WritingLinkRef {
  entity_type: string
  entity_id: string
}

interface WritingEditorFormProps {
  username: string
  writing?: Partial<Writing>           // undefined = new post
  availableTags?: string[]             // profile site tags
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
  const [imageUrl, setImageUrl] = useState(writing?.image_url ?? '')
  const [links, setLinks] = useState<WritingLinkRef[]>(existingLinks)
  const [status, setStatus] = useState<WritingStatus>(writing?.status ?? 'draft')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

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
      if (exists) return prev.filter((l) => !(l.entity_type === entityType && l.entity_id === entityId))
      return [...prev, { entity_type: entityType, entity_id: entityId }]
    })
    setSaved(false)
  }

  const isLinked = (entityType: string, entityId: string) =>
    links.some((l) => l.entity_type === entityType && l.entity_id === entityId)

  const handleImageUpload = async (file: File): Promise<string> => {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload-image', { method: 'POST', body: form })
    if (!res.ok) throw new Error('Upload failed')
    const { url } = await res.json() as { url: string }
    return url
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

      {/* Tags */}
      <div className="mt-6">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Tags</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {availableTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-sm border transition-all ${
                tags.includes(tag)
                  ? 'border-black bg-black text-white'
                  : 'border-gray-200 text-gray-500 hover:border-gray-400'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
            placeholder="Add custom tag…"
            className="text-sm border border-gray-200 rounded-md px-3 py-1.5 outline-none focus:border-gray-400 w-48"
          />
          {tags.filter((t) => !availableTags.includes(t)).map((t) => (
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

          {/* Likes */}
          {linkableEntities!.likes.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-400 mb-1.5">Likes</p>
              <div className="flex flex-wrap gap-2">
                {linkableEntities!.likes.map((l) => (
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
              </div>
            </div>
          )}

          {/* Dislikes */}
          {linkableEntities!.dislikes.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-400 mb-1.5">Hates</p>
              <div className="flex flex-wrap gap-2">
                {linkableEntities!.dislikes.map((d) => (
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
              </div>
            </div>
          )}
        </div>
      )}

      {/* External URL */}
      <div className="mt-6">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">External URL</p>
        <input
          value={externalUrl}
          onChange={(e) => { setExternalUrl(e.target.value); setSaved(false) }}
          placeholder="https://… (link to the original if hosted elsewhere)"
          className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 outline-none focus:border-gray-400 bg-transparent"
        />
      </div>

      {/* Featured Image URL */}
      <div className="mt-6">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Featured Image</p>
        <input
          value={imageUrl}
          onChange={(e) => { setImageUrl(e.target.value); setSaved(false) }}
          placeholder="https://… (hero image URL)"
          className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 outline-none focus:border-gray-400 bg-transparent"
        />
        {imageUrl.trim() && (
          <div className="mt-2 rounded-md overflow-hidden border border-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Preview" className="w-full h-auto max-h-48 object-cover" />
          </div>
        )}
      </div>

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

        <span className="ml-auto text-xs text-gray-400">
          {wordCount} words
        </span>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
