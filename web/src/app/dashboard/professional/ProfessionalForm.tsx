"use client";

/**
 * Professional form — manages professional name and LinkedIn URL.
 * [SQ.S-W-2603-0008]
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/profiles";

interface DashboardProfessionalFormProps {
  profile: Profile;
}

export default function DashboardProfessionalForm({ profile }: DashboardProfessionalFormProps) {
  const router = useRouter();
  const [professionalName, setProfessionalName] = useState(profile.professional_name ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url ?? "");

  // ── Save state ──
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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
        professional_name: professionalName.trim() || null,
        linkedin_url: linkedinTrimmed || null,
        updated_at: new Date().toISOString(),
      };

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
      <p className="font-mono text-[0.78rem] opacity-60 leading-relaxed mb-8">
        These appear at the top of your Professional page.
      </p>

      <div className="space-y-8">
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

      {/* Error and success messages */}
      {error && (
        <div className="border-3 border-pink bg-pink/10 p-3 font-mono text-[0.78rem] text-pink">
          {error}
        </div>
      )}
      {saved && (
        <div className="border-3 border-green bg-green/10 p-3 font-mono text-[0.78rem] text-ink">
          ✓ Professional details updated successfully
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
          href={`https://sidequest.me/${profile.username}`}
          className="px-6 py-2.5 bg-transparent text-ink font-head font-bold text-[0.78rem] uppercase border-3 border-ink hover:bg-ink hover:text-bg transition-colors no-underline inline-block"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
