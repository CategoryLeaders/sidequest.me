/* ── ContentActions — Three-dot menu + edit modal, for any content card ── */
"use client";

import { useState, useCallback } from "react";
import { ThreeDotMenu, type ContentType } from "./ThreeDotMenu";
import { EditModal } from "./EditModal";

interface Props {
  contentType: ContentType;
  contentId: string;
  /** Initial field values passed to the edit modal */
  editData: Record<string, unknown>;
  /** Extra menu items (e.g. "Send to writing") */
  extraItems?: { label: string; icon: string; onClick: () => void }[];
}

export function ContentActions({ contentType, contentId, editData, extraItems }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleSaved = useCallback(() => {
    // Refresh the page to show updated content
    window.location.reload();
  }, []);

  const handleDeleted = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <>
      <ThreeDotMenu
        contentType={contentType}
        contentId={contentId}
        onEdit={() => setModalOpen(true)}
        onDeleted={handleDeleted}
        extraItems={extraItems}
      />
      <EditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        contentType={contentType}
        contentId={contentId}
        initialData={editData}
        onSaved={handleSaved}
      />
    </>
  );
}
