import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfileByUsername } from "@/lib/profiles";
import {
  getCrowdfundingProjectBySlug,
  getAdjacentProjects,
  getUpdatesForProject,
  getProjectEmailToken,
} from "@/lib/crowdfunding";
import {
  formatPledge,
  statusStep,
  statusHex,
  platformLabel,
  parseDeliveryDeadline,
} from "@/lib/crowdfunding-utils";
import { countWritingsForEntities } from "@/lib/writing-links";
import { getReviewForProject } from "@/lib/crowdfunding-reviews";
import { getLinksFromSource, enrichObjectLinks } from "@/lib/object-links";
import StatusPipeline from "@/components/StatusPipeline";
import ReviewDisplay from "@/components/crowdfunding/ReviewDisplay";
import LinkedObjects from "@/components/crowdfunding/LinkedObjects";
import ProjectTabs from "@/components/crowdfunding/ProjectTabs";
import UpdateStream from "@/components/crowdfunding/UpdateStream";
import EmailForwardingInfo from "@/components/crowdfunding/EmailForwardingInfo";
import ProjectDetailClient from "./ProjectDetailClient";

interface BackedProjectPageProps {
  params: Promise<{ username: string; slug: string }>;
}

export default async function BackedProjectPage({ params }: BackedProjectPageProps) {
  const { username, slug } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const project = await getCrowdfundingProjectBySlug(profile.id, slug);
  if (!project) notFound();

  // Auth — determine if viewer is the owner
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === profile.id;

  // Adjacent projects for prev/next nav
  const adjacent = await getAdjacentProjects(profile.id, project.sort_order);

  // Writing counts + review + object links + updates
  const [writingCountsMap, review, rawLinks, updates, emailToken] = await Promise.all([
    countWritingsForEntities("crowdfunding", [project.id]),
    getReviewForProject(profile.id, project.id),
    getLinksFromSource("crowdfunding", project.id),
    getUpdatesForProject(project.id),
    isOwner ? getProjectEmailToken(project.id) : Promise.resolve(null),
  ]);
  const writingCount = writingCountsMap.get(project.id) ?? 0;
  const objectLinks = await enrichObjectLinks(rawLinks, username);

  const step = statusStep(project.status);
  const hex = statusHex(project.status);

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="font-mono text-[0.6rem] uppercase opacity-40 mb-6">
        <Link href={`/${username}`} className="no-underline hover:opacity-70">
          {username}
        </Link>
        {" / "}
        <Link
          href={`/${username}/projects?tab=backed`}
          className="no-underline hover:opacity-70"
        >
          Backed
        </Link>
        {" / "}
        <span className="opacity-70">{(project as any).short_name || project.title}</span>
      </nav>

      {/* Hero image */}
      {project.image_url && (
        <div className="mb-5 border-3 border-ink" style={{ transform: "rotate(-0.4deg)" }}>
          <img
            src={project.image_url}
            alt={project.title}
            className="w-full h-auto object-contain"
          />
        </div>
      )}

      {/* Platform + Status badges */}
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-[0.55rem] font-bold uppercase px-2 py-0.5 border border-ink/20 opacity-50">
          {platformLabel(project.platform)}
        </span>
        <span
          className="font-mono text-[0.55rem] font-bold uppercase px-2 py-0.5"
          style={{
            background: `${hex}30`,
            color: hex,
            border: `1px solid ${hex}50`,
          }}
        >
          {step.label}
        </span>
      </div>

      {/* Title */}
      <h1 className="font-head font-bold text-[1.5rem] uppercase leading-tight mb-1">
        {(project as any).short_name || project.title}
      </h1>

      {/* Tagline */}
      {(project as any).tagline && (
        <p className="text-[0.9rem] italic opacity-50 leading-snug mb-3">
          {(project as any).tagline}
        </p>
      )}

      {/* Pipeline */}
      <div className="mb-4">
        <StatusPipeline status={project.status} />
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-[0.85rem] leading-relaxed mb-4 opacity-70">
          {project.description}
        </p>
      )}

      {/* Detail grid */}
      <div className="grid grid-cols-2 gap-4 mb-6 border-2 border-ink/10 p-4 bg-ink/2">
        {project.show_pledge_amount && project.pledge_amount && (
          <div>
            <span className="font-mono text-[0.55rem] uppercase opacity-40 block mb-0.5">
              Pledged
            </span>
            <span className="font-mono text-[0.95rem] font-bold">
              {formatPledge(project.pledge_amount, project.pledge_currency)}
            </span>
          </div>
        )}

        {project.reward_tier && (
          <div>
            <span className="font-mono text-[0.55rem] uppercase opacity-40 block mb-0.5">
              Reward
            </span>
            <span className="text-[0.8rem] opacity-60">{project.reward_tier}</span>
          </div>
        )}

        {project.est_delivery && (
          <div>
            <span className="font-mono text-[0.55rem] uppercase opacity-40 block mb-0.5">
              Est. Delivery
            </span>
            <span className="font-mono text-[0.8rem]">{project.est_delivery}</span>
          </div>
        )}

        {project.pledged_at && (
          <div>
            <span className="font-mono text-[0.55rem] uppercase opacity-40 block mb-0.5">
              Backed
            </span>
            <span className="font-mono text-[0.8rem]">
              {new Date(project.pledged_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        )}
      </div>

      {/* Client-side countdown timers */}
      <ProjectDetailClient project={project} />

      {/* Tags */}
      {project.tags && project.tags.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="font-mono text-[0.6rem] px-2 py-0.5 border border-ink/20 opacity-50"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Tabbed content — Updates / Review / Related */}
      <ProjectTabs
        defaultTab={updates.length > 0 ? "updates" : review ? "review" : "updates"}
        tabs={[
          {
            key: "updates",
            label: "Updates",
            count: updates.length,
            content: (
              <div>
                {isOwner && emailToken && (
                  <EmailForwardingInfo
                    emailToken={emailToken}
                    projectTitle={project.title}
                  />
                )}
                <UpdateStream updates={updates} />
              </div>
            ),
          },
          ...(review
            ? [
                {
                  key: "review",
                  label: "My Review",
                  content: <ReviewDisplay review={review} variant="full" />,
                },
              ]
            : []),
          ...(objectLinks.length > 0
            ? [
                {
                  key: "related",
                  label: "Related",
                  count: objectLinks.length,
                  content: <LinkedObjects links={objectLinks} title="" />,
                },
              ]
            : []),
        ]}
      />

      {/* Action links */}
      <div className="flex flex-col gap-2 pt-4 border-t-2 border-ink/10 mb-8">
        {project.external_url && (
          <a
            href={project.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[0.7rem] font-bold uppercase text-orange no-underline hover:opacity-70 transition-opacity"
          >
            View on {platformLabel(project.platform)} →
          </a>
        )}

        {writingCount > 0 && (
          <Link
            href={`/${username}/writings?crowdfunding=${project.slug}`}
            className="font-mono text-[0.7rem] font-bold uppercase text-orange no-underline hover:opacity-70 transition-opacity"
          >
            Read my review →
          </Link>
        )}
      </div>

      {/* Prev / Next navigation */}
      <div className="flex justify-between items-center pt-4 border-t-2 border-ink/10">
        {adjacent.prev ? (
          <Link
            href={`/${username}/backed/${adjacent.prev}`}
            className="font-mono text-[0.65rem] uppercase no-underline opacity-40 hover:opacity-70 transition-opacity"
          >
            ← Previous
          </Link>
        ) : (
          <div />
        )}
        {adjacent.next ? (
          <Link
            href={`/${username}/backed/${adjacent.next}`}
            className="font-mono text-[0.65rem] uppercase no-underline opacity-40 hover:opacity-70 transition-opacity"
          >
            Next →
          </Link>
        ) : (
          <div />
        )}
      </div>
    </main>
  );
}
