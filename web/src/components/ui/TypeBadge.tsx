/* ── TypeBadge — content type indicator sticker ── */

const TYPE_CONFIG = {
  microblog: { label: "Microblog", color: "sticker-orange", emoji: "" },
  changelog: { label: "Changelog", color: "sticker-blue", emoji: "📋 " },
  bookmark: { label: "Bookmark", color: "sticker-green", emoji: "🔖 " },
  quote: { label: "Quote", color: "sticker-lilac", emoji: "💬 " },
  question: { label: "Question", color: "sticker-yellow", emoji: "❓ " },
  writing: { label: "Writing", color: "sticker-blue", emoji: "✍️ " },
  adventure: { label: "Adventure", color: "sticker-pink", emoji: "🗺️ " },
  project: { label: "Project", color: "sticker-orange", emoji: "" },
} as const;

export type ContentType = keyof typeof TYPE_CONFIG;

interface Props {
  type: ContentType;
  className?: string;
}

export function TypeBadge({ type, className = "" }: Props) {
  const config = TYPE_CONFIG[type];

  return (
    <span
      className={`sticker ${config.color} text-[var(--text-2xs)] !px-2 !py-0.5 !border-2 ${className}`}
    >
      {config.emoji}{config.label}
    </span>
  );
}

/** Get the sticker color class for a content type */
export function getTypeColor(type: ContentType): string {
  return TYPE_CONFIG[type].color;
}
