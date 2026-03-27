import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Writing } from '@/lib/writings'
import { readTimeMinutes } from '@/lib/writings'

const STATUS_BADGE: Record<string, string> = {
  draft:     'bg-ink/[0.06] text-ink/60',
  scheduled: 'bg-yellow-100 text-yellow-700',
  published: 'bg-green-100 text-green-700',
  unlisted:  'bg-blue-100 text-blue-700',
}

const STATUS_LABEL: Record<string, string> = {
  draft:     'Draft',
  scheduled: 'Scheduled',
  published: 'Published',
  unlisted:  'Unlisted',
}

export default async function AdminWritingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { username } = await params
  const { tab } = await searchParams
  const showDrafts = tab === 'drafts'

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${username}`)

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id, username')
    .eq('username', username)
    .single() as { data: { id: string; username: string } | null }

  if (!profile) notFound()
  if (profile.id !== user.id) redirect(`/${username}`)

  const { data: writings } = await (supabase as any)
    .from('writings')
    .select('id, title, slug, status, tags, word_count, published_at, updated_at')
    .eq('user_id', profile.id)
    .order('updated_at', { ascending: false }) as { data: Partial<Writing>[] | null }

  const all = writings ?? []

  // Split into published (+ scheduled/unlisted) and drafts
  const published = all
    .filter((w) => w.status !== 'draft')
    .sort((a, b) => {
      // Published posts: sort by published_at desc, fall back to updated_at
      const dateA = a.published_at || a.updated_at || ''
      const dateB = b.published_at || b.updated_at || ''
      return dateB.localeCompare(dateA)
    })

  const drafts = all
    .filter((w) => w.status === 'draft')
    .sort((a, b) => {
      const dateA = a.updated_at || ''
      const dateB = b.updated_at || ''
      return dateB.localeCompare(dateA)
    })

  const rows = showDrafts ? drafts : published

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Writings</h1>
          <p className="text-sm text-ink/50 mt-1">
            {published.length} published · {drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'}
          </p>
        </div>
        <Link
          href={`/${username}/admin/writings/new`}
          className="bg-black text-white text-sm px-4 py-2  hover:bg-ink/80 transition-colors"
        >
          + New post
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-ink/[var(--opacity-muted)]">
        <Link
          href={`/${username}/admin/writings`}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            !showDrafts
              ? 'border-black text-black'
              : 'border-transparent text-ink/40 hover:text-ink/60'
          }`}
        >
          Published ({published.length})
        </Link>
        <Link
          href={`/${username}/admin/writings?tab=drafts`}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            showDrafts
              ? 'border-black text-black'
              : 'border-transparent text-ink/40 hover:text-ink/60'
          }`}
        >
          Drafts ({drafts.length})
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-20 text-ink/40">
          {showDrafts ? (
            <>
              <p className="text-lg mb-2">No drafts.</p>
              <p className="text-sm">
                <Link href={`/${username}/admin/writings/new`} className="underline">
                  Start a new post →
                </Link>
              </p>
            </>
          ) : (
            <>
              <p className="text-lg mb-2">No published posts yet.</p>
              <p className="text-sm">
                {drafts.length > 0 ? (
                  <Link href={`/${username}/admin/writings?tab=drafts`} className="underline">
                    You have {drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'} →
                  </Link>
                ) : (
                  <Link href={`/${username}/admin/writings/new`} className="underline">
                    Write your first post →
                  </Link>
                )}
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="divide-y divide-ink/10">
          {rows.map((w) => (
            <div key={w.id} className="py-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {!showDrafts && (
                    <span
                      className={`text-xs font-medium px-2 py-0.5  ${STATUS_BADGE[w.status!]}`}
                    >
                      {STATUS_LABEL[w.status!]}
                    </span>
                  )}
                  {w.tags && w.tags.length > 0 && (
                    <span className="text-xs text-ink/40">
                      {w.tags.join(', ')}
                    </span>
                  )}
                </div>
                <Link
                  href={`/${username}/admin/writings/${w.slug}`}
                  className="font-medium text-ink/90 hover:text-black line-clamp-1"
                >
                  {w.title}
                </Link>
                <p className="text-xs text-ink/40 mt-1">
                  {w.word_count ? `${w.word_count} words · ${readTimeMinutes(w.word_count)} min read · ` : ''}
                  {w.status === 'published' && w.published_at
                    ? `Published ${new Date(w.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : `Updated ${new Date(w.updated_at!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/${username}/admin/writings/${w.slug}`}
                  className="text-xs text-ink/50 hover:text-black px-3 py-1.5 border border-ink/[var(--opacity-muted)]  hover:border-ink/40 transition-colors"
                >
                  Edit
                </Link>
                {w.status === 'published' && (
                  <Link
                    href={`/${username}/writings/${w.slug}`}
                    className="text-xs text-ink/50 hover:text-black px-3 py-1.5 border border-ink/[var(--opacity-muted)]  hover:border-ink/40 transition-colors"
                  >
                    View ↗
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
