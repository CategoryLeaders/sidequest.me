/* ── TagChip — unified tag component replacing 3 separate systems ── */

import Link from "next/link";

type Variant = "default" | "sticker" | "muted";

interface Props {
  label: string;
  /** Link destination when tag is clickable */
  href?: string;
  variant?: Variant;
  /** Color name for sticker variant (orange, green, pink, blue, yellow, lilac) */
  color?: string;
  /** Active/selected state */
  active?: boolean;
  className?: string;
}

const variantStyles: Record<Variant, { base: string; active: string }> = {
  // Current microblog/bookmark/quote style — dashed border, transparent bg
  default: {
    base: "inline-block text-[var(--text-xs)] px-2 py-0.5 border border-dashed border-ink/25 text-ink/45 bg-ink/[0.04] font-mono hover:border-ink/40 hover:text-ink/60 transition-colors",
    active:
      "inline-block text-[var(--text-xs)] px-2 py-0.5 border border-dashed border-ink/60 text-ink/80 bg-ink/[0.08] font-mono transition-colors",
  },
  // Current writings/filter style — colored sticker with optional rotation
  sticker: {
    base: "sticker text-[var(--text-xs)] !px-2.5 !py-1 !border-2",
    active:
      "sticker text-[var(--text-xs)] !px-2.5 !py-1 !border-2 ring-2 ring-ink/30 ring-offset-2",
  },
  // Professional/conservative style — inverted, no rotation
  muted: {
    base: "inline-block font-mono text-[var(--text-xs)] uppercase tracking-wide px-2.5 py-0.5 bg-ink text-[var(--cream)] border-none",
    active:
      "inline-block font-mono text-[var(--text-xs)] uppercase tracking-wide px-2.5 py-0.5 bg-ink text-[var(--cream)] border-none ring-2 ring-ink/30 ring-offset-2",
  },
};

export function TagChip({
  label,
  href,
  variant = "default",
  color,
  active = false,
  className = "",
}: Props) {
  const styles = variantStyles[variant];
  const baseClass = active ? styles.active : styles.base;
  const colorClass = variant === "sticker" && color ? `sticker-${color}` : "";
  const fullClass = `${baseClass} ${colorClass} ${className}`.trim();
  const display = variant === "default" ? `#${label}` : label;

  if (href) {
    return (
      <Link href={href} className={`${fullClass} no-underline`}>
        {display}
      </Link>
    );
  }

  return <span className={fullClass}>{display}</span>;
}
