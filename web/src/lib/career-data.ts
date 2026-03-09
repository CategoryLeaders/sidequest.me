/* ── Career data for Professional page ── */

export type Tag = {
  label: string;
  type: "rect" | "loz";
};

export type Station = {
  idx: number;
  role: string;
  dates: string;
  discipline: "commercial" | "product" | "marketing";
  track: 1 | 2 | 3; // 1=left(commercial), 2=middle(marketing), 3=right(product)
  year: string; // year label for left column
};

export type Company = {
  name: string;
  logo: string; // path to SVG in /public/logos/
  logoText: string; // fallback text for logo placeholder
  brandColour: string;
  type: "multi" | "single";
  subLine?: string; // e.g. "Enterprise Software · 2013–2020"
  roleTitle?: string; // single-role only
  roleDates?: string; // single-role only
  tags: Tag[];
  stations?: Station[]; // multi-role only
  blurbLeft: { heading: string; content: string };
  blurbRight: { heading: string; content: string | string[] };
};

export const companies: Company[] = [
  {
    name: "Hack The Box",
    logo: "/logos/hackthebox.svg",
    logoText: "HTB",
    brandColour: "#9FEF00",
    type: "single",
    roleTitle: "Senior Director, Product Marketing",
    roleDates: "2025 – Present",
    tags: [
      { label: "B2B SaaS", type: "rect" },
      { label: "Cybersecurity", type: "rect" },
      { label: "Marketing", type: "loz" },
      { label: "Strategy", type: "loz" },
    ],
    blurbLeft: {
      heading: "The Opportunity",
      content:
        "Led product marketing for the world's largest cybersecurity upskilling platform. Built positioning, GTM, and competitive strategy.",
    },
    blurbRight: {
      heading: "Some Stuff I Did There",
      content: [
        "Repositioned enterprise platform",
        "Built competitive intelligence programme",
        "Launched new pricing and packaging",
      ],
    },
  },
  {
    name: "Category Leaders",
    logo: "/logos/categoryleaders.png",
    logoText: "CL",
    brandColour: "#E91E63",
    type: "single",
    roleTitle: "Analyst Relations & Marketing Strategy Consultant",
    roleDates: "2023 – 2025",
    tags: [
      { label: "Consulting", type: "rect" },
      { label: "Analyst Relations", type: "rect" },
      { label: "Strategy", type: "loz" },
      { label: "GTM", type: "loz" },
    ],
    blurbLeft: {
      heading: "The Opportunity",
      content:
        "Independent consulting on go-to-market strategy, product marketing, and analyst relations for B2B tech companies.",
    },
    blurbRight: {
      heading: "Some Stuff I Did There",
      content: [
        "GTM strategy for early-stage startups",
        "Analyst relations programmes",
        "Product positioning workshops",
      ],
    },
  },
  {
    name: "Signal AI",
    logo: "/logos/signalai.svg",
    logoText: "SA",
    brandColour: "#0066FF",
    type: "single",
    roleTitle: "VP Marketing",
    roleDates: "2020 – 2022",
    tags: [
      { label: "B2B SaaS", type: "rect" },
      { label: "AI / NLP", type: "rect" },
      { label: "Marketing", type: "loz" },
      { label: "Strategy", type: "loz" },
    ],
    blurbLeft: {
      heading: "The Opportunity",
      content:
        "Led marketing at an AI-powered media intelligence startup through Series B growth. Built brand, demand gen, and comms.",
    },
    blurbRight: {
      heading: "Some Stuff I Did There",
      content: [
        "Rebuilt brand from scratch",
        "Scaled inbound pipeline 4x",
        "Led comms through funding round",
      ],
    },
  },
  {
    name: "1E",
    logo: "/logos/1e.svg",
    logoText: "1E",
    brandColour: "#F7941D",
    type: "multi",
    subLine: "Enterprise Software · 2005–2020",
    tags: [
      { label: "B2B SaaS", type: "rect" },
      { label: "Enterprise", type: "rect" },
      { label: "IT Ops", type: "loz" },
      { label: "DEX", type: "loz" },
    ],
    stations: [
      { idx: 0, role: "Pre-Sales Consultant", dates: "2005–2006", discipline: "commercial", track: 1, year: "2005" },
      { idx: 1, role: "Head of Pre-Sales", dates: "2006–2008", discipline: "commercial", track: 1, year: "2006" },
      { idx: 2, role: "Product Manager", dates: "2008–2009", discipline: "product", track: 3, year: "2008" },
      { idx: 3, role: "Senior Product Manager", dates: "2009–2010", discipline: "product", track: 3, year: "2009" },
      { idx: 4, role: "Head of Product", dates: "2010–2011", discipline: "product", track: 3, year: "2010" },
      { idx: 5, role: "VP Product", dates: "2011–2012", discipline: "product", track: 3, year: "2011" },
      { idx: 6, role: "VP Technology", dates: "2012–2013", discipline: "product", track: 3, year: "2012" },
      { idx: 7, role: "Solutions Engineer", dates: "2013–2014", discipline: "commercial", track: 1, year: "2013" },
      { idx: 8, role: "Solutions Engineering Lead", dates: "2014–2015", discipline: "commercial", track: 1, year: "2014" },
      { idx: 9, role: "Product Manager", dates: "2015–2016", discipline: "product", track: 3, year: "2015" },
      { idx: 10, role: "Senior Product Manager", dates: "2016–2017", discipline: "product", track: 3, year: "2016" },
      { idx: 11, role: "Product Marketing Manager", dates: "2017–2018", discipline: "marketing", track: 2, year: "2017" },
      { idx: 12, role: "Senior Product Marketing Mgr", dates: "2018–2019", discipline: "marketing", track: 2, year: "2018" },
      { idx: 13, role: "VP Product Marketing", dates: "2019–2020", discipline: "marketing", track: 2, year: "2019" },
    ],
    blurbLeft: {
      heading: "The Opportunity",
      content:
        "Joined as a Pre-Sales Consultant and worked across commercial, product, and marketing over 15 years — ending up as VP Product Marketing. A proper career within a career.",
    },
    blurbRight: {
      heading: "Some Stuff I Did There",
      content: [
        "Built the SE function from scratch",
        "Launched Tachyon to market",
        "Led product marketing through rebrand",
      ],
    },
  },
  {
    name: "Brandwatch",
    logo: "/logos/brandwatch.svg",
    logoText: "BW",
    brandColour: "#FF6B35",
    type: "multi",
    subLine: "Social Analytics · 2010–2012",
    tags: [
      { label: "B2B SaaS", type: "rect" },
      { label: "Analytics", type: "rect" },
      { label: "Social", type: "loz" },
      { label: "Data", type: "loz" },
    ],
    stations: [
      { idx: 0, role: "Head of Product", dates: "2010–2011", discipline: "product", track: 3, year: "2010" },
      { idx: 1, role: "VP of Data", dates: "2011–2012", discipline: "product", track: 3, year: "2011" },
    ],
    blurbLeft: {
      heading: "The Opportunity",
      content:
        "Early-stage social analytics company where I cut my teeth in B2B marketing. Brilliant team, brilliant product.",
    },
    blurbRight: {
      heading: "Some Stuff I Did There",
      content: [
        "Built early marketing function",
        "Event and content strategy",
        "Helped shape product positioning",
      ],
    },
  },
  {
    name: "Cumbria Police",
    logo: "/logos/cumbriapolice.png",
    logoText: "CP",
    brandColour: "#003366",
    type: "single",
    roleTitle: "IT Operations",
    roleDates: "2003 – 2005",
    tags: [
      { label: "Public Sector", type: "rect" },
      { label: "IT Ops", type: "loz" },
    ],
    blurbLeft: {
      heading: "The Opportunity",
      content:
        "IT Operations team at Cumbria Police. Built the technical foundations that shaped everything that followed.",
    },
    blurbRight: {
      heading: "Some Stuff I Did There",
      content: [
        "IT operations and support",
        "Infrastructure management",
        "Technical foundations",
      ],
    },
  },
  {
    name: "Business Serve",
    logo: "/logos/businessserve.svg",
    logoText: "BS",
    brandColour: "#666666",
    type: "single",
    roleTitle: "Customer Success → Product Dev → IT Manager",
    roleDates: "2001 – 2003",
    tags: [
      { label: "Early Career", type: "rect" },
      { label: "Foundations", type: "loz" },
    ],
    blurbLeft: {
      heading: "The Opportunity",
      content:
        "Started in customer success, moved into product development, then internal IT management. The progression that sparked a career in product.",
    },
    blurbRight: {
      heading: "Some Stuff I Did There",
      content: [
        "Customer success and support",
        "Product development",
        "Internal IT management",
      ],
    },
  },
];

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
