"use client";

/**
 * Main site navigation.
 * When logged in: avatar circle top-right with dropdown (Post Image, Edit Profile, Logout).
 * When logged out: Login link.
 * [SQ.S-W-2603-0033] [SQ.S-W-2603-0047]
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { signOut } from "@/app/actions/auth";
import Avatar from "./Avatar";
import PreferencesModal from "./PreferencesModal";

interface NavProps {
  currentUsername: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

const NAV_USERNAME = "sophie";

const rotations = [
  "-0.5deg",
  "0.7deg",
  "-0.3deg",
  "0.5deg",
  "0.6deg",
  "-0.8deg",
  "0.4deg",
];

export default function Nav({
  currentUsername,
  displayName,
  avatarUrl,
}: NavProps) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const profileBase = `/${NAV_USERNAME}`;
  const myProfileHref = currentUsername ? `/${currentUsername}` : profileBase;
  const links = [
    { href: myProfileHref, label: currentUsername ? "My Profile" : "Profile" },
    { href: `${profileBase}/about`, label: "About" },
    { href: `${profileBase}/professional`, label: "Professional" },
    { href: `${profileBase}/photowall`, label: "Photowall" },
    { href: `${profileBase}/ideas`, label: "Ideas" },
    { href: `${profileBase}/projects`, label: "Projects" },
    { href: `${profileBase}/adventures`, label: "Adventures" },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropdownOpen]);

  // Close dropdown on navigation
  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

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
          <div className="relative" ref={dropdownRef}>
            {/* Avatar button */}
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="bg-transparent border-0 p-0 cursor-pointer"
              aria-label="Open profile menu"
              aria-expanded={dropdownOpen}
            >
              <Avatar
                displayName={displayName ?? currentUsername}
                avatarUrl={avatarUrl}
                size={36}
                className="hover:opacity-80 transition-opacity"
              />
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-52 bg-bg border-3 border-ink z-50"
                style={{ boxShadow: "4px 4px 0 var(--ink)" }}
              >
                {/* User info header */}
                <div className="px-4 py-3 border-b-2 border-ink/15">
                  <p className="font-head font-bold text-[0.75rem] uppercase truncate">
                    {displayName ?? currentUsername}
                  </p>
                  <p className="font-mono text-[0.65rem] opacity-50">
                    @{currentUsername}
                  </p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <Link
                    href={`/${currentUsername}/publish`}
                    className="flex items-center gap-2.5 px-4 py-2.5 font-mono text-[0.75rem] text-ink no-underline hover:bg-ink/5 transition-colors"
                  >
                    <span className="text-[0.9rem]">📷</span>
                    Post Image
                  </Link>

                  <Link
                    href={`/${currentUsername}/admin/writings`}
                    className="flex items-center gap-2.5 px-4 py-2.5 font-mono text-[0.75rem] text-ink no-underline hover:bg-ink/5 transition-colors"
                  >
                    <span className="text-[0.9rem]">✍️</span>
                    Writings
                  </Link>

                  <Link
                    href={`/${currentUsername}/settings`}
                    className="flex items-center gap-2.5 px-4 py-2.5 font-mono text-[0.75rem] text-ink no-underline hover:bg-ink/5 transition-colors"
                  >
                    <span className="text-[0.9rem]">✏️</span>
                    Edit Profile
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      setPreferencesOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 font-mono text-[0.75rem] text-ink bg-transparent border-0 cursor-pointer hover:bg-ink/5 transition-colors text-left"
                  >
                    <span className="text-[0.9rem]">🎨</span>
                    Preferences
                  </button>

                  <div className="border-t-2 border-ink/10 my-1" />

                  <form action={signOut}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 font-mono text-[0.75rem] text-ink bg-transparent border-0 cursor-pointer hover:bg-ink/5 transition-colors text-left"
                    >
                      <span className="text-[0.9rem]">🚪</span>
                      Log out
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div
              className="w-2 h-2 rounded-full bg-green"
              style={{ animation: "pulse 2s ease-in-out infinite" }}
            />
            <span className="font-mono text-[0.7rem] opacity-70">
              Available for collabs
            </span>
            <Link
              href="/login"
              className="font-mono text-[0.68rem] uppercase text-ink opacity-60 hover:opacity-100 transition-opacity no-underline border border-ink px-2 py-1"
            >
              Log in
            </Link>
          </>
        )}
      </div>

      <PreferencesModal
        open={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
      />
    </nav>
  );
}
