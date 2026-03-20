/* ── CommentThread — comment display for individual post page ── [SQ.S-W-2603-0062] */

import type { MicroblogComment, MiniProfile } from "@/lib/microblogs";

type CommentWithProfile = MicroblogComment & { mini_profile?: MiniProfile };

interface Props {
  comments: CommentWithProfile[];
  authorProfileId: string;
}

export function CommentThread({ comments, authorProfileId }: Props) {
  // Separate top-level and replies
  const topLevel = comments.filter((c) => !c.parent_comment_id);
  const replies = comments.filter((c) => c.parent_comment_id);

  const repliesFor = (parentId: string) =>
    replies.filter((r) => r.parent_comment_id === parentId);

  return (
    <div className="space-y-4">
      {topLevel.map((comment) => (
        <div key={comment.id}>
          <CommentBubble
            comment={comment}
            isAuthor={comment.user_id === authorProfileId}
          />
          {/* Max 1-level deep replies */}
          {repliesFor(comment.id).length > 0 && (
            <div className="ml-8 mt-2 space-y-2 border-l-2 border-ink/10 pl-4">
              {repliesFor(comment.id).map((reply) => (
                <CommentBubble
                  key={reply.id}
                  comment={reply}
                  isAuthor={reply.user_id === authorProfileId}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CommentBubble({
  comment,
  isAuthor,
}: {
  comment: CommentWithProfile;
  isAuthor: boolean;
}) {
  const name =
    comment.commenter_type === "anonymous_import"
      ? comment.anonymous_name ?? "Anonymous"
      : comment.mini_profile?.display_name ?? "Unknown";

  const avatar =
    comment.commenter_type === "anonymous_import"
      ? comment.anonymous_avatar
      : comment.mini_profile?.avatar_url;

  return (
    <div className={`flex gap-3 ${isAuthor ? "bg-ink/[0.03] p-3 -mx-3" : ""}`}>
      {/* Avatar */}
      <div className="flex-shrink-0 w-7 h-7 border-2 border-ink rounded-full overflow-hidden bg-ink/10">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[0.5rem] font-bold opacity-40">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-[0.75rem] font-bold">{name}</span>
          {isAuthor && (
            <span className="sticker sticker-blue text-[0.45rem] !px-1.5 !py-0 !border">
              Author
            </span>
          )}
          <time
            dateTime={comment.created_at}
            className="text-[0.55rem] font-mono opacity-30"
          >
            {new Date(comment.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </time>
        </div>
        <p className="text-[0.82rem] leading-snug whitespace-pre-wrap">
          {comment.body}
        </p>
      </div>
    </div>
  );
}
