"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const COOKIE_NAME = "sq_cookie_consent";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

type ConsentValue = "accepted" | "rejected" | null;

function getConsent(): ConsentValue {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? (match[1] as ConsentValue) : null;
}

function setConsent(value: "accepted" | "rejected") {
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if no consent decision has been made
    if (!getConsent()) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    setConsent("accepted");
    setVisible(false);
    // Reload to allow analytics scripts to initialise
    window.location.reload();
  };

  const handleReject = () => {
    setConsent("rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="max-w-[600px] mx-auto border-3 border-ink bg-[var(--bg-card)] p-5 shadow-[4px_4px_0_var(--ink)]">
        <p className="text-[0.85rem] leading-relaxed mb-4">
          We use essential cookies for authentication and optional analytics cookies
          (Google Analytics) to understand how the site is used. No advertising cookies.{" "}
          <Link
            href="/privacy"
            className="text-[var(--orange)] border-b border-[var(--orange)]/40 hover:border-[var(--orange)] transition-colors"
          >
            Privacy Policy
          </Link>
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleAccept}
            className="sticker sticker-green text-[0.7rem] !px-4 !py-2 !border-2 cursor-pointer"
          >
            Accept all
          </button>
          <button
            onClick={handleReject}
            className="font-mono text-[0.65rem] px-3 py-1.5 border-2 border-ink/30 text-ink/50 hover:text-ink hover:border-ink transition-colors cursor-pointer"
          >
            Essential only
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Check if analytics consent has been given.
 * Use this before loading GA/analytics scripts.
 */
export function hasAnalyticsConsent(): boolean {
  return getConsent() === "accepted";
}
