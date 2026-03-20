"use client";

import { useState } from "react";

interface Props {
  profileId: string;
}

export default function SubscribeButton({ profileId }: Props) {
  const [state, setState] = useState<"idle" | "form" | "sending" | "sent" | "error">("idle");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setState("sending");
    try {
      const res = await fetch("/api/digest/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: profileId, email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessage(data.message);
      setState("sent");
    } catch (err: any) {
      setMessage(err.message);
      setState("error");
    }
  };

  if (state === "idle") {
    return (
      <button
        onClick={() => setState("form")}
        className="sticker sticker-orange text-[0.7rem] !px-4 !py-2 !border-2 cursor-pointer hover:scale-105 transition-transform"
      >
        Subscribe to updates
      </button>
    );
  }

  if (state === "sent") {
    return (
      <div className="border-2 border-green-400 bg-green-50 px-4 py-3 text-[0.8rem] font-mono text-green-700">
        {message}
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="border-2 border-red-400 bg-red-50 px-4 py-3 text-[0.8rem] font-mono text-red-700">
        {message}{" "}
        <button onClick={() => setState("form")} className="underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="border-2 border-ink/20 px-3 py-2 text-[0.8rem] font-mono outline-none bg-transparent focus:border-[var(--orange)] transition-colors placeholder:text-ink/20 w-56"
      />
      <button
        type="submit"
        disabled={state === "sending"}
        className="sticker sticker-orange text-[0.65rem] !px-3 !py-2 !border-2 cursor-pointer disabled:opacity-40"
      >
        {state === "sending" ? "..." : "Subscribe"}
      </button>
      <button
        type="button"
        onClick={() => setState("idle")}
        className="font-mono text-[0.6rem] text-ink/30 hover:text-ink transition-colors"
      >
        Cancel
      </button>
      <span className="text-[0.55rem] font-mono text-ink/30">
        <a href="/privacy" className="underline">Privacy Policy</a>
      </span>
    </form>
  );
}
