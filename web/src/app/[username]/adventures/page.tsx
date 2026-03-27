import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Adventure, Waypoint } from '@/lib/adventures'
import { STATUS_META, THEME_META } from '@/lib/adventures'
import { MetadataLine } from '@/components/ui'

interface Props {
  params: Promise<{ username: string }>
}

export default async function AdventuresListPage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id, username')
    .eq('username', username)
    .single() as { data: { id: string; username: string } | null }

  if (!profile) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === profile.id

  // Fetch adventures — owners see all, visitors only see non-draft
  let query = (supabase as any)
    .from('adventures')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  if (!isOwner) {
    query = query.neq('status', 'draft')
  }

  const { data: adventures } = await query as { data: Adventure[] | null }
  const rows = adventures ?? []

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <main className="max-w-[1100px] mx-auto px-8 py-12 relative">
      <div className="doodle" style={{ width: 70, height: 70, top: 60, right: -10 }} />

      <h1 className="font-head font-[900] text-[clamp(1.8rem,4vw,2.8rem)] uppercase leading-[0.95] mb-2">
        Adventures
      </h1>
      <p className="text-[0.95rem] opacity-60 mb-8">
        Trips, events, and journeys — documented as they happen.
      </p>

      {rows.length === 0 ? (
        <p className="font-mono text-[0.78rem] opacity-40 text-center py-16">
          No adventures yet.
          {isOwner && (
            <> <Link href={`/${username}/admin/adventures/new`} className="text-orange no-underline">Create your first →</Link></>
          )}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {rows.map((a) => {
            const sm = STATUS_META[a.status as keyof typeof STATUS_META]
            const tm = THEME_META[a.layout_theme as keyof typeof THEME_META]
            const routeNames = (a.route ?? []).filter((w: Waypoint) => w.name.trim()).map((w: Waypoint) => w.name.trim())
            const isDraft = a.status === 'draft'

            return (
              <Link
                key={a.id}
                href={`/${username}/adventures/${a.slug}`}
                className={`border-3 border-ink bg-[var(--bg-card)] no-underline block card-hover ${
                  isDraft ? 'opacity-60' : ''
                }`}
              >
                {a.cover_image_url && (
                  <div className="w-full h-44 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.cover_image_url} alt={a.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`font-mono text-[0.55rem] font-bold uppercase px-2 py-0.5 ${
                      a.status === 'live' ? 'bg-orange/20 text-orange' :
                      a.status === 'upcoming' ? 'bg-yellow/20 text-ink' :
                      a.status === 'complete' ? 'bg-green/20 text-green' :
                      'bg-ink/10 text-ink-muted'
                    }`}>
                      {sm.label}
                    </span>
                    <span className="font-mono text-[0.55rem] text-ink-muted">{tm.icon} {tm.label}</span>
                  </div>

                  <h2 className="font-head font-[900] text-[1.1rem] uppercase leading-tight mb-1">
                    {a.title}
                  </h2>

                  {a.description && (
                    <p className="text-[0.82rem] opacity-60 leading-snug mb-3 line-clamp-2">{a.description}</p>
                  )}

                  <MetadataLine
                    items={[
                      ...(a.location_name ? [{ icon: '📍', label: a.location_name }] : []),
                      ...(routeNames.length > 1 ? [{ icon: '🗺️', label: routeNames.join(' → ') }] : []),
                      ...(a.start_date ? [{ icon: '📅', label: `${formatDate(a.start_date)}${a.end_date ? ` — ${formatDate(a.end_date)}` : ''}` }] : []),
                    ]}
                  />
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {isOwner && rows.length > 0 && (
        <div className="mt-8 text-center">
          <Link
            href={`/${username}/admin/adventures/new`}
            className="font-mono text-[0.7rem] text-ink-muted hover:text-orange no-underline transition-colors"
          >
            + Create new adventure
          </Link>
        </div>
      )}
    </main>
  )
}
