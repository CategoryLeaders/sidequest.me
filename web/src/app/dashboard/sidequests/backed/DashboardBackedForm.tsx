'use client';

/**
 * Dashboard Backed Projects Form — client component for managing crowdfunding display settings
 * and rendering the CrowdfundingEditor.
 * [SQ.S-W-2603-0007]
 */

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import CrowdfundingEditor from '@/components/settings/CrowdfundingEditor';
import type { Tables } from '@/types/database';

type Profile = Tables<'profiles'>;

interface DashboardBackedFormProps {
  profile: Profile;
  userId: string;
  username: string;
}

export default function DashboardBackedForm({
  profile,
  userId,
  username,
}: DashboardBackedFormProps) {
  const [crowdfundingEnabled, setCrowdfundingEnabled] = useState(
    profile.crowdfunding_enabled ?? false
  );
  const [crowdfundingTitle, setCrowdfundingTitle] = useState(
    profile.crowdfunding_title ?? 'Backed Projects'
  );
  const [crowdfundingCarouselAuto, setCrowdfundingCarouselAuto] = useState(
    profile.crowdfunding_carousel_auto ?? false
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (supabase as any)
      .from('profiles')
      .update({
        crowdfunding_enabled: crowdfundingEnabled,
        crowdfunding_title: crowdfundingTitle || null,
        crowdfunding_carousel_auto: crowdfundingCarouselAuto,
      })
      .eq('id', userId);

    setSaving(false);

    if (updateErr) {
      setError(updateErr.message);
    } else {
      setSuccess('Settings saved!');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const inputClass =
    'w-full px-3 py-2 border-3 border-ink bg-bg-card font-mono text-[0.78rem] focus:outline-none focus:shadow-[3px_3px_0_var(--ink)] transition-shadow';
  const labelClass = 'block font-head font-bold text-[0.68rem] uppercase mb-1';

  return (
    <div className="space-y-6">
      {/* Settings — collapsed behind cog */}
      <div className="border-3 border-ink bg-bg-card" style={{ borderColor: 'var(--ink, #1a1a1a)', backgroundColor: 'var(--bg-card, #ffffff)' }}>
        <button
          type="button"
          onClick={() => setSettingsOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-ink/[0.03] transition-colors"
        >
          <span className="font-mono text-[0.65rem] uppercase opacity-50 flex items-center gap-2">
            ⚙️ Display Settings
          </span>
          <span className="font-mono text-[0.7rem] opacity-40">{settingsOpen ? '▲' : '▼'}</span>
        </button>

        {settingsOpen && (
          <div className="border-t-2 border-ink/10 px-6 py-5">
            {error && (
              <div className="border-3 border-ink bg-pink/10 p-3 font-mono text-[0.75rem] mb-4">
                {error}
                <button onClick={() => setError(null)} className="ml-3 underline cursor-pointer">dismiss</button>
              </div>
            )}
            {success && (
              <div className="border-3 border-ink bg-green/10 p-3 font-mono text-[0.75rem] mb-4">{success}</div>
            )}

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={crowdfundingEnabled}
                  onChange={(e) => setCrowdfundingEnabled(e.target.checked)}
                  className="w-4 h-4 border-3 border-ink accent-ink cursor-pointer"
                />
                <span className="font-head font-bold text-[0.68rem] uppercase">Display backed projects section</span>
              </label>

              <div>
                <label className={labelClass}>Section Title</label>
                <input
                  type="text"
                  value={crowdfundingTitle}
                  onChange={(e) => setCrowdfundingTitle(e.target.value)}
                  placeholder="Backed Projects"
                  maxLength={100}
                  disabled={!crowdfundingEnabled}
                  className={`${inputClass} ${!crowdfundingEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={crowdfundingCarouselAuto}
                  onChange={(e) => setCrowdfundingCarouselAuto(e.target.checked)}
                  disabled={!crowdfundingEnabled}
                  className="w-4 h-4 border-3 border-ink accent-ink cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className={`font-head font-bold text-[0.68rem] uppercase ${!crowdfundingEnabled ? 'opacity-50' : ''}`}>
                  Auto-rotate carousel on profile
                </span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 border-3 border-ink bg-orange text-white font-head font-bold text-[0.68rem] uppercase hover:bg-orange/80 disabled:opacity-50 transition-colors"
                  style={{ borderColor: 'var(--ink, #1a1a1a)' }}
                >
                  {saving ? 'Saving…' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CrowdfundingEditor */}
      <div
        className="border-3 border-ink bg-bg-card p-6"
        style={{ borderColor: 'var(--ink, #1a1a1a)', backgroundColor: 'var(--bg-card, #ffffff)' }}
      >
        <h2 className="font-head font-bold text-[0.82rem] uppercase mb-4">Backed Projects</h2>
        <CrowdfundingEditor userId={userId} username={username} />
      </div>
    </div>
  );
}
