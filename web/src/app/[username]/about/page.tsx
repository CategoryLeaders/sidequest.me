"use client";

import { useState } from "react";

const tabs = ["Bio", "Loves & Hates"] as const;
type Tab = (typeof tabs)[number];

const tabColors = ["sticker-orange", "sticker-pink"];

const factoids = [
  { emoji: "📍", label: "Based in", value: "Surrey, UK" },
  { emoji: "📸", label: "Hobby", value: "Photography" },
  { emoji: "☕", label: "Fuel", value: "Oat milk flat whites" },
  { emoji: "🎯", label: "Superpower", value: "Side projects" },
];

const loves = [
  { emoji: "☕", text: "Coffee" },
  { emoji: "🚀", text: "Science Fiction" },
  { emoji: "💬", text: "Talking to interesting, passionate people" },
  { emoji: "🏍️", text: "Motorcycle travel" },
  { emoji: "🚐", text: "Vanlife adventures" },
  { emoji: "⛵", text: "Sailing, boats and the sea" },
  { emoji: "☀️", text: "Being Warm" },
];

const hates = [
  { emoji: "🚫", text: "TERFs, Racists and other Bigots" },
  { emoji: "🥬", text: "Green Juice" },
  { emoji: "🥶", text: "Being Cold" },
  { emoji: "🧳", text: "Packing for trips" },
];

export default function AboutPage() {
  const [active, setActive] = useState<Tab>("Bio");

  return (
    <main className="max-w-[1100px] mx-auto px-8 py-12 relative">
      <div
        className="doodle doodle-circle"
        style={{ width: 100, height: 100, top: 30, right: -20 }}
      />

      {/* Header */}
      <h1 className="font-head font-[900] text-[clamp(1.8rem,4vw,2.8rem)] uppercase leading-[0.95] mb-6">
        About Sophie
      </h1>

      {/* Tabs */}
      <div className="flex gap-2.5 mb-8 flex-wrap">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`sticker ${active === tab ? "bg-ink !text-bg" : tabColors[i]} cursor-pointer`}
            style={{
              transform: `rotate(${i === 0 ? "-0.5deg" : "0.7deg"})`,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── BIO TAB ── */}
      {active === "Bio" && (
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8">
          <div className="flex flex-col gap-4 text-[0.95rem] leading-relaxed">
            <p>
              Hi, I&apos;m Sophie! I live in Surrey with a never-ending list of
              sidequests on the go. By day I work in tech — product marketing
              and all that — but this site isn&apos;t really about that.
              (There&apos;s a whole{" "}
              <a href="/sophie/professional" className="underline font-bold">
                Professional Life
              </a>{" "}
              page if you&apos;re after the career stuff.)
            </p>
            <p>
              This is the everything-else corner. I&apos;m a photographer who
              chases golden hour, a compulsive project-starter, and someone who
              genuinely believes a well-structured Notion database can solve most
              of life&apos;s problems. I collect city breaks the way other people
              collect stamps.
            </p>
            <p>
              I built this site because I needed somewhere that isn&apos;t
              LinkedIn or Instagram — somewhere to put all the things that
              don&apos;t fit neatly into a job title. Part portfolio, part
              notebook, part photo album, part proof that I can&apos;t sit still.
            </p>
            <p>
              If you&apos;re here, you&apos;re probably either someone I know, a
              fellow sidequest enthusiast, or completely lost. Either way —
              welcome.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {factoids.map((f, i) => (
              <div
                key={f.label}
                className="border-3 border-ink p-4 bg-white"
                style={{
                  transform: `rotate(${i === 0 ? "-1deg" : i === 1 ? "0.5deg" : i === 2 ? "-0.7deg" : "0.4deg"})`,
                }}
              >
                <div className="text-2xl mb-1">{f.emoji}</div>
                <div className="font-mono text-[0.65rem] opacity-50 uppercase">
                  {f.label}
                </div>
                <div className="font-head font-bold text-[1.1rem]">
                  {f.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LOVES & HATES TAB ── */}
      {active === "Loves & Hates" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="section-title">Loves 💚</div>
            <div className="flex flex-col gap-3">
              {loves.map((item, i) => (
                <div
                  key={item.text}
                  className="border-3 border-ink px-4 py-3 flex items-center gap-3 bg-white"
                  style={{
                    transform: `rotate(${i % 2 === 0 ? "-0.3deg" : "0.3deg"})`,
                  }}
                >
                  <span className="text-xl">{item.emoji}</span>
                  <span className="text-[0.88rem]">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="section-title">Hates 😤</div>
            <div className="flex flex-col gap-3">
              {hates.map((item, i) => (
                <div
                  key={item.text}
                  className="border-3 border-ink px-4 py-3 flex items-center gap-3 bg-white"
                  style={{
                    transform: `rotate(${i % 2 === 0 ? "0.3deg" : "-0.3deg"})`,
                  }}
                >
                  <span className="text-xl">{item.emoji}</span>
                  <span className="text-[0.88rem]">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
