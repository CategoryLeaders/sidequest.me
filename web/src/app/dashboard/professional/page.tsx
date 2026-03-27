/**
 * Dashboard professional page — server component that fetches profile
 * and renders professional form client component.
 * [SQ.S-W-2603-0007]
 */

import { getCurrentUserProfile } from '@/lib/profiles';
import DashboardProfessionalForm from './DashboardProfessionalForm';

export const metadata = {
  title: 'Professional | Dashboard | SideQuest.me',
  description: 'Manage your professional name and LinkedIn profile',
};

export default async function ProfessionalPage() {
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
            className="font-head text-4xl font-900 uppercase tracking-tight mb-2"
            style={{ color: 'var(--ink, #1a1a1a)' }}
          >
            Professional
          </h1>
          <p className="font-mono text-[0.78rem] opacity-60">Manage your professional details</p>
        </div>

        <DashboardProfessionalForm profile={profile} />
      </div>
    </main>
  );
}
