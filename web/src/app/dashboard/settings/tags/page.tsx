import { getCurrentUserProfile } from '@/lib/profiles';
import { createClient } from '@/lib/supabase/server';
import DashboardTagsForm from './DashboardTagsForm';

export const metadata = {
  title: 'Tags | Dashboard | SideQuest.me',
  description: 'Manage site tags displayed on your profile',
};

export default async function TagsPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) return null;

  // Fetch writing tags for suggestion feature
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: writings } = await (supabase as any)
    .from('writings')
    .select('tags')
    .eq('user_id', profile.id) as { data: { tags: string[] }[] | null };

  const writingTags = Array.from(
    new Set((writings ?? []).flatMap((w) => w.tags ?? []))
  ).sort();

  return (
    <main className="p-8" style={{ backgroundColor: 'var(--bg, #fffbe6)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="font-head font-[900] text-[1.6rem] uppercase tracking-tight mb-1" style={{ color: 'var(--ink)' }}>
            Tags
          </h1>
          <p className="font-mono text-[0.78rem] opacity-60">
            Manage the tags displayed on your profile
          </p>
        </div>
        <DashboardTagsForm profile={profile} writingTags={writingTags} />
      </div>
    </main>
  );
}
