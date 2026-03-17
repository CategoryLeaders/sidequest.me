"use client";

/**
 * CRUD editor for crowdfunding (backed) projects.
 * Operates directly against Supabase — projects live in their own table, not in a profile JSON column.
 */

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";
import { statusColor, statusLabel } from "@/lib/crowdfunding-utils";

type Project = Tables<"crowdfunding_projects">;

const STATUSES = ["active", "delivered", "shipped", "dropped", "failed", "suspended"] as const;
const PLATFORMS = ["kickstarter", "indiegogo", "gamefound", "backerkit", "other"] as const;
const CURRENCIES = ["GBP", "USD", "EUR", "HKD", "JPY", "CAD", "AUD"] as const;

interface CrowdfundingEditorProps {
  userId: string;
  username: string;
}

/** Generate a slug from a title */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export default function CrowdfundingEditor({ userId, username }: CrowdfundingEditorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null); // project id being edited
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Fetch all projects ──
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: fetchError } = await (supabase as any)
      .from("crowdfunding_projects")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setProjects((data as Project[]) ?? []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // ── Toggle publish status ──
  const togglePublish = async (project: Project) => {
    const next = project.pledge_status === "published" ? "unpublished" : "published";
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (supabase as any)
      .from("crowdfunding_projects")
      .update({ pledge_status: next, updated_at: new Date().toISOString() })
      .eq("id", project.id);

    if (updateErr) {
      setError(updateErr.message);
    } else {
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, pledge_status: next } : p))
      );
    }
  };

  // ── Toggle show pledge amount ──
  const togglePledgeAmount = async (project: Project) => {
    const next = !project.show_pledge_amount;
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (supabase as any)
      .from("crowdfunding_projects")
      .update({ show_pledge_amount: next, updated_at: new Date().toISOString() })
      .eq("id", project.id);

    if (updateErr) {
      setError(updateErr.message);
    } else {
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, show_pledge_amount: next } : p))
      );
    }
  };

  // ── Delete project ──
  const deleteProject = async (id: string) => {
    if (!confirm("Delete this project? This can't be undone.")) return;
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: delErr } = await (supabase as any)
      .from("crowdfunding_projects")
      .delete()
      .eq("id", id);

    if (delErr) {
      setError(delErr.message);
    } else {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (editing === id) setEditing(null);
    }
  };

  // ── Counts ──
  const publishedCount = projects.filter((p) => p.pledge_status === "published").length;
  const unpublishedCount = projects.length - publishedCount;

  if (loading) {
    return (
      <p className="font-mono text-[0.78rem] opacity-60 py-4 animate-pulse">
        Loading projects…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="border-3 border-ink bg-pink/10 p-3 font-mono text-[0.75rem]">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-3 underline cursor-pointer"
          >
            dismiss
          </button>
        </div>
      )}

      {/* Summary & add button */}
      <div className="flex items-center justify-between">
        <p className="font-mono text-[0.72rem] opacity-60">
          {projects.length} project{projects.length !== 1 ? "s" : ""} ·{" "}
          {publishedCount} published · {unpublishedCount} hidden
        </p>
        <button
          onClick={() => {
            setAdding(true);
            setEditing(null);
          }}
          className="sticker sticker-green cursor-pointer text-[0.7rem]"
          style={{ transform: "rotate(0.5deg)" }}
        >
          + Add Project
        </button>
      </div>

      {/* Add new project form */}
      {adding && (
        <ProjectForm
          userId={userId}
          nextSortOrder={projects.length}
          onSaved={() => {
            setAdding(false);
            fetchProjects();
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {/* Project list */}
      <div className="space-y-3">
        {projects.map((project, i) => (
          <div key={project.id}>
            {editing === project.id ? (
              <ProjectForm
                userId={userId}
                project={project}
                nextSortOrder={project.sort_order}
                onSaved={() => {
                  setEditing(null);
                  fetchProjects();
                }}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div
                className={`border-3 border-ink p-4 bg-bg-card flex flex-col gap-2 ${
                  project.pledge_status === "unpublished" ? "opacity-50" : ""
                }`}
                style={{
                  transform: `rotate(${i % 2 === 0 ? "-0.15deg" : "0.15deg"})`,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-head font-bold text-[0.82rem] uppercase truncate">
                        {project.title}
                      </h4>
                      <span
                        className={`sticker text-[0.5rem] px-1.5 py-0.5 ${statusColor(
                          project.status
                        )}`}
                      >
                        {statusLabel(project.status)}
                      </span>
                      {project.pledge_status === "unpublished" && (
                        <span className="font-mono text-[0.5rem] opacity-40 uppercase">
                          hidden
                        </span>
                      )}
                    </div>
                    {project.pledge_amount && (
                      <p className="font-mono text-[0.68rem] opacity-50">
                        {project.pledge_currency} {project.pledge_amount}
                        {project.show_pledge_amount ? " · visible" : " · hidden from profile"}
                      </p>
                    )}
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {project.tags.map((t) => (
                          <span
                            key={t}
                            className="font-mono text-[0.5rem] px-1 py-0.5 border border-ink/20 opacity-50"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => togglePublish(project)}
                      className="font-mono text-[0.58rem] px-2 py-1 border-2 border-ink cursor-pointer bg-bg-card hover:bg-ink/5"
                      title={project.pledge_status === "published" ? "Unpublish" : "Publish"}
                    >
                      {project.pledge_status === "published" ? "Hide" : "Publish"}
                    </button>
                    <button
                      onClick={() => togglePledgeAmount(project)}
                      className="font-mono text-[0.58rem] px-2 py-1 border-2 border-ink cursor-pointer bg-bg-card hover:bg-ink/5"
                      title={
                        project.show_pledge_amount
                          ? "Hide pledge amount"
                          : "Show pledge amount"
                      }
                    >
                      {project.show_pledge_amount ? "£ on" : "£ off"}
                    </button>
                    <button
                      onClick={() => setEditing(project.id)}
                      className="font-mono text-[0.58rem] px-2 py-1 border-2 border-ink cursor-pointer bg-bg-card hover:bg-ink/5"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteProject(project.id)}
                      className="font-mono text-[0.58rem] px-2 py-1 border-2 border-ink cursor-pointer bg-pink/20 hover:bg-pink/40"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {projects.length === 0 && !adding && (
        <p className="text-center opacity-40 font-mono text-[0.8rem] py-8">
          No backed projects yet. Click &ldquo;+ Add Project&rdquo; to get started.
        </p>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Inline form for creating / editing a single project
// ════════════════════════════════════════════════════════════

interface ProjectFormProps {
  userId: string;
  project?: Project;
  nextSortOrder: number;
  onSaved: () => void;
  onCancel: () => void;
}

function ProjectForm({ userId, project, nextSortOrder, onSaved, onCancel }: ProjectFormProps) {
  const isEdit = !!project;

  const [title, setTitle] = useState(project?.title ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [imageUrl, setImageUrl] = useState(project?.image_url ?? "");
  const [externalUrl, setExternalUrl] = useState(project?.external_url ?? "");
  const [platform, setPlatform] = useState(project?.platform ?? "kickstarter");
  const [pledgeAmount, setPledgeAmount] = useState(project?.pledge_amount ?? "");
  const [pledgeCurrency, setPledgeCurrency] = useState(project?.pledge_currency ?? "GBP");
  const [rewardTier, setRewardTier] = useState(project?.reward_tier ?? "");
  const [status, setStatus] = useState(project?.status ?? "active");
  const [pledgeStatus, setPledgeStatus] = useState(project?.pledge_status ?? "unpublished");
  const [estDelivery, setEstDelivery] = useState(project?.est_delivery ?? "");
  const [showPledge, setShowPledge] = useState(project?.show_pledge_amount ?? false);
  const [tagsStr, setTagsStr] = useState((project?.tags ?? []).join(", "));

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Auto-slug from title (only for new projects)
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEdit) {
      setSlug(slugify(val));
    }
  };

  const inputClass =
    "w-full px-3 py-2 border-3 border-ink bg-bg-card font-mono text-[0.78rem] focus:outline-none focus:shadow-[3px_3px_0_var(--ink)] transition-shadow";
  const labelClass = "block font-head font-bold text-[0.68rem] uppercase mb-1";

  const handleSave = async () => {
    if (!title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!slug.trim()) {
      setFormError("Slug is required.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const tags = tagsStr
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const data: Record<string, unknown> = {
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      image_url: imageUrl.trim() || null,
      external_url: externalUrl.trim() || null,
      platform,
      pledge_amount: pledgeAmount.trim() || null,
      pledge_currency: pledgeCurrency,
      reward_tier: rewardTier.trim() || null,
      status,
      pledge_status: pledgeStatus,
      est_delivery: estDelivery.trim() || null,
      show_pledge_amount: showPledge,
      tags,
      updated_at: new Date().toISOString(),
    };

    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    if (isEdit) {
      const { error } = await db
        .from("crowdfunding_projects")
        .update(data)
        .eq("id", project.id);

      if (error) {
        setFormError(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await db.from("crowdfunding_projects").insert({
        ...data,
        user_id: userId,
        sort_order: nextSortOrder,
      });

      if (error) {
        setFormError(error.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    onSaved();
  };

  return (
    <div
      className="border-3 border-ink p-5 bg-bg-card space-y-4"
      style={{ transform: "rotate(-0.1deg)" }}
    >
      <h4 className="font-head font-bold text-[0.82rem] uppercase">
        {isEdit ? "Edit Project" : "Add New Project"}
      </h4>

      {formError && (
        <p className="font-mono text-[0.72rem] text-pink font-bold">{formError}</p>
      )}

      {/* Row 1: Title + slug */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Awesome Gadget"
            maxLength={200}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Slug *</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="awesome-gadget"
            maxLength={80}
            className={inputClass}
          />
        </div>
      </div>

      {/* Row 2: Platform + Status + Publish */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Platform</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className={inputClass}
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputClass}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Visibility</label>
          <select
            value={pledgeStatus}
            onChange={(e) => setPledgeStatus(e.target.value)}
            className={inputClass}
          >
            <option value="published">Published</option>
            <option value="unpublished">Hidden</option>
          </select>
        </div>
      </div>

      {/* Row 3: Pledge amount + currency */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Pledge Amount</label>
          <input
            type="text"
            value={pledgeAmount}
            onChange={(e) => setPledgeAmount(e.target.value)}
            placeholder="25.00"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Currency</label>
          <select
            value={pledgeCurrency}
            onChange={(e) => setPledgeCurrency(e.target.value)}
            className={inputClass}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Est. Delivery</label>
          <input
            type="text"
            value={estDelivery}
            onChange={(e) => setEstDelivery(e.target.value)}
            placeholder="Mar 2026"
            className={inputClass}
          />
        </div>
      </div>

      {/* Row 4: URLs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>External URL</label>
          <input
            type="url"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="https://www.kickstarter.com/projects/..."
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Image URL</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://images.sidequest.me/..."
            className={inputClass}
          />
        </div>
      </div>

      {/* Row 5: Reward tier + Tags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Reward Tier</label>
          <input
            type="text"
            value={rewardTier}
            onChange={(e) => setRewardTier(e.target.value)}
            placeholder="Early Bird — includes base game + expansions"
            maxLength={300}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Tags (comma-separated)</label>
          <input
            type="text"
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            placeholder="gadgets, games, tech"
            className={inputClass}
          />
        </div>
      </div>

      {/* Show pledge toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={showPledge}
          onChange={(e) => setShowPledge(e.target.checked)}
          className="w-4 h-4 border-3 border-ink accent-ink cursor-pointer"
        />
        <span className="font-head font-bold text-[0.68rem] uppercase">
          Show pledge amount on profile
        </span>
      </label>

      {/* Description */}
      <div>
        <label className={labelClass}>Description / Notes</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Why you backed this, personal notes..."
          rows={3}
          className={inputClass}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="sticker sticker-green cursor-pointer text-[0.7rem]"
        >
          {saving ? "Saving…" : isEdit ? "Update" : "Add"}
        </button>
        <button
          onClick={onCancel}
          className="font-mono text-[0.68rem] px-3 py-1.5 border-2 border-ink cursor-pointer bg-bg-card hover:bg-ink/5"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
