import { notFound } from "next/navigation";
import { getCompaniesForUser } from "@/lib/companies";
import { countWritingsForEntities } from "@/lib/writing-links";
import { getProfileByUsername } from "@/lib/profiles";
import CareerCard from "@/components/professional/CareerCard";
import SingleRoleCard from "@/components/professional/SingleRoleCard";

/**
 * Professional page — career journey + optional professional name & LinkedIn.
 * Now reads companies from Supabase, with related writing counts.
 * [SQ.S-W-2603-0038]
 */

interface ProfessionalPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ProfessionalPageProps) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  const name = profile?.professional_name ?? profile?.display_name ?? username;
  return {
    title: `Professional — ${name} | sidequest.me`,
    description: `${name} — Career journey across product, marketing, and commercial roles.`,
  };
}

export default async function ProfessionalPage({ params }: ProfessionalPageProps) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  const heading = profile.professional_name ?? profile.display_name ?? username;
  const companies = await getCompaniesForUser(profile.id);

  // Batch-fetch related writing counts for all companies
  const writingCounts = await countWritingsForEntities(
    "company",
    companies.map((c) => c.id)
  );

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1
        style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 900,
          fontSize: "2rem",
          textTransform: "uppercase",
          letterSpacing: "0.02em",
          marginBottom: "0.5rem",
        }}
      >
        {heading}
      </h1>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "1.05rem",
            color: "#555",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          My career journey — from solutions engineering through product
          management to product marketing leadership.
        </p>

        {profile.linkedin_url && (
          <a
            href={profile.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              textDecoration: "none",
              color: "var(--ink)",
              border: "3px solid var(--ink)",
              padding: "0.4rem 0.8rem",
              whiteSpace: "nowrap",
              transition: "box-shadow 0.15s",
            }}
            className="hover:shadow-[3px_3px_0_var(--ink)]"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            LinkedIn
          </a>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {companies.map((c) =>
          c.type === "multi" ? (
            <CareerCard key={c.id} company={c} username={username} writingCount={writingCounts.get(c.id) ?? 0} />
          ) : (
            <SingleRoleCard key={c.id} company={c} username={username} writingCount={writingCounts.get(c.id) ?? 0} />
          )
        )}
      </div>
    </main>
  );
}
