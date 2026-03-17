"use client";

/**
 * Sub-tab navigation for the Projects page: "My Projects" and "Backed".
 * Uses URL query params (?tab=backed) for shareable links.
 */

import Link from "next/link";

interface ProjectsTabsProps {
  activeTab: string;
  username: string;
  backedCount: number;
}

export default function ProjectsTabs({ activeTab, username, backedCount }: ProjectsTabsProps) {
  const tabs = [
    { key: "projects", label: "My Projects", href: `/${username}/projects` },
    { key: "backed", label: `Backed (${backedCount})`, href: `/${username}/projects?tab=backed` },
  ];

  return (
    <div className="flex gap-2.5 mb-8 flex-wrap">
      {tabs.map((tab, i) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`sticker cursor-pointer no-underline ${
            activeTab === tab.key
              ? "bg-ink !text-bg"
              : i === 0
                ? "sticker-orange"
                : "sticker-green"
          }`}
          style={{
            transform: `rotate(${i === 0 ? "-0.5deg" : "0.7deg"})`,
          }}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
