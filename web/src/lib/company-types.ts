/* ── Company types & constants — safe for client and server ── */

export type CompanyTag = {
  label: string;
  type: "rect" | "loz";
};

export type CompanyRole = {
  id: string;
  company_id: string;
  role: string;
  dates: string | null;
  discipline: "commercial" | "product" | "marketing" | null;
  track: number | null;
  year: string | null;
  sort_order: number;
};

export type Company = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  logo: string | null;
  logo_text: string | null;
  brand_colour: string | null;
  type: "multi" | "single";
  sub_line: string | null;
  role_title: string | null;
  role_dates: string | null;
  tags: CompanyTag[];
  blurb_left: { heading: string; content: string } | null;
  blurb_right: { heading: string; content: string | string[] } | null;
  sort_order: number;
  roles?: CompanyRole[];
};

export const DISCIPLINE_COLOURS: Record<string, string> = {
  commercial: "#E53935",
  product: "#1E88E5",
  marketing: "#43A047",
};

export const TRACK_LABELS = [
  { track: 1, label: "Commercial", colour: "#E53935" },
  { track: 2, label: "Marketing", colour: "#43A047" },
  { track: 3, label: "Product", colour: "#1E88E5" },
];
