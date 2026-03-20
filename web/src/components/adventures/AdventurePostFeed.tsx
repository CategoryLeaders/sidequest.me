'use client'

import { useState, useEffect, useRef } from 'react'
import type { AdventurePost, PostType, Chapter } from '@/lib/adventures'

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

export default function AdventurePostFeed({ adventureId, chapters = [] }: AdventurePostFeedProps) {
  const [posts, setPosts] = useState<AdventurePost[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'timeline' | 'chapters'>('timeline')

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

  const formatDate = (d: string) => {
    const date = new Date(d)
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      + ' · '
      + date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  const renderPost = (post: AdventurePost) => (
    <PostCard
      key={post.id}
      post={post}
      chapters={chapters}
      viewMode={viewMode}
      onDelete={handleDelete}
      onAssignChapter={handleAssignChapter}
      onUpdate={(updated) => setPosts((prev) => prev.map((p) => p.id === updated.id ? { ...p, ...updated } : p))}
      formatDate={formatDate}
    />
  )

  return (
    <div className="mt-10 border-t-3 border-ink pt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-head font-[900] text-[1rem] uppercase">
          Posts ({posts.length})
        </h3>
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
                  <div className="space-y-3 pl-4 border-l-2 border-ink/5">
                    {chapterPosts.map((post) => renderPost(post))}
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
                <div className="space-y-3 pl-4 border-l-2 border-ink/5">
                  {unassigned.map((post) => renderPost(post))}
                </div>
              </div>
            )
          })()}
        </div>
      ) : (
        /* ── Timeline view ── */
        <div className="space-y-4">
          {posts.map((post) => renderPost(post))}
        </div>
      )}
    </div>
  )
}

/* ── Inline-editable post card ── */
function PostCard({
  post, chapters, viewMode, onDelete, onAssignChapter, onUpdate, formatDate,
}: {
  post: AdventurePost
  chapters: Chapter[]
  viewMode: string
  onDelete: (id: string) => void
  onAssignChapter: (id: string, ci: number | null) => void
  onUpdate: (updated: Partial<AdventurePost> & { id: string }) => void
  formatDate: (d: string) => string
}) {
  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState(post.body ?? '')
  const [editLocation, setEditLocation] = useState(post.location_name ?? '')
  const [saving, setSaving] = useState(false)

  const meta = POST_TYPE_LABELS[post.post_type as PostType] ?? POST_TYPE_LABELS.micro
  const chapterLabel = post.chapter_index !== null && post.chapter_index !== undefined && chapters[post.chapter_index]
    ? `Ch.${post.chapter_index + 1}: ${chapters[post.chapter_index].title}`
    : null

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

  return (
    <div className="border-3 border-ink/20 p-4 bg-bg-card group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[0.6rem] font-bold uppercase text-ink-muted">
            {meta.icon} {meta.label}
          </span>
          {!editing && post.location_name && (
            <span className="font-mono text-[0.6rem] text-orange">📍 {post.location_name}</span>
          )}
          {viewMode === 'timeline' && chapterLabel && (
            <span className="font-mono text-[0.55rem] px-1.5 py-0.5 bg-ink/5 text-ink-muted">{chapterLabel}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {chapters.length > 0 && (
            <select
              value={post.chapter_index ?? ''}
              onChange={(e) => onAssignChapter(post.id, e.target.value === '' ? null : Number(e.target.value))}
              className="font-mono text-[0.55rem] text-ink-muted bg-transparent border border-transparent hover:border-ink/20 focus:border-ink/30 px-1 py-0.5 cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all outline-none"
            >
              <option value="">No chapter</option>
              {chapters.map((ch, i) => (
                <option key={i} value={i}>Ch.{i + 1}: {ch.title}</option>
              ))}
            </select>
          )}
          <span className="font-mono text-[0.55rem] text-ink-muted">{formatDate(post.posted_at)}</span>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="font-mono text-[0.55rem] text-ink-muted hover:text-ink opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            >
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(post.id)}
            className="font-mono text-[0.55rem] text-ink-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>

      {editing ? (
        <div className="space-y-2 mt-2">
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
          {post.body && <p className="text-[0.88rem] leading-relaxed mb-2">{post.body}</p>}
          {post.photos && post.photos.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2">
              {post.photos.map((photo, i) => {
                // Handle both {url, caption} objects and plain URL strings (legacy data)
                const url = typeof photo === 'string' ? photo : (photo as { url: string }).url
                const caption = typeof photo === 'string' ? '' : (photo as { url: string; caption?: string }).caption ?? ''
                return (
                  <div key={i} className="w-24 h-24 border-2 border-ink/10 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={caption} className="w-full h-full object-cover" />
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
