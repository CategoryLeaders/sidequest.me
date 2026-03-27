import { getCurrentUserProfile } from '@/lib/profiles';
import MicroblogsManager from '@/components/settings/MicroblogsManager';

export const metadata = {
  title: 'Microblogs | Content | Dashboard | SideQuest.me',
  description: 'Manage your short-form thoughts and updates',
};

export default async function MicroblogsPage() {
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
            className="font-head font-[900] text-[2rem] uppercase leading-tight mb-1"
            style={{ color: 'var(--ink, #1a1a1a)' }}
          >
            Microblogs
          </h1>
          <p className="font-mono text-[0.78rem] opacity-60">
            Short-form thoughts and updates.
          </p>
        </div>

        <div
          className="bg-[var(--bg-card)] p-8 border-3 border-ink"
          style={{
            boxShadow: '3px 3px 0 var(--ink)',
          }}
        >
          <MicroblogsManager username={profile.username} />
        </div>
      </div>
    </main>
  );
}
