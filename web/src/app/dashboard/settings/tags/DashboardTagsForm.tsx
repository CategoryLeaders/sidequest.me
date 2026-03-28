'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import SiteTagsEditor from '@/components/settings/SiteTagsEditor';
import type { Profile } from '@/lib/profiles';
import type { SiteTag, SiteTagsDisplay } from '@/lib/tags';
import { DEFAULT_SITE_TAGS_DISPLAY } from '@/lib/tags';

interface DashboardTagsFormProps {
  profile: Profile;
  writingTags: string[];
}

export default function DashboardTagsForm({ profile, writingTags }: DashboardTagsFormProps) {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = profile as any;

  const [tags, setTags] = useState<SiteTag[]>(p.site_tags ?? []);
  const [display, setDisplay] = useState<SiteTagsDisplay>(p.site_tags_display ?? DEFAULT_SITE_TAGS_DISPLAY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: err } = await (supabase as any)
        .from('profiles')
        .update({
          site_tags: tags.length > 0 ? tags : null,
          site_tags_display: display,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);
      if (err) setError(err.message);
      else { setSaved(true); router.refresh(); }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <SiteTagsEditor
        tags={tags}
        display={display}
        onChange={setTags}
        onDisplayChange={setDisplay}
        writingTags={writingTags}
      />

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-orange text-white font-head font-[900] text-[0.78rem] uppercase tracking-[0.02em] border-3 border-ink cursor-pointer disabled:opacity-50"
          style={{
            boxShadow: '5px 5px 0 var(--ink)',
            transform: 'rotate(0.3deg)',
          }}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {saved && <span className="font-mono text-[0.72rem] text-green">Saved ✓</span>}
        {error && <span className="font-mono text-[0.72rem] text-pink">{error}</span>}
      </div>
    </div>
  );
}
