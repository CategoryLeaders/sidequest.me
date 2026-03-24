/* ── QuestionCard — feed card for question posts ── [SQ.S-W-2603-0064] */

import Link from "next/link";
import type { Question } from "@/lib/thoughts-types";
import { relativeTime } from "@/lib/microblogs";
import { ContentActions } from "@/components/shared/ContentActions";

interface Props {
  question: Question;
  username: string;
  commentCount?: number;
  isOwner?: boolean;
}

export function QuestionCard({ question, username, commentCount = 0, isOwner = false }: Props) {
  const permalink = `/${username}/thoughts/${question.short_id}`;
  const postDate = question.published_at ?? question.created_at;

  return (
    <article
      className="border-3 border-ink bg-[var(--bg-card)] overflow-hidden relative"
      style={{ boxShadow: '4px 4px 0 #1a1a1a' }}
    >
      {isOwner && (
        <div className="absolute top-2 right-2 z-10">
          <ContentActions
            contentType="question"
            contentId={question.id}
            editData={{
              question_text: question.question_text,
              thinking: question.thinking,
              resolved: question.resolved,
              resolved_summary: question.resolved_summary,
              tags: question.tags,
              visibility: question.visibility,
            }}
          />
        </div>
      )}
      {/* Header: type badge + resolved + date */}
      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-ink/8">
        <span
          className="font-mono text-[0.58rem] font-bold uppercase tracking-widest"
          style={{ color: '#a07a00' }}
        >
          ❓ Question
        </span>
        {question.resolved && (
          <span
            className="font-mono text-[0.52rem] font-bold uppercase tracking-widest"
            style={{ color: '#2d6a4f' }}
          >
            ✓ Resolved
          </span>
        )}
        {question.pinned && (
          <span className="font-mono text-[0.55rem] text-ink/35">📌</span>
        )}
        <Link
          href={permalink}
          className="font-mono text-[0.6rem] text-ink/35 hover:text-ink/60 transition-colors no-underline ml-auto"
        >
          <time dateTime={postDate} title={new Date(postDate).toLocaleString("en-GB")}>
            {new Date(postDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </time>
          <span className="ml-1.5 opacity-70">{relativeTime(postDate)}</span>
        </Link>
      </div>

      {/* Question text — prominent */}
      <h3 className="text-[1.05rem] font-head font-bold leading-snug px-5 pt-4 pb-1">
        {question.question_text}
      </h3>

      {/* Resolved summary */}
      {question.resolved && question.resolved_summary && (
        <div className="border-2 border-green/30 bg-green/[0.05] p-3 mx-5 mt-2 mb-1">
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
        <div className="px-5 pt-1 pb-1">
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
        <div className="flex flex-wrap gap-1.5 px-5 pt-3">
          {question.tags.map((tag) => (
            <Link
              key={tag}
              href={`/${username}/thoughts/tags/${encodeURIComponent(tag.toLowerCase())}`}
              className="inline-block text-[0.6rem] px-2 py-0.5 border border-dashed border-ink/25 text-ink/45 bg-ink/[0.04] font-mono hover:border-ink/40 hover:text-ink/60 transition-colors no-underline"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Footer — answer count prominent for questions */}
      <div className="flex items-center justify-between px-5 pt-3 pb-4 mt-1 border-t border-ink/10">
        <Link
          href={`${permalink}#comments`}
          className="text-[0.72rem] font-mono opacity-50 hover:opacity-80 transition-opacity no-underline"
        >
          💬 {commentCount} {commentCount === 1 ? "answer" : "answers"}
        </Link>
        <button
          className="text-[0.65rem] font-mono opacity-25 hover:opacity-55 transition-opacity"
          title="Copy link"
        >
          🔗
        </button>
      </div>
    </article>
  );
}
