"use client";

import { useState } from "react";

type Filter = "All" | "London" | "Travel" | "Food";

const filters: Filter[] = ["All", "London", "Travel", "Food"];
const filterColors = ["sticker-orange", "sticker-blue", "sticker-green", "sticker-yellow"];

const photos = [
  { id: 1, caption: "Southbank sunset", date: "Jan 2026", category: "London" as Filter, bg: "#ffe0d0" },
  { id: 2, caption: "Borough Market finds", date: "Jan 2026", category: "Food" as Filter, bg: "#d0f5e8" },
  { id: 3, caption: "Lisbon tiles", date: "Dec 2025", category: "Travel" as Filter, bg: "#e0d8ff" },
  { id: 4, caption: "Morning coffee ritual", date: "Dec 2025", category: "Food" as Filter, bg: "#ffecd0" },
  { id: 5, caption: "Barbican brutalism", date: "Nov 2025", category: "London" as Filter, bg: "#d0e8ff", span: "row" },
  { id: 6, caption: "Porto sunset", date: "Nov 2025", category: "Travel" as Filter, bg: "#ffd0e0" },
  { id: 7, caption: "Hackney Wick walk", date: "Oct 2025", category: "London" as Filter, bg: "#d5f0d0" },
  { id: 8, caption: "Tokyo street food", date: "Oct 2025", category: "Travel" as Filter, bg: "#fff0d0", span: "col" },
  { id: 9, caption: "Sourdough attempt #47", date: "Sep 2025", category: "Food" as Filter, bg: "#e8d0ff" },
];

const rotations = ["0.3deg", "-0.4deg", "0.2deg", "-0.3deg", "0.5deg", "-0.2deg", "0.4deg", "-0.5deg", "0.3deg"];

export default function PhotosPage() {
  const [filter, setFilter] = useState<Filter>("All");

  const filtered = filter === "All" ? photos : photos.filter((p) => p.category === filter);

  return (
    <main className="max-w-[1100px] mx-auto px-8 py-12 relative">
      <div
        className="doodle"
        style={{ width: 90, height: 90, top: 50, right: -15 }}
      />

      <h1 className="font-head font-[900] text-[clamp(1.8rem,4vw,2.8rem)] uppercase leading-[0.95] mb-2">
        Photo Album
      </h1>
      <p className="text-[0.95rem] opacity-60 mb-6">
        Snapshots from London life, travels, and food adventures.
      </p>

      {/* Filters */}
      <div className="flex gap-2.5 mb-8 flex-wrap">
        {filters.map((f, i) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`sticker ${filter === f ? "bg-ink !text-bg" : filterColors[i]} cursor-pointer`}
            style={{
              transform: `rotate(${i === 0 ? "-0.5deg" : i === 1 ? "0.7deg" : i === 2 ? "-0.3deg" : "0.5deg"})`,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-auto">
        {filtered.map((photo, i) => (
          <div
            key={photo.id}
            className={`border-3 border-ink bg-bg-card p-2 card-hover ${
              photo.span === "row" ? "md:row-span-2" : ""
            } ${photo.span === "col" ? "md:col-span-2" : ""}`}
            style={{ transform: `rotate(${rotations[i % rotations.length]})` }}
          >
            <div
              className="w-full"
              style={{
                backgroundColor: photo.bg,
                height: photo.span === "row" ? 456 : photo.span === "col" ? 280 : 220,
              }}
            />
            <div className="flex justify-between items-end mt-2 px-1 pb-1">
              <span className="font-head font-bold text-[0.72rem] uppercase">
                {photo.caption}
              </span>
              <span className="font-mono text-[0.6rem] opacity-40">
                {photo.date}
              </span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
