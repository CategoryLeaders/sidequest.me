/* ── ProjectBadge — shows project association on cards ── */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Project {
  slug: string;
  name: string;
  status?: string;
}

interface Props {
  project: Project;
  username: string;
  className?: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green",
  paused: "bg-yellow",
  complete: "bg-ink/30",
  idea: "bg-lilac",
};

export function ProjectBadge({ project, username, className = "" }: Props) {
  const pathname = usePathname();
  const projectPath = `/${username}/projects`;

  // Hide when viewing the project's own page
  if (pathname?.startsWith(`${projectPath}/${project.slug}`)) {
    return null;
  }

  const dotColor = STATUS_COLORS[project.status ?? ""] ?? "bg-ink/30";

  return (
    <Link
      href={`${projectPath}/${project.slug}`}
      className={`inline-flex items-center gap-1.5 text-[var(--text-xs)] font-mono opacity-50 hover:opacity-80 transition-opacity no-underline ${className}`}
    >
      <span className={`w-1.5 h-1.5 ${dotColor} flex-shrink-0`} />
      <span>{project.name}</span>
    </Link>
  );
}
