"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/profiles";
import type { TablesUpdate } from "@/types/database";

interface SettingsFormProps {
  profile: Profile;
}

export default function SettingsForm({ profile }: SettingsFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);

    try {
      const supabase = createClient();
      // Explicit type needed — postgrest-js 2.99 + TS 5.9 infers table operations as never
      const updates: TablesUpdate<"profiles"> = {
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        updated_at: new Date().toISOString(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const { error: updateError } = await db
        .from("profiles")
        .update(updates)
        .eq("id", profile.id);

      if (updateError) {
        setError(updateError.message);
      } else {
        setSaved(true);
        router.refresh(); // re-fetch server data
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 border-3 border-ink bg-white font-mono text-[0.88rem] focus:outline-none focus:shadow-[3px_3px_0_var(--ink)] transition-shadow";
  const labelClass = "block font-head font-bold text-[0.78rem] uppercase mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="displayName" className={labelClass}>
          Display Name
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name or tagline"
          maxLength={120}
          className={inputClass}
        />
        <p className="font-mono text-[0.68rem] opacity-50 mt-1.5">
          Shown as your profile heading. Leave blank to use the default.
        </p>
      </div>

      <div>
        <label htmlFor="bio" className={labelClass}>
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A short bio about you..."
          rows={4}
          maxLength={500}
          className={`${inputClass} resize-y`}
        />
        <p className="font-mono text-[0.68rem] opacity-50 mt-1.5">
          {bio.length}/500 characters
        </p>
      </div>

      <div>
        <label htmlFor="avatarUrl" className={labelClass}>
          Avatar URL
        </label>
        <input
          id="avatarUrl"
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://images.sidequest.me/avatar.jpg"
          className={inputClass}
        />
        <p className="font-mono text-[0.68rem] opacity-50 mt-1.5">
          Direct image URL. Upload support coming soon.
        </p>
        {avatarUrl && (
          <div className="mt-3 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl}
              alt="Avatar preview"
              className="w-12 h-12 rounded-full border-3 border-ink object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span className="font-mono text-[0.68rem] opacity-50">Preview</span>
          </div>
        )}
      </div>

      {error && (
        <div className="border-3 border-red-500 bg-red-50 p-3 font-mono text-[0.78rem] text-red-600">
          {error}
        </div>
      )}

      {saved && (
        <div className="border-3 border-green bg-green/10 p-3 font-mono text-[0.78rem] text-ink">
          ✓ Profile updated successfully
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-ink text-bg font-head font-bold text-[0.78rem] uppercase border-3 border-ink hover:bg-transparent hover:text-ink transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
        <a
          href={`/${profile.username}`}
          className="px-6 py-2.5 bg-transparent text-ink font-head font-bold text-[0.78rem] uppercase border-3 border-ink hover:bg-ink hover:text-bg transition-colors no-underline inline-block"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
