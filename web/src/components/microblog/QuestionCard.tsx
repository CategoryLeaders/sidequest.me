/* ── QuestionCard — feed card for question posts ── [SQ.S-W-2603-0064] */

import Link from "next/link";
import type { Question } from "@/lib/thoughts-types";
import { relativeTime } from "@/lib/microblogs";

interface Props {
  question: Question;
  username: string;
  commentCount?: number;
}

export function QuestionCard({ question, username, commentCount = 0 }: Props) {
  const permalink = `/${username}/thoughts/${question.short_id}`;
  const postDate = question.published_at ?? question.created_at;

  return (
    <article className="border-3 border-ink p-5 bg-[var(--bg-card)]">
      {/* Type badge + resolved status */}
      <div className="flex items-center gap-2 mb-3">
        <span className="sticker sticker-yellow text-[0.55rem] !px-2 !py-0.5 !border-2">
          ❓ Question
        </span>
        {question.resolved && (
          <span className="sticker sticker-green text-[0.5rem] !px-2 !py-0.5 !border-2">
            ✓ Resolved
          </span>
        )}
        {question.pinned && (
          <span className="text-[0.55rem] font-mono opacity-40 ml-auto">📌 Pinned</span>
        )}
      </div>

      {/* Question text — prominent */}
      <h3 className="text-[1.05rem] font-head font-bold leading-snug mb-3">
        {question.question_text}
      </h3>

      {/* Resolved summary */}
      {question.resolved && question.resolved_summary && (
        <div className="border-2 border-green/30 bg-green/[0.05] p-3 mb-3">
          <p className="text-[0.7rem] font-mono font-bold opacity-50 mb-1 uppercase">
            Resolution
          </p>
          <p className="text-[0.82rem] leading-relaxed">
            {question.resolved_summary}
          </p>
        </div>
      )}

      {/* Author's thinking */}
      {question.thinking && !question.resolved && (
        <div className="mb-3">
          <p className="text-[0.65rem] font-mono opacity-40 mb-1 uppercase">
            My thinking so far:
          </p>
          <p className="text-[0.82rem] opacity-60 leading-relaxed pl-3 border-l-2 border-ink/15 whitespace-pre-wrap">
            {question.thinking}
          </p>
        </div>
      )}

      {/* Tags */}
      {question.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {question.tags.map((tag) => (
            <Link
              key={tag}
              href={`/${username}/thoughts/tags/${encodeURIComponent(tag.toLowerCase())}`}
              className="inline-block text-[0.6rem] px-2 py-0.5 border border-dashed border-ink/25 text-ink/45 bg-ink/[0.04] font-mono hover:border-ink/40 hover:text-ink/60 transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Footer — comment count prominent for questions */}
      <div className="flex items-center justify-between pt-2 border-t border-ink/10">
        <Link
          href={permalink}
          className="text-[0.6rem] font-mono opacity-40 hover:opacity-70 transition-opacity no-underline"
        >
          <time dateTime={postDate} title={new Date(postDate).toLocaleString("en-GB")}>
            {relativeTime(postDate)}
          </time>
        </Link>
        <Link
          href={`${permalink}#comments`}
          className="text-[0.72rem] font-mono opacity-50 hover:opacity-80 transition-opacity no-underline"
        >
          💬 {commentCount} {commentCount === 1 ? "answer" : "answers"}
        </Link>
      </div>
    </article>
  );
}
