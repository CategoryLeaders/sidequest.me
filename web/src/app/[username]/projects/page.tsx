const projects = [
  {
    title: "Sidequest Ventures",
    url: "sidequestventures.com",
    desc: "Angel investing in early-stage startups focused on developer tools, productivity, and creative software.",
    status: "Active",
    statusColor: "badge-green",
    stack: ["Next.js", "Notion", "Vercel"],
  },
  {
    title: "ProductLobby",
    url: "productlobby.com",
    desc: "A community for product builders to share what they're working on and find collaborators for side projects.",
    status: "Building",
    statusColor: "badge-orange",
    stack: ["Next.js", "Supabase", "Tailwind"],
  },
  {
    title: "Category Leaders",
    url: "categoryleaders.co.uk",
    desc: "Boutique consultancy helping B2B SaaS companies nail their positioning, messaging, and go-to-market.",
    status: "Active",
    statusColor: "badge-green",
    stack: ["Webflow", "Notion", "Figma"],
  },
  {
    title: "sidequest.me",
    url: "sidequest.me",
    desc: "This very website. A personal homepage that consolidates everything in one self-owned corner of the internet.",
    status: "Building",
    statusColor: "badge-orange",
    stack: ["Next.js", "Notion CMS", "Vercel"],
  },
];

const rotations = ["-0.3deg", "0.4deg", "-0.2deg", "0.5deg"];

export default function ProjectsPage() {
  return (
    <main className="max-w-[1100px] mx-auto px-8 py-12 relative">
      <div
        className="doodle"
        style={{ width: 70, height: 70, top: 60, right: -10 }}
      />

      <h1 className="font-head font-[900] text-[clamp(1.8rem,4vw,2.8rem)] uppercase leading-[0.95] mb-2">
        Projects
      </h1>
      <p className="text-[0.95rem] opacity-60 mb-8">
        Things I&apos;m building, investing in, and tinkering with.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {projects.map((project, i) => (
          <div
            key={project.title}
            className="border-3 border-ink p-6 bg-white card-hover"
            style={{ transform: `rotate(${rotations[i]})` }}
          >
            <div className="flex justify-between items-start mb-3">
              <h2 className="font-head font-bold text-[1.1rem] uppercase">
                {project.title}
              </h2>
              <span className={`badge ${project.statusColor}`}>
                {project.status}
              </span>
            </div>
            <a
              href={`https://${project.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[0.7rem] text-orange no-underline border-b border-orange/40 hover:border-orange"
            >
              {project.url}
            </a>
            <p className="text-[0.88rem] opacity-70 leading-snug mt-3 mb-4">
              {project.desc}
            </p>
            <div className="flex gap-2 flex-wrap">
              {project.stack.map((tech) => (
                <span
                  key={tech}
                  className="font-mono text-[0.6rem] px-2 py-0.5 border border-ink/20 opacity-50"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        ))}

        {/* Add Project Card */}
        <div
          className="border-3 border-dashed border-ink p-6 flex flex-col items-center justify-center opacity-35 hover:opacity-70 transition-opacity cursor-pointer min-h-[200px]"
          style={{ transform: "rotate(-0.4deg)" }}
        >
          <span className="font-head font-[900] text-4xl mb-2">+</span>
          <span className="font-head font-bold text-[0.85rem] uppercase">
            Next sidequest...
          </span>
        </div>
      </div>
    </main>
  );
}
