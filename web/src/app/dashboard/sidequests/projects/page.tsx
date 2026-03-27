

/**
 * Dashboard My Projects page — server component that fetches user profile
 * and renders ProjectsManager component.
 * [SQ.S-W-2603-0007]
 */

import { getCurrentUserProfile } from '@/lib/profiles';
import ProjectsManager from '@/components/settings/ProjectsManager';

export const metadata = {
  title: 'My Projects | Dashboard | SideQuest.me',
  description: 'Manage your projects',
};

export default async function ProjectsPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-lg text-gray-600">Not authenticated</p>
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
            My Projects
          </h1>
          <p className="font-mono text-[0.78rem] opacity-60">Manage your projects and their visibility</p>
        </div>

        <div
          className="border-3 border-ink bg-bg-card p-6"
          style={{ borderColor: 'var(--ink, #1a1a1a)', backgroundColor: 'var(--bg-card, #ffffff)' }}
        >
          <ProjectsManager userId={profile.id} username={profile.username} />
        </div>
      </div>
    </main>
  );
}
