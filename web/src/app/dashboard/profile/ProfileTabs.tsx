"use client";

/**
 * Profile & Identity tabbed form — client component for managing avatar, bio, factoids, likes/dislikes.
 * [SQ.S-W-2603-0007]
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/profiles";
import type { Factoid, LikeDislike } from "@/types/profile-extras";
import AvatarUpload from "@/components/AvatarUpload";
import FactoidEditor from "@/components/settings/FactoidEditor";
import LikesDislikesEditor from "@/components/settings/LikesDislikesEditor";

interface ProfileTabsProps {
  profile: Profile;
  initialTab: "avatar" | "factoids" | "likes";
}

export default function ProfileTabs({ profile, initialTab }: ProfileTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"avatar" | "factoids" | "likes">(initialTab);

  // ── State ──
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [aboutBio, setAboutBio] = useState(profile.about_bio ?? "");
  const [factoids, setFactoids] = useState<Factoid[]>(
    (profile.factoids as Factoid[] | null) ?? []
  );
  const [likes, setLikes] = useState<LikeDislike[]>(
    (profile.likes as LikeDislike[] | null) ?? []
  );
  const [dislikes, setDislikes] = useState<LikeDislike[]>(
    (profile.dislikes as LikeDislike[] | null) ?? []
  );

  // ── Save state ──
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
      const updates: Record<string, any> = {};

      // Only update the relevant fields based on active tab
      if (activeTab === "avatar") {
        updates.display_name = displayName.trim() || null;
        updates.bio = bio.trim() || null;
        updates.avatar_url = avatarUrl.trim() || null;
      } else if (activeTab === "factoids") {
        updates.about_bio = aboutBio.trim() || null;
        updates.factoids = factoids.length > 0 ? factoids : [];
      } else if (activeTab === "likes") {
        updates.likes = likes.length > 0 ? likes : [];
        updates.dislikes = dislikes.length > 0 ? dislikes : [];
      }

      updates.updated_at = new Date().toISOString();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from("profiles")
        .update(updates)
        .eq("id", profile.id);

      if (updateError) {
        setError(updateError.message);
      } else {
        setSaved(true);
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 border-3 border-ink bg-bg-card font-mono text-[0.88rem] focus:outline-none focus:shadow-[3px_3px_0_var(--ink)] transition-shadow";
  const labelClass = "block font-head font-bold text-[0.72rem] uppercase mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-0">
      {/* Sub-tabs navigation */}
      <div className="flex gap-0 border-b-3 border-ink mb-8">
        <Link
          href="?tab=avatar"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab("avatar");
          }}
          className={`py-3 px-5 font-mono text-[0.7rem] font-bold uppercase tracking-[0.03em] cursor-pointer transition-all border-b-2 ${
            activeTab === "avatar"
              ? "text-ink border-orange"
              : "text-ink-muted border-transparent hover:text-ink"
          }`}
        >
          Avatar & Name
        </Link>
        <Link
          href="?tab=factoids"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab("factoids");
          }}
          className={`py-3 px-5 font-mono text-[0.7rem] font-bold uppercase tracking-[0.03em] cursor-pointer transition-all border-b-2 ${
            activeTab === "factoids"
              ? "text-ink border-orange"
              : "text-ink-muted border-transparent hover:text-ink"
          }`}
        >
          Bio & Factoids
        </Link>
        <Link
          href="?tab=likes"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab("likes");
          }}
          className={`py-3 px-5 font-mono text-[0.7rem] font-bold uppercase tracking-[0.03em] cursor-pointer transition-all border-b-2 ${
            activeTab === "likes"
              ? "text-ink border-orange"
              : "text-ink-muted border-transparent hover:text-ink"
          }`}
        >
          Loves & Hates
        </Link>
      </div>

      {/* Content area */}
      <div className="space-y-8 mb-8">
        {/* Avatar & Name tab */}
        {activeTab === "avatar" && (
          <div className="space-y-8">
            <div className="flex flex-col items-center py-2">
              <AvatarUpload
                userId={profile.id}
                displayName={displayName || profile.username}
                currentAvatarUrl={avatarUrl || null}
                onUploaded={(url) => setAvatarUrl(url)}
              />
            </div>
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
                Short Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short bio for your profile card…"
                rows={3}
                maxLength={500}
                className={`${inputClass} resize-y`}
              />
              <p className="font-mono text-[0.68rem] opacity-50 mt-1.5">
                {bio.length}/500 characters
              </p>
            </div>
          </div>
        )}

        {/* Bio & Factoids tab */}
        {activeTab === "factoids" && (
          <div className="space-y-8">
            <div>
              <label htmlFor="aboutBio" className={labelClass}>
                About Bio
              </label>
              <textarea
                id="aboutBio"
                value={aboutBio}
                onChange={(e) => setAboutBio(e.target.value)}
                placeholder="Write about yourself… Use [link text](url) for hyperlinks."
                rows={8}
                className={`${inputClass} resize-y`}
              />
              <p className="font-mono text-[0.68rem] opacity-50 mt-1.5">
                Shown on the About page. Supports basic markdown links: [text](url)
              </p>
            </div>
            <div>
              <div className={labelClass}>Factoid Cards</div>
              <p className="font-mono text-[0.68rem] opacity-50 mb-4">
                Quick-glance cards shown alongside your bio. Pick a category, set a value.
              </p>
              <FactoidEditor factoids={factoids} onChange={setFactoids} />
            </div>
          </div>
        )}

        {/* Loves & Hates tab */}
        {activeTab === "likes" && (
          <div className="space-y-8">
            <p className="font-mono text-[0.78rem] opacity-60 leading-relaxed">
              These show on your About page under the "Loves & Hates" tab.
            </p>
            <div>
              <div className={labelClass}>Loves 💚</div>
              <LikesDislikesEditor items={likes} onChange={setLikes} />
            </div>
            <div>
              <div className={labelClass}>Hates 😤</div>
              <LikesDislikesEditor items={dislikes} onChange={setDislikes} />
            </div>
          </div>
        )}
      </div>

      {/* Error and success messages */}
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

      {/* Save button */}
      <div className="pt-8 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-orange text-white font-head font-bold text-[0.78rem] uppercase border-3 border-orange hover:bg-transparent hover:text-orange transition-colors disabled:opacity-50 cursor-pointer shadow-[5px_5px_0_var(--ink)]"
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
