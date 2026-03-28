"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Project {
  id: string;
  title: string;
  slug: string;
  url: string | null;
  description: string | null;
  long_description: string | null;
  hero_image_url: string | null;
  status: string;
  stack: string[] | null;
  published: boolean;
}

interface Microblog {
  id: string;
  body: string;
  images: { url: string; alt_text?: string }[] | null;
  published_at: string | null;
  created_at: string;
  tags: string[] | null;
}

interface Writing {
  id: string;
  title: string;
  slug: string;
  status: string;
  published_at: string | null;
  tags: string[] | null;
}

interface Photo {
  id: string;
  image_urls: string[] | null;
  caption: string | null;
  date: string | null;
  tags: string[] | null;
}

interface Props {
  project: Project;
  username: string;
  microblogs: Microblog[];
  writings: Writing[];
  photos: Photo[];
}

type StreamItem = {
  id: string;
  type: "microblog" | "writing" | "photo";
  date: string;
  data: Microblog | Writing | Photo;
};

const STATUS_COLORS: Record<string, string> = {
  Active: "#00d4aa",
  Building: "#ff6b35",
  Complete: "#4d9fff",
  Paused: "#c4a8ff",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ProjectDetailClient({
  project,
  username,
  microblogs,
  writings,
  photos,
}: Props) {
  const router = useRouter();
  const [heroUrl, setHeroUrl] = useState(project.hero_image_url ?? "");
  const [description, setDescription] = useState(project.description ?? "");
  const [longDesc, setLongDesc] = useState(project.long_description ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingHero, setUploadingHero] = useState(false);
  const heroInputRef = useRef<HTMLInputElement>(null);

  // Build unified stream sorted by date
  const stream: StreamItem[] = [];

  for (const m of microblogs) {
    stream.push({
      id: m.id,
      type: "microblog",
      date: m.published_at ?? m.created_at,
      data: m,
    });
  }
  for (const w of writings) {
    stream.push({
      id: w.id,
      type: "writing",
      date: w.published_at ?? new Date().toISOString(),
      data: w,
    });
  }
  for (const p of photos) {
    stream.push({
      id: p.id,
      type: "photo",
      date: p.date ?? new Date().toISOString(),
      data: p,
    });
  }

  stream.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleHeroUpload = async (file: File) => {
    setUploadingHero(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("context", "projects");
      const res = await fetch("/api/upload-image", { method: "POST", body: form });
      if (res.ok) {
        const { url } = (await res.json()) as { url: string };
        setHeroUrl(url);
      }
    } catch {
      /* skip */
    } finally {
      setUploadingHero(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateErr } = await (supabase as any)
        .from("projects")
        .update({
          description: description.trim() || null,
          long_description: longDesc.trim() || null,
          hero_image_url: heroUrl.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id);

      if (updateErr) {
        setError(updateErr.message);
      } else {
        setSaved(true);
        router.refresh();
      }
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const statusColor = STATUS_COLORS[project.status] ?? "#c4a8ff";

  return (
    <main
      className="min-h-screen p-8"
      style={{ backgroundColor: "var(--bg, #fffbe6)" }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href="/sidequests/projects"
          className="font-mono text-[0.68rem] text-ink-muted hover:text-ink no-underline mb-6 inline-block transition-colors"
        >
          ← Back to projects
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <h1
            className="font-head font-[900] text-[1.6rem] uppercase tracking-tight"
            style={{ color: "var(--ink, #1a1a1a)" }}
          >
            {project.title}
          </h1>
          <span
            className="inline-block text-[0.6rem] font-mono font-bold px-2.5 py-0.5 border-2 border-ink uppercase"
            style={{ backgroundColor: statusColor, opacity: 0.8 }}
          >
            {project.status}
          </span>
        </div>

        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[0.72rem] text-orange no-underline hover:underline mb-6 inline-block"
          >
            {project.url} ↗
          </a>
        )}

        {/* Hero image */}
        <div className="mb-8">
          <input
            ref={heroInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleHeroUpload(f);
              e.target.value = "";
            }}
          />
          {heroUrl ? (
            <div className="relative border-3 border-ink overflow-hidden group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroUrl}
                alt={project.title}
                className="w-full h-48 object-cover"
              />
              <button
                type="button"
                onClick={() => heroInputRef.current?.click()}
                className="absolute bottom-2 right-2 px-3 py-1 bg-ink/80 text-white font-mono text-[0.6rem] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploadingHero ? "Uploading…" : "Change image"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => heroInputRef.current?.click()}
              className="w-full h-32 border-3 border-dashed border-ink/20 hover:border-ink/40 flex items-center justify-center transition-colors cursor-pointer bg-transparent"
            >
              <span className="font-mono text-[0.72rem] opacity-40">
                {uploadingHero ? "Uploading…" : "＋ Add hero image"}
              </span>
            </button>
          )}
        </div>

        {/* Editable description fields */}
        <div
          className="bg-[var(--bg-card)] border-3 border-ink p-6 mb-8"
          style={{ boxShadow: "3px 3px 0 var(--ink)" }}
        >
          <div className="space-y-5">
            <div>
              <label className="block font-head font-bold text-[0.72rem] uppercase mb-2">
                Short description
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="One-liner about this project"
                maxLength={300}
                className="w-full px-4 py-2.5 border-3 border-ink bg-bg-card font-mono text-[0.82rem] focus:outline-none focus:shadow-[3px_3px_0_var(--ink)] transition-shadow"
              />
            </div>

            <div>
              <label className="block font-head font-bold text-[0.72rem] uppercase mb-2">
                About this project
              </label>
              <p className="font-mono text-[0.62rem] opacity-40 mb-2">
                What is it? Why are you doing it? Where might it go?
              </p>
              <textarea
                value={longDesc}
                onChange={(e) => setLongDesc(e.target.value)}
                placeholder="Tell the story of this project — what it is, why you started it, where you hope it goes…"
                rows={6}
                className="w-full px-4 py-2.5 border-3 border-ink bg-bg-card font-body text-[0.88rem] leading-relaxed focus:outline-none focus:shadow-[3px_3px_0_var(--ink)] transition-shadow resize-y"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-orange text-white font-head font-bold text-[0.72rem] uppercase border-3 border-orange hover:bg-transparent hover:text-orange transition-colors disabled:opacity-50 cursor-pointer shadow-[3px_3px_0_var(--ink)]"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              {saved && (
                <span className="font-mono text-[0.68rem] text-green">
                  ✓ Saved
                </span>
              )}
              {error && (
                <span className="font-mono text-[0.68rem] text-pink">
                  {error}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href={`/content/microblogs?project=${project.slug}`}
            className="px-4 py-2 border-3 border-ink bg-[var(--bg-card)] font-mono text-[0.68rem] uppercase font-bold hover:bg-ink hover:text-white transition-colors no-underline"
          >
            💬 New Microblog
          </Link>
          <Link
            href={`/content/photos?project=${project.slug}`}
            className="px-4 py-2 border-3 border-ink bg-[var(--bg-card)] font-mono text-[0.68rem] uppercase font-bold hover:bg-ink hover:text-white transition-colors no-underline"
          >
            📸 New Image
          </Link>
          <a
            href={`https://sidequest.me/${username}/admin/writings/new?project=${project.slug}`}
            className="px-4 py-2 border-3 border-ink bg-[var(--bg-card)] font-mono text-[0.68rem] uppercase font-bold hover:bg-ink hover:text-white transition-colors no-underline"
          >
            📝 New Writing
          </a>
          <a
            href={`https://sidequest.me/${username}/projects/${project.slug}`}
            className="px-4 py-2 border-3 border-ink bg-[var(--bg-card)] font-mono text-[0.68rem] uppercase font-bold hover:bg-ink hover:text-white transition-colors no-underline"
          >
            🌍 View Public Page →
          </a>
        </div>

        {/* Content stream */}
        <div>
          <h2
            className="font-head font-[900] text-[1rem] uppercase tracking-tight mb-4"
            style={{ color: "var(--ink, #1a1a1a)" }}
          >
            Project Updates
            <span className="font-mono text-[0.62rem] font-normal opacity-40 ml-2 normal-case">
              {stream.length} item{stream.length !== 1 ? "s" : ""}
            </span>
          </h2>

          {stream.length === 0 ? (
            <div className="border-3 border-dashed border-ink/15 p-8 text-center">
              <p className="font-mono text-[0.78rem] opacity-40 mb-2">
                No updates yet for this project.
              </p>
              <p className="font-mono text-[0.68rem] opacity-30">
                Link microblogs, tag writings, or upload photos to see them here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stream.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="border-3 border-ink bg-[var(--bg-card)] p-4"
                  style={{ boxShadow: "2px 2px 0 rgba(0,0,0,0.05)" }}
                >
                  {/* Type badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="font-mono text-[0.55rem] font-bold uppercase px-2 py-0.5 border border-ink/20"
                      style={{
                        backgroundColor:
                          item.type === "microblog"
                            ? "#4d9fff20"
                            : item.type === "writing"
                            ? "#ff69b420"
                            : "#c4a8ff20",
                        color:
                          item.type === "microblog"
                            ? "#4d9fff"
                            : item.type === "writing"
                            ? "#ff69b4"
                            : "#c4a8ff",
                      }}
                    >
                      {item.type === "microblog"
                        ? "💬 Microblog"
                        : item.type === "writing"
                        ? "📝 Writing"
                        : "📸 Photo"}
                    </span>
                    <span className="font-mono text-[0.55rem] opacity-40">
                      {formatDate(item.date)}
                    </span>
                  </div>

                  {/* Content */}
                  {item.type === "microblog" && (
                    <>
                      <p className="text-[0.85rem] leading-relaxed">
                        {(item.data as Microblog).body}
                      </p>
                      {(item.data as Microblog).images &&
                        (item.data as Microblog).images!.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {(item.data as Microblog).images!.map((img, i) => (
                              <div
                                key={i}
                                className="w-16 h-16 border border-ink/10 overflow-hidden"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={img.url}
                                  alt={img.alt_text ?? ""}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                    </>
                  )}

                  {item.type === "writing" && (
                    <a
                      href={`https://sidequest.me/${username}/writings/${(item.data as Writing).slug}`}
                      className="font-head font-bold text-[0.88rem] text-ink hover:text-orange no-underline transition-colors"
                    >
                      {(item.data as Writing).title}
                    </a>
                  )}

                  {item.type === "photo" && (
                    <div className="flex gap-1">
                      {((item.data as Photo).image_urls ?? [])
                        .slice(0, 4)
                        .map((url, i) => (
                          <div
                            key={i}
                            className="w-20 h-20 border border-ink/10 overflow-hidden"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={(item.data as Photo).caption ?? ""}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      {(item.data as Photo).caption && (
                        <p className="font-mono text-[0.72rem] opacity-60 self-center ml-2">
                          {(item.data as Photo).caption}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}