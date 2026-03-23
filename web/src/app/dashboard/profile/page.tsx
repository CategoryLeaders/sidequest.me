/**
 * Dashboard profile & identity page — server component that fetches profile
 * and renders sub-tabbed client form.
 * [SQ.S-W-2603-0007]
 */

import { getCurrentUserProfile } from '@/lib/profiles';
import ProfileTabs from './ProfileTabs';

export const metadata = {
  title: 'Profile & Identity | Dashboard | SideQuest.me',
  description: 'Manage your profile, bio, avatar, and preferences',
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-lg text-gray-600">Not authenticated</p>
      </div>
    );
  }

  const params = await searchParams;
  const tab = (params.tab as 'avatar' | 'factoids' | 'likes') || 'avatar';

  return (
    <main className="min-h-screen p-8" style={{ backgroundColor: 'var(--cream, #faf8f3)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1
            className="font-head text-4xl font-900 uppercase tracking-tight mb-2"
            style={{ color: 'var(--ink, #1a1a1a)' }}
          >
            Profile & Identity
          </h1>
          <p className="font-mono text-[0.78rem] opacity-60">Manage your avatar, bio, and personal details</p>
        </div>

        <ProfileTabs profile={profile} initialTab={tab} />
      </div>
    </main>
  );
}
