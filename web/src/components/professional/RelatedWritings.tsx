import Link from "next/link";

interface RelatedWritingsProps {
  count: number;
  companySlug: string;
  companyName: string;
  username: string;
  brandColour: string | null;
}

/**
 * Small footer inside a career card showing how many related writings exist.
 * Links to a filtered writings view.
 */
export default function RelatedWritings({
  count,
  companySlug,
  companyName,
  username,
  brandColour,
}: RelatedWritingsProps) {
  return (
    <div
      style={{
        marginTop: "1rem",
        paddingTop: "0.75rem",
        borderTop: "1px solid rgba(0,0,0,0.08)",
      }}
    >
      <Link
        href={`/${username}/writings?company=${companySlug}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          fontFamily: "var(--font-mono)",
          fontSize: "0.7rem",
          fontWeight: 600,
          textTransform: "uppercase",
          textDecoration: "none",
          color: brandColour ?? "var(--ink)",
          opacity: 0.7,
          transition: "opacity 0.15s",
        }}
        className="hover:opacity-100"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        {count} related {count === 1 ? "writing" : "writings"}
      </Link>
    </div>
  );
}
