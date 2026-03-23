import { getCurrentUserProfile } from '@/lib/profiles';
import ThemeVisualsForm from './ThemeVisualsForm';

export const metadata = {
  title: 'Theme & Visuals | Dashboard | SideQuest.me',
  description: 'Customise your profile theme, mode, and visual effects',
};

export default async function ThemeVisualsPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) return null;

  return (
    <main className="p-8" style={{ backgroundColor: 'var(--bg, #fffbe6)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="font-head font-[900] text-[1.6rem] uppercase tracking-tight mb-1" style={{ color: 'var(--ink)' }}>
            Theme & Visuals
          </h1>
          <p className="font-mono text-[0.78rem] opacity-60">
            Customise how your profile looks and feels
          </p>
        </div>
        <ThemeVisualsForm profile={profile} />
      </div>
    </main>
  );
}
