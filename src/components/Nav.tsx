"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/professional", label: "Professional" },
  { href: "/photowall", label: "Photowall" },
  { href: "/ideas", label: "Ideas" },
  { href: "/projects", label: "Projects" },
];

const rotations = ["-0.5deg", "0.7deg", "-0.3deg", "0.5deg", "0.6deg", "-0.8deg", "0.4deg"];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-100 bg-bg border-b-3 border-ink flex items-center justify-between px-8 py-3.5 flex-wrap gap-3"
    >
      <Link
        href="/"
        className="font-head font-[900] text-[1.1rem] uppercase tracking-tight no-underline text-ink"
      >
        sidequest.me
      </Link>

      <div className="flex gap-2 flex-wrap">
        {links.map((link, i) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`
                inline-block px-3.5 py-1.5 border-3 border-ink font-head font-bold text-[0.72rem] uppercase no-underline
                transition-all duration-150 ease-in-out
                ${isActive ? "bg-ink text-bg" : "bg-transparent text-ink"}
                hover:shadow-[2px_2px_0_var(--ink)] hover:scale-104
              `}
              style={{ transform: `rotate(${rotations[i]})` }}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-2 font-mono text-[0.7rem] opacity-70">
        <div
          className="w-2 h-2 rounded-full bg-green"
          style={{ animation: "pulse 2s ease-in-out infinite" }}
        />
        Available for collabs
      </div>
    </nav>
  );
}
