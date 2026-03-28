/* ── WritingEditControls — ThreeDotMenu + EditModal for writing cards ── */
"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ThreeDotMenu } from "./ThreeDotMenu";
import { EditModal } from "./EditModal";
import type { SiteTag } from "@/lib/tags";

interface Props {
  writingId: string;
  initialData: {
    title: string;
    tags: string[];
    status: string;
  };
  siteTags?: SiteTag[];
  onDeleted?: () => void;
}

export function WritingEditControls({ writingId, initialData, siteTags, onDeleted }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const handleSaved = useCallback(() => {
    setShowSaved(true);
    setTimeout(() => {
      setShowSaved(false);
      router.refresh();
    }, 1500);
  }, [router]);

  return (
    <>
      <ThreeDotMenu
        contentType="writing"
        contentId={writingId}
        onEdit={() => setEditOpen(true)}
        onDeleted={() => {
          onDeleted?.();
          router.refresh();
        }}
      />

      <EditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        contentType="writing"
        contentId={writingId}
        initialData={initialData}
        siteTags={siteTags}
        onSaved={handleSaved}
      />

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
    </>
  );
}
