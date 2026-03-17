import { notFound } from "next/navigation";
import Link from "next/link";
import { getProfileByUsername } from "@/lib/profiles";
import { getProjectsForUser } from "@/lib/projects-data";
import { countWritingsForEntities } from "@/lib/writing-links";

const rotations = ["-0.3deg", "0.4deg", "-0.2deg", "0.5deg", "-0.4deg"];

interface ProjectsPageProps {
  params: Promise<{ username: string }>;
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const projects = await getProjectsForUser(profile.id);

  // Batch-fetch related writing counts
  const writingCounts = await countWritingsForEntities(
    "project",
    projects.map((p) => p.id)
  );

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
        {projects.map((project, i) => {
          const wCount = writingCounts.get(project.id) ?? 0;
          return (
            <div
              key={project.id}
              className="border-3 border-ink p-6 bg-bg-card card-hover"
              style={{ transform: `rotate(${rotations[i % rotations.length]})` }}
            >
              <div className="flex justify-between items-start mb-3">
                <h2 className="font-head font-bold text-[1.1rem] uppercase">
                  {project.title}
                </h2>
                <span className={`badge ${project.status_color ?? "badge-green"}`}>
                  {project.status}
                </span>
              </div>
              {project.url && (
                <a
                  href={`https://${project.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[0.7rem] text-orange no-underline border-b border-orange/40 hover:border-orange"
                >
                  {project.url}
                </a>
              )}
              <p className="text-[0.88rem] opacity-70 leading-snug mt-3 mb-4">
                {project.description}
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
              {wCount > 0 && (
                <div className="mt-3 pt-3 border-t border-ink/10">
                  <Link
                    href={`/${username}/writings?project=${project.slug}`}
                    className="font-mono text-[0.65rem] font-semibold uppercase text-orange no-underline opacity-60 hover:opacity-100 transition-opacity"
                  >
                    {wCount} related {wCount === 1 ? "writing" : "writings"}
                  </Link>
                </div>
              )}
            </div>
          );
        })}

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
