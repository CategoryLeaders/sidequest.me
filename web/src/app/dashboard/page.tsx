import { getCurrentUserProfile } from '@/lib/profiles';
import { createClient } from '@/lib/supabase/server';

/** Simple relative time formatter — avoids date-fns dependency */
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

interface StatCardProps {
  label: string;
  count: number;
  accentColor: string;
}

interface ActivityEvent {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  created_at: string;
}

async function getStatsCounts(userId: string) {
  const supabase = await createClient();

  const stats = {
    writings: 0,
    microblogs: 0,
    adventures: 0,
    crowdfundingProjects: 0,
  };

  try {
    const [writingsRes, microblogsRes, adventuresRes, projectsRes] =
      await Promise.all([
        supabase
          .from('writings')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'published'),
        supabase
          .from('microblog_posts')
          .select('id', { count: 'exact', head: true })
          .eq('profile_id', userId),
        supabase
          .from('adventures')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('crowdfunding_projects')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
      ]);

    if (writingsRes.count !== null) stats.writings = writingsRes.count;
    if (microblogsRes.count !== null) stats.microblogs = microblogsRes.count;
    if (adventuresRes.count !== null) stats.adventures = adventuresRes.count;
    if (projectsRes.count !== null)
      stats.crowdfundingProjects = projectsRes.count;
  } catch (error) {
    console.error('Error fetching stats:', error);
  }

  return stats;
}

async function getRecentActivity(userId: string) {
  const supabase = await createClient();
  const events: ActivityEvent[] = [];

  try {
    const { data, error } = await supabase
      .from('feed_events')
      .select('id, title, description, event_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching feed events:', error);
      return events;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return events;
  }
}

function getEventDotColor(eventType: string): string {
  const colorMap: Record<string, string> = {
    writing_published: '#ff69b4',
    microblog_posted: '#4d9fff',
    adventure_created: '#00d4aa',
    project_backed: '#ff6b35',
    default: '#999999',
  };

  return colorMap[eventType] || colorMap.default;
}

function StatCard({ label, count, accentColor }: StatCardProps) {
  const randomRotation = Math.random() * 2 - 1;

  return (
    <div
      className="bg-white border-black p-6"
      style={{
        borderWidth: '3px',
        boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.1)',
        transform: `rotate(${randomRotation}deg)`,
      }}
    >
      <p className="font-space-mono text-xs tracking-widest text-gray-500 mb-4 uppercase">
        {label}
      </p>
      <p
        className="font-archivo text-5xl font-900 leading-tight"
        style={{ color: accentColor }}
      >
        {count}
      </p>
    </div>
  );
}

export default async function DashboardPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-lg text-gray-600">Not authenticated</p>
      </div>
    );
  }

  const stats = await getStatsCounts(profile.id);
  const recentEvents = await getRecentActivity(profile.id);

  const displayName =
    profile.display_name || 'User';

  return (
    <main
      className="min-h-screen p-8"
      style={{ backgroundColor: 'var(--cream, #faf8f3)' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="font-archivo text-4xl md:text-5xl font-900 tracking-tight mb-2 uppercase">
            Welcome back, {displayName.toUpperCase()}
          </h1>
          <p className="font-dm-sans text-gray-600 text-base">
            Here's what's happening across your SideQuest life.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <StatCard
            label="Writings"
            count={stats.writings}
            accentColor="#ff69b4"
          />
          <StatCard
            label="Microblogs"
            count={stats.microblogs}
            accentColor="#4d9fff"
          />
          <StatCard
            label="Adventures"
            count={stats.adventures}
            accentColor="#00d4aa"
          />
          <StatCard
            label="Backed Projects"
            count={stats.crowdfundingProjects}
            accentColor="#ff6b35"
          />
        </div>

        {/* Recent Activity Card */}
        <div
          className="bg-white border-black p-8"
          style={{
            borderWidth: '3px',
            boxShadow: '5px 5px 0px rgba(0, 0, 0, 0.1)',
          }}
        >
          <h2 className="font-archivo text-2xl font-900 tracking-widest mb-6 uppercase">
            Recent Activity
          </h2>

          {recentEvents.length === 0 ? (
            <p className="text-gray-500 font-dm-sans">
              No recent activity yet.
            </p>
          ) : (
            <ul className="space-y-4">
              {recentEvents.map((event) => {
                const ago = timeAgo(event.created_at);
                const dotColor = getEventDotColor(event.event_type);

                return (
                  <li key={event.id} className="flex items-start gap-4">
                    <div
                      className="w-3 h-3 rounded-full mt-2 flex-shrink-0"
                      style={{ backgroundColor: dotColor }}
                    />
                    <div className="flex-1">
                      <p className="font-dm-sans font-semibold text-gray-900">
                        {event.title}
                      </p>
                      {event.description && (
                        <p className="font-dm-sans text-sm text-gray-600 mt-1">
                          {event.description}
                        </p>
                      )}
                      <p className="font-dm-sans text-xs text-gray-400 mt-2">
                        {ago}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}