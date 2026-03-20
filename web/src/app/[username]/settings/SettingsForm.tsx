"use client";

/**
 * Profile settings form — new hierarchy:
 * Profile & Identity (Avatar · Bio & Factoids · Likes & Dislikes)
 * Professional (single page)
 * Sidequests (Adventures · My Projects · Projects I Backed)
 * Content (Writings · Ticker)
 * Site Settings (Tags · API Keys · Theme)
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
import ApiKeysEditor from "@/components/settings/ApiKeysEditor";
import CrowdfundingEditor from "@/components/settings/CrowdfundingEditor";
import WritingsManager from "@/components/settings/WritingsManager";
import AdventuresManager from "@/components/settings/AdventuresManager";
import MicroblogsManager from "@/components/settings/MicroblogsManager";
import ProjectsManager from "@/components/settings/ProjectsManager";
import type { Factoid, LikeDislike } from "@/types/profile-extras";
import type { SiteTag, SiteTagsDisplay } from "@/lib/tags";
import { DEFAULT_SITE_TAGS_DISPLAY } from "@/lib/tags";

// ── Tab definitions ──────────────────────────────────────────────────────────

interface TabDef {
  key: string;
  label: string;
  dot: string; // CSS variable colour for the dot
  subtabs?: string[];
}

const TABS: TabDef[] = [
  { key: "identity", label: "Profile & Identity", dot: "var(--orange)", subtabs: ["Avatar & Name", "Bio & Factoids", "Likes & Dislikes"] },
  { key: "professional", label: "Professional", dot: "var(--blue)" },
  { key: "sidequests", label: "Sidequests", dot: "var(--green)", subtabs: ["Adventures", "My Projects", "Projects I Backed"] },
  { key: "content", label: "Content", dot: "var(--pink)", subtabs: ["Writings", "Ticker"] },
  { key: "site", label: "Site Settings", dot: "var(--lilac)", subtabs: ["Tags", "API Keys"] },
];

const ROTATIONS = ["-0.5deg", "0.4deg", "-0.3deg", "0.6deg", "-0.4deg"];

interface SettingsFormProps {
  profile: Profile;
  writingTags?: string[];
}

export default function SettingsForm({ profile, writingTags = [] }: SettingsFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("identity");
  const [activeSubTab, setActiveSubTab] = useState<Record<string, string>>({
    identity: "Avatar & Name",
    sidequests: "Adventures",
    content: "Writings",
    site: "Tags",
  });

  const currentTabDef = TABS.find((t) => t.key === activeTab)!;
  const currentSubTab = activeSubTab[activeTab] ?? currentTabDef.subtabs?.[0];

  const setSubTab = (sub: string) => {
    setActiveSubTab((prev) => ({ ...prev, [activeTab]: sub }));
  };

  // ── Profile & Identity state ──
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

  // ── Professional state ──
  const [professionalName, setProfessionalName] = useState(profile.professional_name ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url ?? "");

  // ── Content state ──
  const [tickerEnabled, setTickerEnabled] = useState<boolean>(profile.ticker_enabled !== false);
  const [tickerItems, setTickerItems] = useState<string[]>(
    (profile.ticker_items as string[] | null) ?? []
  );

  // ── Site Settings state ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [siteTags, setSiteTags] = useState<SiteTag[]>(((profile as any).site_tags as SiteTag[] | null) ?? []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [siteTagsDisplay, setSiteTagsDisplay] = useState<SiteTagsDisplay>(((profile as any).site_tags_display as SiteTagsDisplay | null) ?? DEFAULT_SITE_TAGS_DISPLAY);

  // ── Sidequests / Crowdfunding state ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [crowdfundingEnabled, setCrowdfundingEnabled] = useState<boolean>((profile as any).crowdfunding_enabled ?? false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [crowdfundingTitle, setCrowdfundingTitle] = useState<string>((profile as any).crowdfunding_title ?? "Weird Projects I Backed");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [crowdfundingCarouselAuto, setCrowdfundingCarouselAuto] = useState<boolean>((profile as any).crowdfunding_carousel_auto ?? false);

  // ── Save state ──
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Sections that manage their own save (don't show the global save button)
  // Sections that don't use the global save button
  const isSelfManaged = (activeTab === "site" && currentSubTab === "API Keys")
    || (activeTab === "sidequests" && currentSubTab === "Adventures")
    || (activeTab === "sidequests" && currentSubTab === "My Projects")
    || (activeTab === "sidequests" && currentSubTab === "Projects I Backed")
    || (activeTab === "content" && currentSubTab === "Writings");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);

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
        site_tags_display: siteTagsDisplay,
        crowdfunding_enabled: crowdfundingEnabled,
        crowdfunding_title: crowdfundingTitle.trim() || "Weird Projects I Backed",
        crowdfunding_carousel_auto: crowdfundingCarouselAuto,
        updated_at: new Date().toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from("profiles")
        .update(updates)
        .eq("id", profile.id);

      if (updateError) setError(updateError.message);
      else { setSaved(true); router.refresh(); }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 border-3 border-ink bg-bg-card font-mono text-[0.88rem] focus:outline-none focus:shadow-[3px_3px_0_var(--ink)] transition-shadow";
  const labelClass = "block font-head font-bold text-[0.78rem] uppercase mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-0">

      {/* ══════ PRIMARY TABS: Sticker style ══════ */}
      <div className="flex gap-[6px] flex-wrap pb-4 mb-0 border-b-3 border-ink">
        {TABS.map((t, i) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            style={{ transform: `rotate(${ROTATIONS[i]})` }}
            className={`flex items-center gap-[7px] px-4 py-2 font-head font-[900] text-[0.72rem] uppercase tracking-[0.02em] border-2 border-ink cursor-pointer transition-all whitespace-nowrap ${
              activeTab === t.key
                ? "bg-orange text-ink shadow-[3px_3px_0_var(--ink)]"
                : "bg-bg hover:shadow-[3px_3px_0_var(--ink)]"
            }`}
          >
            <span
              className="w-[7px] h-[7px] rounded-full flex-shrink-0"
              style={{
                background: t.dot,
                opacity: activeTab === t.key ? 0.5 : 1,
              }}
            />
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════ SUB-TABS: Plain underline ══════ */}
      {currentTabDef.subtabs && (
        <div className="flex gap-0 border-b border-ink/15">
          {currentTabDef.subtabs.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSubTab(st)}
              className={`py-3 px-5 font-mono text-[0.7rem] font-bold uppercase tracking-[0.03em] cursor-pointer transition-all border-b-2 ${
                currentSubTab === st
                  ? "text-ink border-orange"
                  : "text-ink-muted border-transparent hover:text-ink"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      )}

      {/* ══════ CONTENT AREA ══════ */}
      <div className="pt-8 space-y-8">

        {/* ── PROFILE & IDENTITY ── */}
        {activeTab === "identity" && currentSubTab === "Avatar & Name" && (
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
              <label htmlFor="displayName" className={labelClass}>Display Name</label>
              <input id="displayName" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name or tagline" maxLength={120} className={inputClass} />
              <p className="font-mono text-[0.68rem] opacity-50 mt-1.5">Shown as your profile heading. Leave blank to use the default.</p>
            </div>
            <div>
              <label htmlFor="bio" className={labelClass}>Short Bio</label>
              <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A short bio for your profile card…" rows={3} maxLength={500} className={`${inputClass} resize-y`} />
              <p className="font-mono text-[0.68rem] opacity-50 mt-1.5">{bio.length}/500 characters</p>
            </div>
          </div>
        )}

        {activeTab === "identity" && currentSubTab === "Bio & Factoids" && (
          <div className="space-y-8">
            <div>
              <label htmlFor="aboutBio" className={labelClass}>About Bio</label>
              <textarea id="aboutBio" value={aboutBio} onChange={(e) => setAboutBio(e.target.value)} placeholder="Write about yourself… Use [link text](url) for hyperlinks." rows={8} className={`${inputClass} resize-y`} />
              <p className="font-mono text-[0.68rem] opacity-50 mt-1.5">Shown on the About page. Supports basic markdown links: [text](url)</p>
            </div>
            <div>
              <div className={labelClass}>Factoid Cards</div>
              <p className="font-mono text-[0.68rem] opacity-50 mb-4">Quick-glance cards shown alongside your bio. Pick a category, set a value.</p>
              <FactoidEditor factoids={factoids} onChange={setFactoids} />
            </div>
          </div>
        )}

        {activeTab === "identity" && currentSubTab === "Likes & Dislikes" && (
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

        {/* ── PROFESSIONAL ── */}
        {activeTab === "professional" && (
          <div className="space-y-8">
            <p className="font-mono text-[0.78rem] opacity-60 leading-relaxed">
              These appear at the top of your Professional page.
            </p>
            <div>
              <label htmlFor="professionalName" className={labelClass}>Professional Name</label>
              <input id="professionalName" type="text" value={professionalName} onChange={(e) => setProfessionalName(e.target.value)} placeholder="e.g. Sophie Collins — Product Marketing Leader" maxLength={150} className={inputClass} />
              <p className="font-mono text-[0.68rem] opacity-50 mt-1.5">Headline shown on the Professional page. Leave blank to use your display name.</p>
            </div>
            <div>
              <label htmlFor="linkedinUrl" className={labelClass}>LinkedIn URL</label>
              <input id="linkedinUrl" type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://www.linkedin.com/in/yourprofile" className={inputClass} />
              <p className="font-mono text-[0.68rem] opacity-50 mt-1.5">Full LinkedIn profile URL. Shown as a link on the Professional page.</p>
            </div>
          </div>
        )}

        {/* ── SIDEQUESTS ── */}
        {activeTab === "sidequests" && currentSubTab === "Adventures" && (
          <AdventuresManager username={profile.username} />
        )}

        {activeTab === "sidequests" && currentSubTab === "My Projects" && (
          <ProjectsManager userId={profile.id} username={profile.username} />
        )}

        {activeTab === "sidequests" && currentSubTab === "Projects I Backed" && (
          <div className="space-y-6">
            {/* Display settings — compact row */}
            <div className="flex items-center gap-4 flex-wrap border-b border-ink/10 pb-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={crowdfundingEnabled} onChange={(e) => setCrowdfundingEnabled(e.target.checked)} className="w-4 h-4 border-3 border-ink accent-ink cursor-pointer" />
                <span className="font-mono text-[0.68rem] opacity-70">Show on About page</span>
              </label>
              {crowdfundingEnabled && (
                <>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={crowdfundingCarouselAuto} onChange={(e) => setCrowdfundingCarouselAuto(e.target.checked)} className="w-4 h-4 border-3 border-ink accent-ink cursor-pointer" />
                    <span className="font-mono text-[0.68rem] opacity-70">Auto-scroll carousel</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[0.6rem] opacity-40">Title:</span>
                    <input type="text" value={crowdfundingTitle} onChange={(e) => setCrowdfundingTitle(e.target.value)} placeholder="Weird Projects I Backed" maxLength={80} className="px-2 py-1 border-2 border-ink/20 bg-bg-card font-mono text-[0.68rem] w-48 focus:outline-none focus:border-ink/50" />
                  </div>
                </>
              )}
            </div>
            {/* Project list — always shown */}
            <CrowdfundingEditor userId={profile.id} username={profile.username} />
          </div>
        )}

        {/* ── CONTENT ── */}
        {activeTab === "content" && currentSubTab === "Writings" && (
          <WritingsManager username={profile.username} />
        )}

        {activeTab === "content" && currentSubTab === "Ticker" && (
          <div className="space-y-8">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input type="checkbox" checked={tickerEnabled} onChange={(e) => setTickerEnabled(e.target.checked)} className="w-4 h-4 border-3 border-ink accent-ink cursor-pointer" />
              <span className="font-head font-bold text-[0.78rem] uppercase">Show ticker on profile</span>
            </label>
            {tickerEnabled && (
              <>
                <p className="font-mono text-[0.78rem] opacity-60 leading-relaxed">
                  Short items that scroll across the bottom of your profile page. Up to 10 items.
                  <br /><strong className="opacity-80">Pin</strong> items to keep them when using reroll.
                </p>
                <div>
                  <div className={labelClass}>Ticker Items</div>
                  <TickerEditor items={tickerItems} onChange={setTickerItems} />
                </div>
              </>
            )}
          </div>
        )}

        {/* ── SITE SETTINGS ── */}
        {activeTab === "site" && currentSubTab === "Tags" && (
          <div className="space-y-8">
            <p className="font-mono text-[0.78rem] opacity-60 leading-relaxed">
              Sticker-style tags shown on your profile home page. Each tag links to a filtered view of all your content with that tag.
            </p>
            <SiteTagsEditor tags={siteTags} display={siteTagsDisplay} onChange={setSiteTags} onDisplayChange={setSiteTagsDisplay} writingTags={writingTags} />
          </div>
        )}

        {activeTab === "site" && currentSubTab === "API Keys" && (
          <div className="space-y-8">
            <ApiKeysEditor userId={profile.id} />
          </div>
        )}
      </div>

      {/* ── Status + Actions ── */}
      {!isSelfManaged && (
        <div className="pt-8 space-y-4">
          {error && (
            <div className="border-3 border-red-500 bg-red-50 p-3 font-mono text-[0.78rem] text-red-600">{error}</div>
          )}
          {saved && (
            <div className="border-3 border-green bg-green/10 p-3 font-mono text-[0.78rem] text-ink">✓ Profile updated successfully</div>
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
        </div>
      )}
    </form>
  );
}
