"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";

interface NavProps {
  /** Username of the currently authenticated user, or null if not logged in. */
  currentUsername: string | null;
}

const NAV_USERNAME = "sophie"; // default profile to link to for public nav items

const rotations = ["-0.5deg", "0.7deg", "-0.3deg", "0.5deg", "0.6deg", "-0.8deg", "0.4deg"];

export default function Nav({ currentUsername }: NavProps) {
  const pathname = usePathname();

  const profileBase = `/${NAV_USERNAME}`;
  const links = [
    { href: "/", label: "Home" },
    { href: `${profileBase}/about`, label: "About" },
    { href: `${profileBase}/professional`, label: "Professional" },
    { href: `${profileBase}/photowall`, label: "Photowall" },
    { href: `${profileBase}/ideas`, label: "Ideas" },
    { href: `${profileBase}/projects`, label: "Projects" },
  ];

  return (
    <nav className="sticky top-0 z-100 bg-bg border-b-3 border-ink flex items-center justify-between px-8 py-3.5 flex-wrap gap-3">
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

      {/* Auth state — right side */}
      <div className="flex items-center gap-3">
        {currentUsername ? (
          <>
            <Link
              href={`/${currentUsername}`}
              className="font-mono text-[0.72rem] uppercase text-ink opacity-70 hover:opacity-100 transition-opacity no-underline"
            >
              @{currentUsername}
            </Link>
            <Link
              href={`/${currentUsername}/settings`}
              className="font-mono text-[0.68rem] uppercase text-ink opacity-60 hover:opacity-100 transition-opacity no-underline border border-ink px-2 py-1"
            >
              Settings
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="font-mono text-[0.68rem] uppercase text-ink opacity-60 hover:opacity-100 transition-opacity border border-ink px-2 py-1 cursor-pointer bg-transparent"
              >
                Log out
              </button>
            </form>
          </>
        ) : (
          <>
            <div
              className="w-2 h-2 rounded-full bg-green"
              style={{ animation: "pulse 2s ease-in-out infinite" }}
            />
            <span className="font-mono text-[0.7rem] opacity-70">Available for collabs</span>
            <Link
              href="/login"
              className="font-mono text-[0.68rem] uppercase text-ink opacity-60 hover:opacity-100 transition-opacity no-underline border border-ink px-2 py-1"
            >
              Log in
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
