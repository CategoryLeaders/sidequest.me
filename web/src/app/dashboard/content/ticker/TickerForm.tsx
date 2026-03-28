'use client';

import { useState } from 'react';
import TickerEditor from '@/components/settings/TickerEditor';

interface TickerFormProps {
  initialEnabled: boolean;
  initialItems: string[];
}

export default function TickerForm({
  initialEnabled,
  initialItems,
}: TickerFormProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [items, setItems] = useState(initialItems);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker_enabled: enabled,
          ticker_items: items,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to save ticker');
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Failed to save ticker');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = enabled !== initialEnabled || items !== initialItems;

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-5 h-5 border-2 border-ink accent-orange cursor-pointer"
          />
          <span className="font-head font-bold text-[0.72rem] uppercase">
            Show ticker on profile
          </span>
        </label>
      </div>

      {/* Ticker Editor */}
      {enabled && (
        <div className="border-t border-ink/15 pt-6">
          <p className="font-head font-bold text-[0.72rem] uppercase opacity-60 mb-4">
            Ticker items
          </p>
          <TickerEditor items={items} onChange={setItems} />
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center gap-3 pt-4">
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="px-6 py-2 border-3 border-orange bg-orange text-white font-head font-bold text-[0.72rem] uppercase hover:shadow-[3px_3px_0_var(--orange)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            borderColor: 'var(--orange, #ff6b35)',
            backgroundColor: 'var(--orange, #ff6b35)',
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>

        {success && (
          <p className="font-mono text-[0.72rem] text-green-600">
            Saved successfully
          </p>
        )}

        {error && (
          <p className="font-mono text-[0.72rem] text-pink">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
