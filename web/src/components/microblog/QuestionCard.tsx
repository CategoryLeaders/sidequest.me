/* ── QuestionCard — feed card for question posts ── [SQ.S-W-2603-0064] */
"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Question } from "@/lib/thoughts-types";
import { relativeTime } from "@/lib/microblogs-utils";
import {
  CardShell,
  CardFooter,
  TypeBadge,
  TagChip,
  MetadataLine,
  EngagementBar,
} from "@/components/ui";
import { ThreeDotMenu } from "@/components/shared/ThreeDotMenu";
import { EditModal } from "@/components/shared/EditModal";
import type { SiteTag } from "@/lib/tags";

interface Props {
  question: Question;
  username: string;
  commentCount?: number;
  isOwner?: boolean;
  siteTags?: SiteTag[];
}

export function QuestionCard({ question, username, commentCount = 0, isOwner, siteTags }: Props) {
  const router = useRouter();
  const permalink = `/${username}/thoughts/${question.short_id}`;
  const postDate = question.published_at ?? question.created_at;
  const [editOpen, setEditOpen] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const handleSaved = useCallback(() => {
    setShowSaved(true);
    setTimeout(() => { setShowSaved(false); router.refresh(); }, 1500);
  }, [router]);

  return (
    <CardShell variant="standard" className="relative">
      {isOwner && (
        <div className="absolute top-3 right-3">
          <ThreeDotMenu
            contentType="question"
            contentId={question.id}
            permalink={permalink}
            onEdit={() => setEditOpen(true)}
            onDeleted={() => router.refresh()}
          />
        </div>
      )}
      {/* Type badge + resolved status */}
      <div className="flex items-center gap-2 mb-4">
        <TypeBadge type="question" />
        {question.resolved && (
          <span className="sticker sticker-green text-[0.5rem] !px-2 !py-0.5 !border-2">
            ✓ Resolved
          </span>
        )}
        {question.pinned && (
          <span className="text-[var(--text-2xs)] font-mono opacity-40 ml-auto">📌 Pinned</span>
        )}
      </div>

      {/* Question text — prominent */}
      <h3 className="text-[var(--text-md)] font-head font-bold leading-snug mb-3">
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
          <p className="text-[var(--text-xs)] font-mono opacity-40 mb-1 uppercase">
            My thinking so far:
          </p>
          <p className="text-[0.82rem] opacity-60 leading-relaxed pl-3 border-l-2 border-ink/[var(--opacity-muted)] whitespace-pre-wrap">
            {question.thinking}
          </p>
        </div>
      )}

      {/* Tags */}
      {question.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {question.tags.map((tag) => (
            <TagChip
              key={tag}
              label={tag}
              href={`/${username}/thoughts/tags/${encodeURIComponent(tag.toLowerCase())}`}
            />
          ))}
        </div>
      )}

      {/* Footer — comment count prominent for questions */}
      <CardFooter
        left={
          <MetadataLine
            items={[
              {
                label: (
                  <Link
                    href={permalink}
                    className="opacity-100 hover:opacity-70 transition-opacity no-underline"
                  >
                    <time
                      dateTime={postDate}
                      title={new Date(postDate).toLocaleString("en-GB")}
                    >
                      {relativeTime(postDate)}
                    </time>
                  </Link>
                ),
              },
            ]}
          />
        }
        right={
          <EngagementBar
            commentCount={commentCount}
            commentHref={`${permalink}#comments`}
          />
        }
      />

      {isOwner && (
        <EditModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          contentType="question"
          contentId={question.id}
          initialData={{
            question_text: question.question_text,
            thinking: question.thinking,
            resolved: question.resolved,
            resolved_summary: question.resolved_summary,
            tags: question.tags,
            visibility: question.visibility,
          }}
          onSaved={handleSaved}
          siteTags={siteTags}
        />
      )}

      {showSaved && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 300,
            background: "var(--ink)",
            color: "var(--bg)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            fontWeight: 700,
            padding: "10px 18px",
            border: "2px solid var(--ink)",
          }}
        >
          ✓ Saved
        </div>
      )}
    </CardShell>
  );
}
