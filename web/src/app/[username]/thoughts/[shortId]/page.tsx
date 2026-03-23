/* ── Individual microblog post page ── [SQ.S-W-2603-0062] */

import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getPostByShortId, getPostComments, relativeTime, getPostDate } from "@/lib/microblogs";
import type { MicroblogPostWithCounts } from "@/lib/microblogs";
import { ReactionBar } from "@/components/microblog/ReactionBar";
import { CommentThread } from "@/components/microblog/CommentThread";

interface Props {
  params: Promise<{ username: string; shortId: string }>;
}

export default async function MicroblogPostPage({ params }: Props) {
  const { username, shortId } = await params;
  const supabase = await createClient();

  // Resolve profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = (await (supabase as any)
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", username)
    .single()) as {
    data: { id: string; username: string; display_name: string } | null;
  };

  if (!profile) notFound();

  // Check if this is a writing slug rather than a microblog short_id
  // Writings use alphabetic slugs; microblog short_ids are 4-char alphanumeric
  // If shortId is longer than 6 chars, it's almost certainly a writing slug — pass through
  if (shortId.length > 6) {
    notFound(); // Next.js will fall through to other routes or 404
  }

  const post = await getPostByShortId(profile.id, shortId);
  if (!post) notFound();

  // Auth check: private/unlisted posts only visible to owner
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === profile.id;

  if (post.visibility === "private" && !isOwner) notFound();
  // Unlisted posts are viewable by anyone with the link, but not indexed

  const comments = post.comments_enabled
    ? await getPostComments(post.id)
    : [];

  const postDate = getPostDate(post);

  return (
    <main className="max-w-[800px] mx-auto px-8 py-12 relative">
      {/* Breadcrumb */}
      <nav className="mb-6 text-[0.7rem] font-mono opacity-40">
        <Link
          href={`/${username}/thoughts`}
          className="hover:opacity-70 transition-opacity no-underline"
        >
          ← Thoughts
        </Link>
      </nav>

      <article className="border-3 border-ink p-6 bg-[var(--bg-card)]">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="sticker sticker-orange text-[0.55rem] !px-2 !py-0.5 !border-2">
            Microblog
          </span>
          {post.source !== "native" && (
            <span className="text-[0.55rem] font-mono opacity-30">
              via{" "}
              {post.source === "facebook_import" ? "Facebook" : "Telegram"}
            </span>
          )}
          {post.pinned && (
            <span className="text-[0.55rem] font-mono opacity-40 ml-auto">
              📌 Pinned
            </span>
          )}
        </div>

        {/* Body */}
        {post.body_html ? (
          <div
            className="text-[1rem] leading-relaxed mb-4 prose prose-a:text-[var(--orange)] prose-a:underline"
            dangerouslySetInnerHTML={{ __html: post.body_html }}
          />
        ) : (
          <p className="text-[1rem] leading-relaxed mb-4 whitespace-pre-wrap">
            {post.body}
          </p>
        )}

        {/* Images */}
        {post.images.length > 0 && (
          <div
            className={`grid gap-3 mb-4 ${
              post.images.length === 1
                ? "grid-cols-1"
                : "grid-cols-2"
            }`}
          >
            {post.images.slice(0, 4).map((img, i) => (
              <div
                key={i}
                className="border-2 border-ink overflow-hidden relative"
                style={{
                  aspectRatio:
                    img.width && img.height
                      ? `${img.width}/${img.height}`
                      : "4/3",
                }}
              >
                <Image
                  src={img.url}
                  alt={img.alt_text ?? ""}
                  fill
                  className="object-cover"
                  sizes="(max-width: 800px) 100vw, 800px"
                />
              </div>
            ))}
          </div>
        )}

        {/* Link preview */}
        {post.link_url && post.link_preview && (
          <a
            href={post.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block border-2 border-ink/30 p-4 mb-4 bg-ink/[0.03] hover:bg-ink/[0.06] transition-colors no-underline"
          >
            <span className="text-[0.7rem] font-mono opacity-40 block mb-1">
              {post.link_preview.domain}
            </span>
            <span className="text-[0.95rem] font-bold block mb-1">
              {post.link_preview.title}
            </span>
            {post.link_preview.description && (
              <span className="text-[0.82rem] opacity-60 block">
                {post.link_preview.description}
              </span>
            )}
          </a>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/${username}/thoughts/tags/${encodeURIComponent(tag.toLowerCase())}`}
                className="inline-block text-[0.65rem] px-2.5 py-0.5 border border-dashed border-ink/25 text-ink/45 bg-ink/[0.04] font-mono hover:border-ink/40 hover:text-ink/60 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Paired writing */}
        {post.paired_writing_id && (post as any).paired_writing_slug && (
          <Link
            href={`/${username}/writings/${(post as any).paired_writing_slug}`}
            className="text-[0.85rem] text-[var(--orange)] font-mono mb-4 block hover:underline"
          >
            Read the full article →
          </Link>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-ink/10">
          <div className="flex items-center gap-3">
            <time
              dateTime={postDate}
              className="text-[0.7rem] font-mono opacity-40"
              title={new Date(postDate).toLocaleString("en-GB")}
            >
              {new Date(postDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {" · "}
              {relativeTime(postDate)}
            </time>
            {post.edited_at && (
              <span
                className="text-[0.6rem] font-mono opacity-30"
                title={`Edited ${new Date(post.edited_at).toLocaleString("en-GB")}`}
              >
                (edited)
              </span>
            )}
          </div>

          {/* Reactions */}
          {post.reactions_enabled && (
            <ReactionBar counts={post.reaction_counts} />
          )}
        </div>

        {/* Visibility notice for owner */}
        {isOwner && post.visibility !== "public" && (
          <div className="mt-3 text-[0.65rem] font-mono opacity-40 border border-dashed border-ink/20 px-3 py-1.5">
            🔒 This post is {post.visibility}
          </div>
        )}
      </article>

      {/* Comments section */}
      {post.comments_enabled && (
        <section id="comments" className="mt-8">
          <h2 className="font-head font-bold text-[0.9rem] uppercase mb-4">
            Comments
            {comments.length > 0 && (
              <span className="font-mono font-normal text-[0.7rem] opacity-40 ml-2">
                ({comments.length})
              </span>
            )}
          </h2>

          {comments.length > 0 ? (
            <CommentThread
              comments={comments}
              authorProfileId={profile.id}
            />
          ) : (
            <p className="text-[0.82rem] opacity-40 font-mono">
              No comments yet.
            </p>
          )}

          {/* Comment input placeholder — requires auth, will be client component */}
          <div className="mt-6 border-2 border-dashed border-ink/15 p-4 text-center">
            <p className="text-[0.78rem] opacity-40 font-mono">
              Sign in to leave a comment
            </p>
          </div>
        </section>
      )}

      {!post.comments_enabled && (
        <div className="mt-6 text-[0.75rem] opacity-30 font-mono text-center">
          Comments are closed on this post.
        </div>
      )}
    </main>
  );
}
