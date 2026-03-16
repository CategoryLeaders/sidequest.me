import type { Company } from "@/lib/companies";
import Tags from "./Tags";
import Blurb from "./Blurb";
import TubeMap from "./TubeMap";
import LogoImage from "./LogoImage";
import RelatedWritings from "./RelatedWritings";

interface CareerCardProps {
  company: Company;
  username: string;
  writingCount: number;
}

export default function CareerCard({ company, username, writingCount }: CareerCardProps) {
  const c = company;
  return (
    <div className="pro-card">
      <div className="pro-accent" style={{ background: c.brand_colour ?? undefined }} />
      <div className="pro-card-inner">
        <div className="pro-card-header">
          <div
            className="pro-logo pro-logo-multi"
            style={{ borderColor: c.brand_colour ?? undefined, color: c.brand_colour ?? undefined }}
          >
            <LogoImage src={c.logo ?? ""} alt={c.name} fallbackText={c.logo_text ?? ""} size={34} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="pro-company-name">{c.name}</div>
            {c.sub_line && (
              <div className="pro-company-sub">{c.sub_line}</div>
            )}
          </div>
          <Tags tags={c.tags} />
        </div>

        {c.roles && c.roles.length > 0 && <TubeMap roles={c.roles} />}

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
