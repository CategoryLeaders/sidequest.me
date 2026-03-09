import { Company } from "@/lib/career-data";
import Tags from "./Tags";
import Blurb from "./Blurb";
import TubeMap from "./TubeMap";
import LogoImage from "./LogoImage";

export default function CareerCard({ company }: { company: Company }) {
  const c = company;
  return (
    <div className="pro-card">
      <div className="pro-accent" style={{ background: c.brandColour }} />
      <div className="pro-card-inner">
        <div className="pro-card-header">
          <div
            className="pro-logo pro-logo-multi"
            style={{ borderColor: c.brandColour, color: c.brandColour }}
          >
            <LogoImage src={c.logo} alt={c.name} fallbackText={c.logoText} size={34} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="pro-company-name">{c.name}</div>
            {c.subLine && (
              <div className="pro-company-sub">{c.subLine}</div>
            )}
          </div>
          <Tags tags={c.tags} />
        </div>

        {c.stations && <TubeMap stations={c.stations} />}

        <Blurb left={c.blurbLeft} right={c.blurbRight} />
      </div>
    </div>
  );
}
