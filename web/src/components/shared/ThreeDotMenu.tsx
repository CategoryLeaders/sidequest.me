/* ── ThreeDotMenu — owner-only action menu for content cards ── */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ContentType = "microblog" | "quote" | "bookmark" | "question" | "crowdfunding_project";

interface Props {
  contentType: ContentType;
  contentId: string;
  /** Open the edit modal for this item */
  onEdit: () => void;
  /** Called after successful delete — parent should remove the card */
  onDeleted?: () => void;
  /** Additional menu items */
  extraItems?: { label: string; icon: string; onClick: () => void }[];
}

const API_PREFIX: Record<ContentType, string> = {
  microblog: "/api/microblogs",
  quote: "/api/quotes",
  bookmark: "/api/bookmarks",
  question: "/api/questions",
  crowdfunding_project: "/api/crowdfunding-projects",
};

export function ThreeDotMenu({ contentType, contentId, onEdit, onDeleted, extraItems }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirmDelete(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setConfirmDelete(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_PREFIX[contentType]}/${contentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDeleted?.();
      }
    } catch {
      // Silently fail — user can try again
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
      setOpen(false);
    }
  }, [contentType, contentId, onDeleted]);

  const handleCopyLink = useCallback(() => {
    const url = window.location.origin + window.location.pathname;
    navigator.clipboard?.writeText(url);
    setOpen(false);
  }, []);

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
          setConfirmDelete(false);
        }}
        className="three-dot-trigger"
        style={{
          background: "none",
          border: "none",
          fontSize: "1.15rem",
          lineHeight: 1,
          cursor: "pointer",
          padding: "2px 6px",
          opacity: 0.35,
          transition: "opacity 0.15s",
          fontWeight: 700,
          color: "var(--ink)",
        }}
        onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = "1"; }}
        onMouseLeave={(e) => { if (!open) (e.target as HTMLElement).style.opacity = "0.35"; }}
        aria-label="More actions"
      >
        ⋮
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            zIndex: 50,
            minWidth: 180,
            background: "var(--bg-card)",
            border: "2px solid var(--ink)",
            boxShadow: "3px 3px 0 var(--ink)",
            padding: 4,
          }}
        >
          {/* Edit */}
          <MenuItem
            icon="✎"
            label="Edit"
            onClick={() => {
              onEdit();
              setOpen(false);
            }}
          />

          {/* Copy link */}
          <MenuItem icon="🔗" label="Copy link" onClick={handleCopyLink} />

          {/* Extra items */}
          {extraItems?.map((item) => (
            <MenuItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
            />
          ))}

          {/* Divider */}
          <hr
            style={{
              margin: "4px 0",
              border: "none",
              borderTop: "1px solid var(--ink)",
              opacity: 0.15,
            }}
          />

          {/* Delete */}
          {!confirmDelete ? (
            <MenuItem
              icon="🗑"
              label="Delete"
              danger
              onClick={() => setConfirmDelete(true)}
            />
          ) : (
            <div style={{ padding: "8px 12px" }}>
              <p
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  margin: "0 0 6px",
                  color: "#c0392b",
                }}
              >
                Delete permanently?
              </p>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    padding: "4px 12px",
                    border: "1.5px solid #c0392b",
                    background: "#c0392b",
                    color: "#fff",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    cursor: deleting ? "wait" : "pointer",
                    fontFamily: "var(--font-head)",
                    textTransform: "uppercase",
                  }}
                >
                  {deleting ? "Deleting…" : "Yes, delete"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  style={{
                    padding: "4px 12px",
                    border: "1.5px solid var(--ink)",
                    background: "var(--bg-card)",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "var(--font-head)",
                    textTransform: "uppercase",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: string;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      style={{
        display: "block",
        width: "100%",
        padding: "8px 12px",
        border: "none",
        background: "none",
        textAlign: "left",
        fontSize: "0.78rem",
        cursor: "pointer",
        color: danger ? "#c0392b" : "var(--ink)",
        fontFamily: "var(--font-body)",
      }}
      onMouseEnter={(e) => {
        (e.target as HTMLElement).style.background = "var(--ink)";
        (e.target as HTMLElement).style.color = danger ? "#ff6b6b" : "var(--bg-card)";
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLElement).style.background = "none";
        (e.target as HTMLElement).style.color = danger ? "#c0392b" : "var(--ink)";
      }}
    >
      {icon} {label}
    </button>
  );
}
