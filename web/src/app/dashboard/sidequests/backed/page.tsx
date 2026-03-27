

/**
 * Dashboard Backed Projects page — server component that fetches user profile
 * and renders DashboardBackedForm client component.
 * [SQ.S-W-2603-0007]
 */

import { getCurrentUserProfile } from '@/lib/profiles';
import DashboardBackedForm from './DashboardBackedForm';

export const metadata = {
  title: 'Backed Projects | Dashboard | SideQuest.me',
  description: 'Manage your backed projects and display settings',
};

export default async function BackedPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-lg text-ink/60">Not authenticated</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8" style={{ backgroundColor: 'var(--bg, #fffbe6)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1
            className="font-head font-[900] text-[1.4rem] uppercase tracking-tight mb-2"
            style={{ color: 'var(--ink, #1a1a1a)' }}
          >
            Backed Projects
          </h1>
          <p className="font-mono text-[0.78rem] opacity-60">
            Manage your backed projects and visibility settings
          </p>
        </div>

        <DashboardBackedForm
          profile={profile}
          userId={profile.id}
          username={profile.username}
        />
      </div>
    </main>
  );
}
