"use client";

/**
 * ProjectsManager — Settings list view for owned projects.
 * Drag-to-reorder, publish/hide toggle, status badge, edit link.
 * [SQ.S-W-2603-0060]
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface Project {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  description: string | null;
  status: string;
  status_color: string | null;
  sort_order: number;
  published: boolean;
  updated_at: string;
}

const STATUS_OPTIONS = ["Active", "Building", "Complete", "Paused"] as const;

const STATUS_COLORS: Record<string, string> = {
  Active: "var(--green)",
  Building: "var(--orange)",
  Complete: "var(--blue)",
  Paused: "var(--lilac)",
};

interface ProjectsManagerProps {
  userId: string;
  username: string;
}

export default function ProjectsManager({ userId, username }: ProjectsManagerProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: fetchErr } = await (supabase as any)
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true });

    if (fetchErr) {
      setError(fetchErr.message);
    } else {
      setProjects((data as Project[]) ?? []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // ── Publish toggle ──
  const togglePublish = async (project: Project) => {
    const next = !project.published;
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (supabase as any)
      .from("projects")
      .update({ published: next, updated_at: new Date().toISOString() })
      .eq("id", project.id);

    if (updateErr) {
      setError(updateErr.message);
    } else {
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, published: next } : p))
      );
    }
  };

  // ── Status change ──
  const changeStatus = async (project: Project, newStatus: string) => {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (supabase as any)
      .from("projects")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", project.id);

    if (updateErr) {
      setError(updateErr.message);
    } else {
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, status: newStatus } : p))
      );
    }
  };

  // ── Drag to reorder ──
  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    const reordered = [...projects];
    const [removed] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, removed);

    // Update sort_order locally
    const updated = reordered.map((p, i) => ({ ...p, sort_order: i }));
    setProjects(updated);

    dragItem.current = null;
    dragOverItem.current = null;

    // Persist new order
    const supabase = createClient();
    for (const p of updated) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("projects")
        .update({ sort_order: p.sort_order })
        .eq("id", p.id);
    }
  };

  const publishedCount = projects.filter((p) => p.published).length;
  const hiddenCount = projects.length - publishedCount;

  if (loading) {
    return <p className="font-mono text-[0.78rem] opacity-40 animate-pulse">Loading projects…</p>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="border-3 border-ink bg-pink/10 p-3 font-mono text-[0.75rem]">
          {error}
          <button onClick={() => setError(null)} className="ml-3 underline cursor-pointer">
            dismiss
          </button>
        </div>
      )}

      {/* Summary + add button */}
      <div className="flex items-center justify-between">
        <p className="font-mono text-[0.72rem] opacity-60">
          {projects.length} project{projects.length !== 1 ? "s" : ""} · {publishedCount} published · {hiddenCount} hidden
        </p>
        <a
          href={`https://sidequest.me/${username}/admin/projects/new`}
          className="sticker sticker-green cursor-pointer text-[0.7rem] no-underline"
          style={{ transform: "rotate(0.5deg)" }}
        >
          + Add Project
        </a>
      </div>

      {/* Project list */}
      <div className="space-y-2">
        {projects.map((project, i) => (
          <div
            key={project.id}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragEnter={() => handleDragEnter(i)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={`border-3 border-ink p-3 bg-bg-card flex items-center gap-3 cursor-grab active:cursor-grabbing transition-opacity ${
              !project.published ? "opacity-50" : ""
            }`}
          >
            {/* Drag handle */}
            <span className="text-ink/25 text-[0.7rem] flex-shrink-0 select-none" title="Drag to reorder">
              ⠿
            </span>

            {/* Title + description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={`https://sidequest.me/${username}/projects/${project.slug}`}
                  className="font-head font-bold text-[0.82rem] uppercase truncate no-underline text-ink hover:text-[var(--orange)] transition-colors"
                >
                  {project.title}
                </a>
                {/* Status badge */}
                <span
                  className="inline-block text-[0.55rem] font-mono font-bold px-2 py-0.5 border-2 border-ink uppercase"
                  style={{
                    backgroundColor: STATUS_COLORS[project.status] ?? "var(--lilac)",
                    opacity: 0.8,
                  }}
                >
                  {project.status}
                </span>
              </div>
              {project.description && (
                <p className="text-[0.72rem] opacity-50 truncate mt-0.5">
                  {project.description}
                </p>
              )}
            </div>

            {/* Status dropdown */}
            <select
              value={project.status}
              onChange={(e) => changeStatus(project, e.target.value)}
              className="font-mono text-[0.55rem] px-1.5 py-1 border-2 border-ink/20 bg-bg-card cursor-pointer opacity-50 hover:opacity-80 transition-opacity flex-shrink-0"
              title="Change status"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              {!STATUS_OPTIONS.includes(project.status as typeof STATUS_OPTIONS[number]) && (
                <option value={project.status}>{project.status} (current)</option>
              )}
            </select>

            {/* Publish toggle */}
            <button
              onClick={() => togglePublish(project)}
              className={`font-mono text-[0.58rem] px-2.5 py-1 border-2 border-ink cursor-pointer transition-colors flex-shrink-0 ${
                project.published
                  ? "bg-green/20 hover:bg-green/40"
                  : "bg-bg-card hover:bg-ink/5"
              }`}
              title={project.published ? "Click to hide" : "Click to publish"}
            >
              {project.published ? "Published" : "Hidden"}
            </button>

            {/* Edit link */}
            <a
              href={`https://sidequest.me/${username}/admin/projects/${project.slug}`}
              className="font-mono text-[0.58rem] px-2 py-1 border-2 border-ink bg-bg-card hover:bg-ink/5 cursor-pointer no-underline text-ink flex-shrink-0"
            >
              Edit
            </a>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <p className="text-center opacity-40 font-mono text-[0.8rem] py-8">
          No projects yet. Click &ldquo;+ Add Project&rdquo; to get started.
        </p>
      )}
    </div>
  );
}