/* ── ContextChip — inline link back to a related adventure or project ── */
import Link from "next/link";

interface Props {
  type: "adventure" | "project";
  title: string;
  slug: string;
  username: string;
}

const ICON: Record<Props["type"], string> = {
  adventure: "🗺",
  project: "📁",
};

const SEGMENT: Record<Props["type"], string> = {
  adventure: "adventures",
  project: "projects",
};

export function ContextChip({ type, title, slug, username }: Props) {
  return (
    <Link
      href={`/${username}/${SEGMENT[type]}/${slug}`}
      className="font-mono text-[0.6rem] opacity-50 hover:opacity-100 transition-opacity no-underline hover:underline flex items-center gap-1 shrink-0"
    >
      <span>{ICON[type]}</span>
      <span>{title}</span>
    </Link>
  );
}
