import { getCurrentUserProfile } from '@/lib/profiles';
import ApiKeysEditor from '@/components/settings/ApiKeysEditor';

export const metadata = {
  title: 'API Keys | Dashboard | SideQuest.me',
  description: 'Manage your API keys and integrations',
};

export default async function ApiKeysPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) return null;

  return (
    <main className="p-8" style={{ backgroundColor: 'var(--bg, #fffbe6)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="font-head font-[900] text-[1.6rem] uppercase tracking-tight mb-1" style={{ color: 'var(--ink)' }}>
            API Keys
          </h1>
          <p className="font-mono text-[0.78rem] opacity-60">
            Manage API integrations and access tokens
          </p>
        </div>
        <ApiKeysEditor userId={profile.id} />
      </div>
    </main>
  );
}
