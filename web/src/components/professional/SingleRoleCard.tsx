import { Company } from "@/lib/career-data";
import Tags from "./Tags";
import Blurb from "./Blurb";
import LogoImage from "./LogoImage";

export default function SingleRoleCard({ company }: { company: Company }) {
  const c = company;
  return (
    <div className="pro-card">
      <div className="pro-accent" style={{ background: c.brandColour }} />
      <div className="pro-card-inner">
        <div className="pro-card-header">
          <div
            className="pro-logo pro-logo-single"
            style={{ borderColor: c.brandColour, color: c.brandColour }}
          >
            <LogoImage src={c.logo} alt={c.name} fallbackText={c.logoText} size={30} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="pro-company-name">{c.name}</div>
            <div className="tm-label">
              <span className="tm-role">{c.roleTitle}</span>
              <br />
              <span className="tm-date">{c.roleDates}</span>
            </div>
          </div>
          <Tags tags={c.tags} />
        </div>
        <Blurb left={c.blurbLeft} right={c.blurbRight} />
      </div>
    </div>
  );
}
