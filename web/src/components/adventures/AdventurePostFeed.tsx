'use client'

import { useState, useEffect, useRef } from 'react'
import type { AdventurePost, PostType, Chapter, PhotoItem } from '@/lib/adventures'
import { ImageMosaic } from '@/components/ui/ImageMosaic'

interface AdventurePostFeedProps {
  adventureId: string
  chapters?: Chapter[]
}

const POST_TYPE_LABELS: Record<PostType, { icon: string; label: string }> = {
  micro: { icon: '💬', label: 'Quick post' },
  photo: { icon: '📸', label: 'Photos' },
  checkin: { icon: '📍', label: 'Check-in' },
  article_link: { icon: '📝', label: 'Link writing' },
}

// ── Normalize legacy plain-string photos into PhotoItem objects ──────────────
function normalizePhoto(raw: unknown): PhotoItem {
  if (typeof raw === 'string') return { url: raw }
  return raw as PhotoItem
}

// ── Smart photo display — delegates to shared ImageMosaic algorithm ──────────
function PhotoDisplay({
  photos,
  interactive = false,
  featuredIndex = 0,
  onFeature,
}: {
  photos: PhotoItem[]
  interactive?: boolean
  featuredIndex?: number
  onFeature?: (index: number) => void
}) {
  const count = photos.length
  if (count === 0) return null

  const label =
    count === 1 ? 'Photo'
    : count === 2 ? '2 Photos'
    : count === 3 ? '3 Photos'
    : `${count} Photos${interactive ? ' — ★ to feature' : ''}`

  const items = photos.map((p) => ({
    url: p.url,
    alt: p.caption ?? undefined,
    width: p.width,
    height: p.height,
  }))

  return (
    <div>
      <p className="font-mono text-[0.52rem] text-ink-muted uppercase tracking-wide mb-1.5">{label}</p>
      <ImageMosaic
        images={items}
        featuredIndex={featuredIndex}
        // In interactive (editor) mode: clicks star a photo, no lightbox.
        // In public view: clicks open the lightbox (onImageClick undefined).
        onImageClick={interactive ? (idx) => onFeature?.(idx) : undefined}
        renderOverlay={interactive ? (idx, isFeatured) => (
          <>
            {isFeatured && (
              <div className="absolute bottom-2 left-2 font-mono text-[0.45rem] bg-black/60 text-white px-1.5 py-0.5 uppercase tracking-wider pointer-events-none">
                Featured
              </div>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onFeature?.(idx) }}
              title={isFeatured ? 'Featured (click another to change)' : 'Set as featured photo'}
              className={`absolute top-2 right-2 w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] transition-all cursor-pointer z-10 ${
                isFeatured
                  ? 'bg-orange text-white opacity-100 shadow-md'
                  : 'bg-black/50 text-white/80 opacity-60 hover:opacity-100 hover:bg-orange/80'
              }`}
            >
              {isFeatured ? '★' : '☆'}
            </button>
          </>
        ) : undefined}
        gap={3}
      />
      {count === 1 && photos[0].caption && (
        <p className="font-mono text-[0.5rem] text-ink-muted mt-1 italic">{photos[0].caption}</p>
      )}
    </div>
  )
}

// ── Main feed component ──────────────────────────────────────────────────────
export default function AdventurePostFeed({ adventureId, chapters = [] }: AdventurePostFeedProps) {
  const [posts, setPosts] = useState<AdventurePost[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'timeline' | 'chapters'>('timeline')
  const [sortNewest, setSortNewest] = useState(false)

  // Composer state
  const [composerType, setComposerType] = useState<PostType>('micro')
  const [composerOpen, setComposerOpen] = useState(false)
  const [body, setBody] = useState('')
  const [locationName, setLocationName] = useState('')
  const [chapterIndex, setChapterIndex] = useState<number | null>(null)
  const [photos, setPhotos] = useState<{ url: string; caption?: string }[]>([])
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const fetchPosts = () => {
    fetch(`/api/adventure-posts?adventure_id=${adventureId}`)
      .then((r) => r.json())
      .then((data) => {
        setPosts(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchPosts() }, [adventureId])

  const handlePhotoUpload = async (files: FileList) => {
    const newPhotos = [...photos]
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      const form = new FormData()
      form.append('file', file)
      form.append('context', 'adventures')
      form.append('entityId', adventureId)
      try {
        const res = await fetch('/api/upload-image', { method: 'POST', body: form })
        if (res.ok) {
          const { url } = await res.json() as { url: string }
          newPhotos.push({ url })
        }
      } catch { /* skip failed uploads */ }
    }
    setPhotos(newPhotos)
  }

  const handlePost = async () => {
    if (composerType === 'micro' && !body.trim()) return
    if (composerType === 'photo' && photos.length === 0) return
    if (composerType === 'checkin' && !locationName.trim()) return

    setPosting(true)
    setError(null)

    try {
      const payload: Record<string, unknown> = {
        adventure_id: adventureId,
        post_type: composerType,
        body: body.trim() || null,
        location_name: locationName.trim() || null,
        photos: composerType === 'photo' ? photos : [],
        chapter_index: chapterIndex,
      }

      const res = await fetch('/api/adventure-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const { error: e } = await res.json().catch(() => ({ error: 'Post failed' }))
        setError(e)
        return
      }

      // Reset composer
      setBody('')
      setLocationName('')
      setPhotos([])
      setChapterIndex(null)
      setComposerOpen(false)
      fetchPosts()
    } catch {
      setError('Failed to create post')
    } finally {
      setPosting(false)
    }
  }

  const handleDelete = async (postId: string) => {
    const res = await fetch(`/api/adventure-posts/${postId}`, { method: 'DELETE' })
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== postId))
    }
  }

  const handleAssignChapter = async (postId: string, newChapterIndex: number | null) => {
    const res = await fetch(`/api/adventure-posts/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapter_index: newChapterIndex }),
    })
    if (res.ok) {
      setPosts((prev) => prev.map((p) =>
        p.id === postId ? { ...p, chapter_index: newChapterIndex } : p
      ))
    }
  }

  const renderPost = (post: AdventurePost, isFirst: boolean) => (
    <PostCard
      key={post.id}
      post={post}
      chapters={chapters}
      viewMode={viewMode}
      isFirst={isFirst}
      onDelete={handleDelete}
      onAssignChapter={handleAssignChapter}
      onUpdate={(updated) => setPosts((prev) => prev.map((p) => p.id === updated.id ? { ...p, ...updated } : p))}
    />
  )

  return (
    <div className="mt-10 border-t-3 border-ink pt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="font-head font-[900] text-[1rem] uppercase">
            Posts ({posts.length})
          </h3>
          {posts.length > 1 && (
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setSortNewest(false)}
                className={`font-mono text-[0.55rem] font-bold uppercase px-2 py-0.5 border-2 transition-all cursor-pointer ${
                  !sortNewest ? 'border-ink bg-ink text-bg' : 'border-ink/20 text-ink-muted hover:border-ink/50'
                }`}
              >
                Start
              </button>
              <button
                type="button"
                onClick={() => setSortNewest(true)}
                className={`font-mono text-[0.55rem] font-bold uppercase px-2 py-0.5 border-2 transition-all cursor-pointer ${
                  sortNewest ? 'border-ink bg-ink text-bg' : 'border-ink/20 text-ink-muted hover:border-ink/50'
                }`}
              >
                Latest
              </button>
            </div>
          )}
        </div>
        {!composerOpen && (
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="px-4 py-1.5 border-3 border-ink bg-bg-card font-head font-bold text-[0.68rem] uppercase hover:bg-ink hover:text-bg transition-colors cursor-pointer"
          >
            + Add post
          </button>
        )}
      </div>

      {/* ── Composer ── */}
      {composerOpen && (
        <div className="mb-8 border-3 border-ink p-4 bg-bg-card">
          {/* Post type selector */}
          <div className="flex gap-2 mb-4">
            {(['micro', 'photo', 'checkin'] as PostType[]).map((pt) => {
              const meta = POST_TYPE_LABELS[pt]
              return (
                <button
                  key={pt}
                  type="button"
                  onClick={() => setComposerType(pt)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[0.65rem] font-bold uppercase border-2 transition-all cursor-pointer ${
                    composerType === pt
                      ? 'border-ink bg-ink text-bg'
                      : 'border-ink/30 bg-bg hover:border-ink/60'
                  }`}
                >
                  {meta.icon} {meta.label}
                </button>
              )
            })}
          </div>

          {/* Body text (for micro and photo captions) */}
          {(composerType === 'micro' || composerType === 'photo') && (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={composerType === 'micro' ? "What's happening?" : 'Caption (optional)'}
              rows={composerType === 'micro' ? 3 : 2}
              className="w-full px-3 py-2 border-3 border-ink bg-bg font-body text-[0.88rem] focus:outline-none focus:shadow-[3px_3px_0_var(--ink)] transition-shadow resize-y mb-3"
            />
          )}

          {/* Photo upload */}
          {composerType === 'photo' && (
            <div className="mb-3">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handlePhotoUpload(e.target.files)
                  e.target.value = ''
                }}
              />
              {photos.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-2">
                  {photos.map((p, i) => (
                    <div key={i} className="relative w-20 h-20 border-2 border-ink overflow-hidden group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute top-0 right-0 bg-black/60 text-white text-[9px] w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="px-3 py-1.5 border-2 border-dashed border-ink/30 font-mono text-[0.65rem] text-ink-muted hover:border-ink/60 cursor-pointer transition-colors"
              >
                📸 Add photos
              </button>
            </div>
          )}

          {/* Location (for check-ins, optional for others) */}
          {composerType === 'checkin' && (
            <input
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="📍 Location name (e.g. Black Rock City)"
              className="w-full px-3 py-2 border-3 border-ink bg-bg font-mono text-[0.82rem] focus:outline-none focus:shadow-[3px_3px_0_var(--ink)] transition-shadow mb-3"
            />
          )}

          {/* Optional location for micro/photo posts */}
          {composerType !== 'checkin' && (
            <input
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="📍 Location (optional)"
              className="w-full px-3 py-2 border-2 border-ink/20 bg-bg font-mono text-[0.75rem] focus:outline-none focus:border-ink/50 transition-colors mb-3"
            />
          )}

          {/* Chapter selector */}
          {chapters.length > 0 && (
            <div className="mb-3">
              <select
                value={chapterIndex ?? ''}
                onChange={(e) => setChapterIndex(e.target.value === '' ? null : Number(e.target.value))}
                className="px-3 py-2 border-2 border-ink/20 bg-bg font-mono text-[0.75rem] focus:outline-none focus:border-ink/50 cursor-pointer transition-colors"
              >
                <option value="">No chapter</option>
                {chapters.map((ch, i) => (
                  <option key={i} value={i}>Ch.{i + 1}: {ch.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePost}
              disabled={posting}
              className="px-5 py-2 bg-ink text-bg font-head font-bold text-[0.72rem] uppercase border-3 border-ink hover:bg-orange hover:border-orange transition-colors disabled:opacity-40 cursor-pointer"
            >
              {posting ? 'Posting…' : 'Post'}
            </button>
            <button
              type="button"
              onClick={() => { setComposerOpen(false); setBody(''); setPhotos([]); setLocationName(''); setError(null) }}
              className="font-mono text-[0.68rem] text-ink-muted hover:text-ink cursor-pointer transition-colors"
            >
              Cancel
            </button>
          </div>

          {error && <p className="mt-2 font-mono text-[0.72rem] text-red-500">{error}</p>}
        </div>
      )}

      {/* ── View mode toggle ── */}
      {chapters.length > 0 && posts.length > 0 && (
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1 font-mono text-[0.6rem] font-bold uppercase border-2 transition-all cursor-pointer ${
              viewMode === 'timeline' ? 'border-ink bg-ink text-bg' : 'border-ink/20 hover:border-ink/50'
            }`}
          >
            Timeline
          </button>
          <button
            type="button"
            onClick={() => setViewMode('chapters')}
            className={`px-3 py-1 font-mono text-[0.6rem] font-bold uppercase border-2 transition-all cursor-pointer ${
              viewMode === 'chapters' ? 'border-ink bg-ink text-bg' : 'border-ink/20 hover:border-ink/50'
            }`}
          >
            By chapter
          </button>
        </div>
      )}

      {/* ── Post feed ── */}
      {loading ? (
        <p className="font-mono text-[0.78rem] opacity-40">Loading posts…</p>
      ) : posts.length === 0 ? (
        <p className="font-mono text-[0.78rem] opacity-40 text-center py-8">
          No posts yet. Add your first update to this adventure.
        </p>
      ) : viewMode === 'chapters' && chapters.length > 0 ? (
        /* ── Chapter-grouped view ── */
        <div className="space-y-6">
          {chapters.map((ch, ci) => {
            const chapterPosts = posts.filter((p) => p.chapter_index === ci)
            return (
              <div key={ci}>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-ink/10">
                  <span className="font-mono text-[0.6rem] font-bold text-orange">Ch.{ci + 1}</span>
                  <span className="font-head font-bold text-[0.85rem] uppercase">{ch.title}</span>
                  <span className="font-mono text-[0.55rem] text-ink-muted ml-auto">{chapterPosts.length} posts</span>
                </div>
                {chapterPosts.length === 0 ? (
                  <p className="font-mono text-[0.68rem] opacity-30 py-3 pl-4">No posts in this chapter yet.</p>
                ) : (
                  <div className="pl-4 border-l-2 border-ink/5">
                    {chapterPosts.map((post, index) => renderPost(post, index === 0))}
                  </div>
                )}
              </div>
            )
          })}
          {/* Unassigned posts */}
          {(() => {
            const unassigned = posts.filter((p) => p.chapter_index === null || p.chapter_index === undefined)
            if (unassigned.length === 0) return null
            return (
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-ink/10">
                  <span className="font-head font-bold text-[0.85rem] uppercase text-ink-muted">Unassigned</span>
                  <span className="font-mono text-[0.55rem] text-ink-muted ml-auto">{unassigned.length} posts</span>
                </div>
                <div className="pl-4 border-l-2 border-ink/5">
                  {unassigned.map((post, index) => renderPost(post, index === 0))}
                </div>
              </div>
            )
          })()}
        </div>
      ) : (
        /* ── Timeline view ── */
        <div>
          {(sortNewest ? [...posts].reverse() : posts).map((post, index) => renderPost(post, index === 0))}
        </div>
      )}
    </div>
  )
}

// ── Magazine-layout post card ────────────────────────────────────────────────
function PostCard({
  post,
  chapters,
  viewMode,
  isFirst,
  onDelete,
  onAssignChapter,
  onUpdate,
}: {
  post: AdventurePost
  chapters: Chapter[]
  viewMode: string
  isFirst: boolean
  onDelete: (id: string) => void
  onAssignChapter: (id: string, ci: number | null) => void
  onUpdate: (updated: Partial<AdventurePost> & { id: string }) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState(post.body ?? '')
  const [editLocation, setEditLocation] = useState(post.location_name ?? '')
  const [saving, setSaving] = useState(false)

  // Normalize photos and derive featured index
  const normalizedPhotos = (post.photos ?? [] as unknown[]).map(normalizePhoto)
  const [featuredIndex, setFeaturedIndex] = useState(() => {
    const fi = normalizedPhotos.findIndex((p) => p.featured)
    return fi >= 0 ? fi : 0
  })

  const meta = POST_TYPE_LABELS[post.post_type as PostType] ?? POST_TYPE_LABELS.micro
  const chapterLabel =
    post.chapter_index !== null &&
    post.chapter_index !== undefined &&
    chapters[post.chapter_index]
      ? `Ch.${post.chapter_index + 1}: ${chapters[post.chapter_index].title}`
      : null

  // Parse date parts for sidebar
  const date = new Date(post.posted_at)
  const day = date.getDate()
  const monthYear = date
    .toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    .toUpperCase()
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch(`/api/adventure-posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body: editBody.trim() || null,
        location_name: editLocation.trim() || null,
      }),
    })
    if (res.ok) {
      onUpdate({ id: post.id, body: editBody.trim() || null, location_name: editLocation.trim() || null })
      setEditing(false)
    }
    setSaving(false)
  }

  const handleCancel = () => {
    setEditBody(post.body ?? '')
    setEditLocation(post.location_name ?? '')
    setEditing(false)
  }

  const handleFeature = async (index: number) => {
    setFeaturedIndex(index)
    const updatedPhotos = normalizedPhotos.map((p, i) => ({ ...p, featured: i === index }))
    await fetch(`/api/adventure-posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photos: updatedPhotos }),
    })
    onUpdate({ id: post.id, photos: updatedPhotos })
  }

  return (
    <div
      className={`relative group ${!isFirst ? 'border-t-[3px] border-ink' : ''}`}
      style={!isFirst ? { paddingTop: 22 } : undefined}
    >
      {/* ── Hover controls: chapter dropdown, Edit, Delete ── */}
      <div className="absolute top-0 right-0 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {viewMode === 'timeline' && chapterLabel && (
          <span className="font-mono text-[0.52rem] px-1.5 py-0.5 border border-ink/20 text-ink-muted bg-bg-card">
            {chapterLabel}
          </span>
        )}
        {chapters.length > 0 && (
          <select
            value={post.chapter_index ?? ''}
            onChange={(e) =>
              onAssignChapter(post.id, e.target.value === '' ? null : Number(e.target.value))
            }
            className="font-mono text-[0.52rem] text-ink-muted bg-bg-card border border-ink/20 px-1.5 py-0.5 cursor-pointer focus:outline-none"
          >
            <option value="">No chapter</option>
            {chapters.map((ch, i) => (
              <option key={i} value={i}>
                Ch.{i + 1}: {ch.title}
              </option>
            ))}
          </select>
        )}
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="font-mono text-[0.52rem] px-1.5 py-0.5 border border-ink/20 text-ink-muted bg-bg-card hover:text-ink hover:border-ink transition-colors cursor-pointer"
          >
            Edit
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(post.id)}
          className="font-mono text-[0.52rem] px-1.5 py-0.5 border border-ink/20 text-ink-muted bg-bg-card hover:text-red-500 hover:border-red-300 transition-colors cursor-pointer"
        >
          Delete
        </button>
      </div>

      {/* ── Magazine 2-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '96px 1fr', gap: 0 }}>

        {/* ── Sidebar ── */}
        <div className="pr-4 pt-0.5 flex-shrink-0">
          {/* Day number — large and bold */}
          <div className="font-head font-[900] text-[1.5rem] leading-none text-ink">{day}</div>
          {/* Month + year — readable, not muted */}
          <div className="font-mono text-[0.68rem] uppercase text-ink/80 leading-snug mt-1 tracking-wide font-bold">
            {monthYear}
          </div>
          {/* Time */}
          <div className="font-mono text-[0.62rem] text-ink/70 mt-0.5 font-medium">{time}</div>
          {/* Location — prominent orange */}
          {post.location_name && (
            <div className="font-head font-bold text-[0.68rem] uppercase text-orange mt-2.5 leading-tight break-words">
              📍 {post.location_name}
            </div>
          )}
          {/* Post type — tiny muted */}
          <div className="font-mono text-[0.48rem] text-ink-muted uppercase mt-3 tracking-wide">
            {meta.icon} {meta.label}
          </div>
        </div>

        {/* ── Content column ── */}
        <div className="border-l-[3px] border-ink pl-[18px] min-w-0">
          {editing ? (
            <div className="space-y-2">
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border-3 border-ink bg-bg font-body text-[0.88rem] focus:outline-none focus:shadow-[3px_3px_0_var(--ink)] transition-shadow resize-y"
              />
              <input
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="📍 Location (optional)"
                className="w-full px-3 py-2 border-2 border-ink/20 bg-bg font-mono text-[0.75rem] focus:outline-none focus:border-ink/50 transition-colors"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-1.5 bg-ink text-bg font-mono text-[0.65rem] font-bold uppercase border-2 border-ink hover:bg-orange hover:border-orange transition-colors disabled:opacity-40 cursor-pointer"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="font-mono text-[0.65rem] text-ink-muted hover:text-ink cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {post.body && (
                <p className="text-[0.88rem] leading-relaxed mb-3 whitespace-pre-wrap">{post.body}</p>
              )}
              {normalizedPhotos.length > 0 && (
                <PhotoDisplay
                  photos={normalizedPhotos}
                  interactive
                  featuredIndex={featuredIndex}
                  onFeature={handleFeature}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
