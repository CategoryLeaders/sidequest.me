import { companies } from "@/lib/career-data";
import CareerCard from "@/components/professional/CareerCard";
import SingleRoleCard from "@/components/professional/SingleRoleCard";

export const metadata = {
  title: "Professional | sidequest.me",
  description: "Sophie Collins — Career journey across product, marketing, and commercial roles.",
};

export default function ProfessionalPage() {
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
        Professional
      </h1>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "1.05rem",
          color: "#555",
          marginBottom: "2rem",
          lineHeight: 1.5,
        }}
      >
        My career journey — from solutions engineering through product
        management to product marketing leadership.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {companies.map((c) =>
          c.type === "multi" ? (
            <CareerCard key={c.name} company={c} />
          ) : (
            <SingleRoleCard key={c.name} company={c} />
          )
        )}
      </div>
    </main>
  );
}
