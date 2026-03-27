import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Adventure } from '@/lib/adventures'
import { STATUS_META, THEME_META } from '@/lib/adventures'

export default async function AdminAdventuresPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
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

  const { data: adventures } = await (supabase as any)
    .from('adventures')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false }) as { data: Adventure[] | null }

  const rows = adventures ?? []

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Adventures</h1>
          <p className="text-sm text-ink/50 mt-1">
            {rows.length} {rows.length === 1 ? 'adventure' : 'adventures'}
          </p>
        </div>
        <Link
          href={`/${username}/admin/adventures/new`}
          className="bg-black text-white text-sm px-4 py-2  hover:bg-ink/80 transition-colors"
        >
          + New adventure
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-20 text-ink/40">
          <p className="text-lg mb-2">No adventures yet.</p>
          <p className="text-sm">
            <Link href={`/${username}/admin/adventures/new`} className="underline">
              Create your first adventure →
            </Link>
          </p>
        </div>
      ) : (
        <div className="divide-y divide-ink/10">
          {rows.map((a) => {
            const sm = STATUS_META[a.status]
            const tm = THEME_META[a.layout_theme]
            return (
              <div key={a.id} className="py-4 flex items-start gap-4">
                {a.cover_image_url && (
                  <div className="w-20 h-14  overflow-hidden flex-shrink-0 bg-ink/[0.06]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.cover_image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5  ${
                      a.status === 'live' ? 'bg-orange-100 text-orange-700' :
                      a.status === 'upcoming' ? 'bg-yellow-100 text-yellow-700' :
                      a.status === 'complete' ? 'bg-green-100 text-green-700' :
                      'bg-ink/[0.06] text-ink/60'
                    }`}>
                      {sm.label}
                    </span>
                    <span className="text-xs text-ink/40">
                      {tm.icon} {tm.label}
                    </span>
                  </div>
                  <Link
                    href={`/${username}/admin/adventures/${a.slug}`}
                    className="font-medium text-ink/90 hover:text-black line-clamp-1"
                  >
                    {a.title}
                  </Link>
                  <p className="text-xs text-ink/40 mt-1">
                    {a.location_name && `📍 ${a.location_name} · `}
                    {a.start_date && new Date(a.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {a.end_date && ` — ${new Date(a.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                  </p>
                </div>
                <Link
                  href={`/${username}/admin/adventures/${a.slug}`}
                  className="text-xs text-ink/50 hover:text-black px-3 py-1.5 border border-ink/[var(--opacity-muted)]  hover:border-ink/40 transition-colors shrink-0"
                >
                  Edit
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
