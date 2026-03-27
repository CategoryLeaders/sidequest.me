'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTheme, type Theme, type Mode } from '@/components/ThemeProvider';
import type { Profile } from '@/lib/profiles';

const THEMES = [
  { key: 'default', label: 'Default', accent: '#ff6b35' },
  { key: 'indica', label: 'Indica', accent: '#c8805a' },
  { key: 'sativa', label: 'Sativa', accent: '#9b59b6' },
] as const;

const MODES = [
  { key: 'light', label: 'Light', emoji: '☀️' },
  { key: 'dark', label: 'Dark', emoji: '🌙' },
] as const;

const ROTATION_STYLES = [
  { key: 'subtle', label: 'Subtle', desc: 'Gentle tilt (±0.5°)', multiplier: 1 },
  { key: 'jaunty', label: 'Jaunty', desc: 'Playful rotation (±1.5°)', multiplier: 3 },
] as const;

const SAMPLE_ROTATIONS = [-0.5, 0.4, -0.3, 0.6];

interface ThemeVisualsFormProps {
  profile: Profile;
}

export default function ThemeVisualsForm({ profile }: ThemeVisualsFormProps) {
  const router = useRouter();
  const { setTheme: applyTheme, setMode: applyMode } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = profile as any;

  const [theme, setTheme] = useState<string>(p.preferred_theme ?? 'default');
  const [mode, setMode] = useState<string>(p.preferred_mode ?? 'light');
  const [rotationEnabled, setRotationEnabled] = useState<boolean>(p.rotation_enabled !== false);
  const [rotationStyle, setRotationStyle] = useState<string>(p.rotation_style ?? 'subtle');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const multiplier = ROTATION_STYLES.find((r) => r.key === rotationStyle)?.multiplier ?? 1;
  const sampleRotation = (i: number) =>
    rotationEnabled ? `${SAMPLE_ROTATIONS[i % 4] * multiplier}deg` : '0deg';

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
          preferred_theme: theme,
          preferred_mode: mode,
          rotation_enabled: rotationEnabled,
          rotation_style: rotationStyle,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);
      if (err) setError(err.message);
      else {
        setSaved(true);
        // Apply theme and mode live via ThemeProvider (updates localStorage + DOM)
        applyTheme(theme as Theme);
        applyMode(mode as Mode);
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const inputBtn = (active: boolean) => `
    px-5 py-2.5 border-3 border-ink font-mono text-[0.72rem] font-bold uppercase
    tracking-[0.02em] cursor-pointer transition-all
    ${active ? 'bg-orange text-white shadow-[3px_3px_0_var(--ink)]' : 'bg-bg-card hover:shadow-[3px_3px_0_var(--ink)]'}
  `;

  return (
    <div className="space-y-10">
      {/* ─── Colour Theme ─── */}
      <div>
        <label className="block font-head font-bold text-[0.78rem] uppercase mb-3" style={{ color: 'var(--ink)' }}>
          Colour Theme
        </label>
        <div className="flex gap-3 flex-wrap">
          {THEMES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTheme(t.key)}
              className={inputBtn(theme === t.key)}
            >
              <span
                className="inline-block w-3 h-3 border-2 border-ink mr-2 align-middle"
                style={{ background: t.accent }}
              />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Mode ─── */}
      <div>
        <label className="block font-head font-bold text-[0.78rem] uppercase mb-3" style={{ color: 'var(--ink)' }}>
          Mode
        </label>
        <div className="flex gap-3">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              className={inputBtn(mode === m.key)}
            >
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Random Rotation ─── */}
      <div
        className="bg-bg-card border-3 border-ink p-6"
        style={{ boxShadow: '5px 5px 0 var(--ink)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-head font-bold text-[0.85rem] uppercase" style={{ color: 'var(--ink)' }}>
              Random Rotation
            </div>
            <p className="font-mono text-[0.68rem] opacity-50 mt-1">
              Applies a slight rotation effect to cards, stickers, and photos across your profile.
            </p>
          </div>
          {/* Toggle */}
          <button
            type="button"
            onClick={() => setRotationEnabled(!rotationEnabled)}
            className="flex-shrink-0 cursor-pointer"
            style={{
              width: 48,
              height: 26,
              borderRadius: 13,
              border: '2px solid var(--ink)',
              background: rotationEnabled ? 'var(--orange)' : '#ddd',
              position: 'relative',
              transition: 'background 0.2s',
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#fff',
                border: '2px solid var(--ink)',
                position: 'absolute',
                top: 2,
                left: rotationEnabled ? 24 : 2,
                transition: 'left 0.2s',
              }}
            />
          </button>
        </div>

        {/* Intensity selector */}
        {rotationEnabled && (
          <div className="mb-5">
            <div className="font-mono text-[0.62rem] uppercase opacity-40 tracking-[0.04em] mb-2">
              Rotation intensity
            </div>
            <div className="flex gap-2">
              {ROTATION_STYLES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRotationStyle(r.key)}
                  className={`px-4 py-2 font-mono text-[0.68rem] font-bold uppercase cursor-pointer transition-all ${
                    rotationStyle === r.key
                      ? 'border-3 border-ink bg-orange text-white shadow-[3px_3px_0_var(--ink)]'
                      : 'border-2 border-ink/30 bg-transparent hover:border-ink/60'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live preview */}
        <div className="pt-4" style={{ borderTop: '1px solid rgba(26,26,26,0.12)' }}>
          <div className="font-mono text-[0.62rem] uppercase opacity-40 tracking-[0.04em] mb-3">
            Preview
          </div>
          <div className="flex gap-3 flex-wrap">
            {['Card A', 'Card B', 'Card C', 'Card D'].map((label, i) => (
              <div
                key={label}
                className="w-[90px] h-16 border-3 border-ink flex items-center justify-center font-mono text-[0.6rem] font-bold uppercase"
                style={{
                  background: [
                    'rgba(255,107,53,0.15)',
                    'rgba(0,212,170,0.15)',
                    'rgba(255,105,180,0.15)',
                    'rgba(77,159,255,0.15)',
                  ][i],
                  transform: `rotate(${sampleRotation(i)})`,
                  boxShadow: '3px 3px 0 var(--ink)',
                  transition: 'transform 0.3s ease',
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Save ─── */}
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
        {error && <span className="font-mono text-[0.72rem] text-red-600">{error}</span>}
      </div>
    </div>
  );
}
