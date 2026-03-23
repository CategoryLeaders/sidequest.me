import { getCurrentUserProfile } from '@/lib/profiles';
import TickerForm from './TickerForm';

export const metadata = {
  title: 'Ticker | Content | Dashboard | SideQuest.me',
  description: 'Manage your profile ticker carousel',
};

export default async function TickerPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-lg text-gray-600">Not authenticated</p>
      </div>
    );
  }

  // Extract ticker data from profile
  const tickerEnabled = profile.ticker_enabled ?? false;
  const tickerItems = profile.ticker_items ?? [];

  return (
    <main className="min-h-screen p-8" style={{ backgroundColor: 'var(--cream, #faf8f3)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1
            className="font-head font-[900] text-[2rem] uppercase leading-tight mb-1"
            style={{ color: 'var(--ink, #1a1a1a)' }}
          >
            Ticker
          </h1>
          <p className="font-mono text-[0.78rem] opacity-60">
            Manage your profile ticker carousel.
          </p>
        </div>

        <div
          className="bg-white p-8 border-3 border-ink"
          style={{
            boxShadow: '3px 3px 0 var(--ink)',
          }}
        >
          <TickerForm initialEnabled={tickerEnabled} initialItems={tickerItems} />
        </div>
      </div>
    </main>
  );
}
