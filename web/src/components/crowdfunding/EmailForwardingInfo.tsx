/* ── EmailForwardingInfo — shows the project's email forwarding address to the owner ── */
"use client";

import { useState } from "react";

interface Props {
  emailToken: string;
  projectTitle: string;
}

export default function EmailForwardingInfo({ emailToken, projectTitle }: Props) {
  const [copied, setCopied] = useState(false);
  const address = `${emailToken}@sidequest.me`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text
      const input = document.querySelector<HTMLInputElement>("[data-email-forward]");
      if (input) {
        input.select();
        input.setSelectionRange(0, 99999);
      }
    }
  };

  return (
    <div className="border-2 border-dashed border-ink/15 p-3 bg-ink/[0.02] mb-4">
      <p className="font-mono text-[0.55rem] font-bold uppercase opacity-40 mb-1.5">
        📧 Email Forwarding
      </p>
      <p className="text-[0.72rem] opacity-50 mb-2 leading-relaxed">
        Forward creator updates to this address and they'll appear in the Updates tab.
      </p>
      <div className="flex items-center gap-2">
        <input
          data-email-forward
          readOnly
          value={address}
          className="flex-1 font-mono text-[0.7rem] px-2.5 py-1.5 border border-ink/20 bg-white"
          style={{ color: "var(--ink)" }}
          onFocus={(e) => e.target.select()}
        />
        <button
          onClick={handleCopy}
          className="font-mono text-[0.6rem] font-bold uppercase px-3 py-1.5 border-2 border-ink hover:opacity-70 transition-opacity"
          style={{
            background: copied ? "var(--green)" : "var(--orange)",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
