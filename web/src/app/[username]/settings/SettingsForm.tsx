"use client";

/**
 * Profile settings form — tabbed: Profile (sub: Info · Likes & Dislikes · Ticker) · About · Professional
 * [SQ.S-W-2603-0034] [SQ.S-W-2603-0038] [SQ.S-W-2603-0039] [SQ.S-W-2603-0040] [SQ.S-W-2603-0041] [SQ.S-W-2603-0046]
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/profiles";
import AvatarUpload from "@/components/AvatarUpload";
import FactoidEditor from "@/components/settings/FactoidEditor";
import LikesDislikesEditor from "@/components/settings/LikesDislikesEditor";
import TickerEditor from "@/components/settings/TickerEditor";
import SiteTagsEditor from "@/components/settings/SiteTagsEditor";
import type { Factoid, LikeDislike } from "@/types/profile-extras";
import type { SiteTag } from "@/lib/tags";

const SETTINGS_TABS = ["Profile", "About", "Professional", "Site Tags"] as const;
type SettingsTab = (typeof SETTINGS_TABS)[number];

const PROFILE_SUBTABS = ["Info", "Likes & Dislikes", "Ticker"] as const;
type ProfileSubTab = (typeof PROFILE_SUBTABS)[number];

interface SettingsFormProps {
  profile: Profile;
}

export default function SettingsForm({ profile }: SettingsFormProps) {
  const router = useRouter();
  const [tab, setTab] = useState<SettingsTab>("Profile");
  const [profileSubTab, setProfileSubTab] = useState<ProfileSubTab>("Info");

  // ── Profile tab state ──
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");

  // ── Professional tab state ──
  const [professionalName, setProfessionalName] = useState(profile.professional_name ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url ?? "");

  // ── About tab state ──
  const [aboutBio, setAboutBio] = useState(profile.about_bio ?? "");
  const [factoids, setFactoids] = useState<Factoid[]>(
    (profile.factoids as Factoid[] | null) ?? []
  );

  // ── Likes & Dislikes sub-tab state ──
  const [likes, setLikes] = useState<LikeDislike[]>(
    (profile.likes as LikeDislike[] | null) ?? []
  );
  const [dislikes, setDislikes] = useState<LikeDislike[]>(
    (profile.dislikes as LikeDislike[] | null) ?? []
  );

  // ── Ticker sub-tab state ──
  const [tickerEnabled, setTickerEnabled] = useState<boolean>(
    profile.ticker_enabled !== false
  );
  const [tickerItems, setTickerItems] = useState<string[]>(
    (profile.ticker_items as string[] | null) ?? []
  );

  // ── Site Tags tab state ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [siteTags, setSiteTags] = useState<SiteTag[]>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((profile as any).site_tags as SiteTag[] | null) ?? []
  );

  // ── Shared save state ──
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);

    // Validate LinkedIn URL if provided
    const linkedinTrimmed = linkedinUrl.trim();
    if (linkedinTrimmed && !linkedinTrimmed.match(/^https:\/\/(www\.)?linkedin\.com\//)) {
      setError("LinkedIn URL must start with https://linkedin.com/ or https://www.linkedin.com/");
      setSaving(false);
      return;
    }

    try {
      const supabase = createClient();
      const updates = {
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        professional_name: professionalName.trim() || null,
        linkedin_url: linkedinTrimmed || null,
        about_bio: aboutBio.trim() || null,
        factoids: factoids.length > 0 ? factoids : [],
        likes: likes.length > 0 ? likes : [],
        dislikes: dislikes.length > 0 ? dislikes : [],
        ticker_enabled: tickerEnabled,
        ticker_items: tickerItems.length > 0 ? tickerItems : null,
        site_tags: siteTags.length > 0 ? siteTags : null,
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
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 border-3 border-ink bg-white font-mono text-[0.88rem] focus:outline-none focus:shadow-[3px_3px_0_var(--ink)] transition-shadow";
  const labelClass =
    "block font-head font-bold text-[0.78rem] uppercase mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Main tab bar: Profile · About · Professional ── */}
      <div className="flex gap-1 border-3 border-ink overflow-x-auto">
        {SETTINGS_TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 min-w-0 py-2.5 px-3 font-head font-bold text-[0.72rem] uppercase cursor-pointer transition-colors whitespace-nowrap ${
              tab === t ? "bg-ink text-bg" : "bg-white text-ink hover:bg-ink/5"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ══════ PROFILE TAB ══════ */}
      {tab === "Profile" && (
        <div className="space-y-6">
          {/* Profile sub-tab bar: Info · Likes & Dislikes · Ticker */}
          <div className="flex gap-1 border-2 border-ink/30 overflow-x-auto">
            {PROFILE_SUBTABS.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setProfileSubTab(st)}
                className={`flex-1 min-w-0 py-2 px-3 font-head font-bold text-[0.68rem] uppercase cursor-pointer transition-colors whitespace-nowrap ${
                  profileSubTab === st
                    ? "bg-ink/10 text-ink border-b-2 border-ink"
                    : "bg-white text-ink/50 hover:bg-ink/5 hover:text-ink"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* ── Info sub-tab ── */}
          {profileSubTab === "Info" && (
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

          {/* ── Likes & Dislikes sub-tab ── */}
          {profileSubTab === "Likes & Dislikes" && (
            <div className="space-y-8">
              <p className="font-mono text-[0.78rem] opacity-60 leading-relaxed">
                These show on your About page under the &ldquo;Loves &amp; Hates&rdquo; tab.
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

          {/* ── Ticker sub-tab ── */}
          {profileSubTab === "Ticker" && (
            <div className="space-y-8">
              {/* Enable/disable toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={tickerEnabled}
                  onChange={(e) => setTickerEnabled(e.target.checked)}
                  className="w-4 h-4 border-3 border-ink accent-ink cursor-pointer"
                />
                <span className="font-head font-bold text-[0.78rem] uppercase">
                  Show ticker on profile
                </span>
              </label>

              {tickerEnabled && (
                <>
                  <p className="font-mono text-[0.78rem] opacity-60 leading-relaxed">
                    Short items that scroll across the bottom of your profile page. Up to 10 items.
                    <br />
                    <strong className="opacity-80">Pin</strong> items to keep them when using reroll.
                  </p>

                  <div>
                    <div className={labelClass}>Ticker Items</div>
                    <TickerEditor
                      items={tickerItems}
                      onChange={setTickerItems}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════ ABOUT TAB ══════ */}
      {tab === "About" && (
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

      {/* ══════ PROFESSIONAL TAB ══════ */}
      {tab === "Professional" && (
        <div className="space-y-8">
          <p className="font-mono text-[0.78rem] opacity-60 leading-relaxed">
            These appear at the top of your Professional page.
          </p>

          <div>
            <label htmlFor="professionalName" className={labelClass}>
              Professional Name
            </label>
            <input
              id="professionalName"
              type="text"
              value={professionalName}
              onChange={(e) => setProfessionalName(e.target.value)}
              placeholder="e.g. Sophie Collins — Product Marketing Leader"
              maxLength={150}
              className={inputClass}
            />
            <p className="font-mono text-[0.68rem] opacity-50 mt-1.5">
              Headline shown on the Professional page. Leave blank to use your display name.
            </p>
          </div>

          <div>
            <label htmlFor="linkedinUrl" className={labelClass}>
              LinkedIn URL
            </label>
            <input
              id="linkedinUrl"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://www.linkedin.com/in/yourprofile"
              className={inputClass}
            />
            <p className="font-mono text-[0.68rem] opacity-50 mt-1.5">
              Full LinkedIn profile URL. Shown as a link on the Professional page.
            </p>
          </div>
        </div>
      )}

      {/* ══════ SITE TAGS TAB ══════ */}
      {tab === "Site Tags" && (
        <div className="space-y-8">
          <p className="font-mono text-[0.78rem] opacity-60 leading-relaxed">
            Sticker-style tags shown on your profile home page. Each tag links
            to a filtered view of all your content with that tag.
          </p>
          <div>
            <div className={labelClass}>Tags</div>
            <SiteTagsEditor tags={siteTags} onChange={setSiteTags} />
          </div>
        </div>
      )}

      {/* ── Status messages ── */}
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

      {/* ── Actions ── */}
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
