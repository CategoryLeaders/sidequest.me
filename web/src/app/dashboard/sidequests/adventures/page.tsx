

/**
 * Dashboard Adventures page — server component that fetches user profile
 * and renders AdventuresManager component.
 * [SQ.S-W-2603-0007]
 */

import { getCurrentUserProfile } from '@/lib/profiles';
import AdventuresManager from '@/components/settings/AdventuresManager';

export const metadata = {
  title: 'Adventures | Dashboard | SideQuest.me',
  description: 'Manage your adventures',
};

export default async function AdventuresPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-lg text-ink/60">Not authenticated</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8" style={{ backgroundColor: 'var(--cream, #faf8f3)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1
            className="font-head font-[900] text-[1.4rem] uppercase tracking-tight mb-2"
            style={{ color: 'var(--ink, #1a1a1a)' }}
          >
            Adventures
          </h1>
          <p className="font-mono text-[0.78rem] opacity-60">Track and manage your adventures</p>
        </div>

        <div
          className="border-3 border-ink bg-bg-card p-6"
          style={{ borderColor: 'var(--ink, #1a1a1a)', backgroundColor: 'var(--bg-card, #ffffff)' }}
        >
          <AdventuresManager username={profile.username} />
        </div>
      </div>
    </main>
  );
}
