import type { Company } from "@/lib/companies";
import Tags from "./Tags";
import Blurb from "./Blurb";
import LogoImage from "./LogoImage";
import RelatedWritings from "./RelatedWritings";

interface SingleRoleCardProps {
  company: Company;
  username: string;
  writingCount: number;
}

export default function SingleRoleCard({ company, username, writingCount }: SingleRoleCardProps) {
  const c = company;
  return (
    <div className="pro-card">
      <div className="pro-accent" style={{ background: c.brand_colour ?? undefined }} />
      <div className="pro-card-inner">
        <div className="pro-card-header">
          <div
            className="pro-logo pro-logo-single"
            style={{ borderColor: c.brand_colour ?? undefined, color: c.brand_colour ?? undefined }}
          >
            <LogoImage src={c.logo ?? ""} alt={c.name} fallbackText={c.logo_text ?? ""} size={30} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="pro-company-name">{c.name}</div>
            <div className="tm-label">
              <span className="tm-role">{c.role_title}</span>
              <br />
              <span className="tm-date">{c.role_dates}</span>
            </div>
          </div>
          <Tags tags={c.tags} />
        </div>
        <Blurb left={c.blurb_left} right={c.blurb_right} />

        {writingCount > 0 && (
          <RelatedWritings
            count={writingCount}
            companySlug={c.slug}
            companyName={c.name}
            username={username}
            brandColour={c.brand_colour}
          />
        )}
      </div>
    </div>
  );
}
