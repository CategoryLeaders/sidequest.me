'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/lib/profiles';

interface NavChild {
  label: string;
  href: string;
}

interface NavSection {
  key: string;
  label: string;
  icon: string;
  href?: string;            // direct link (for Home)
  children?: NavChild[];    // sub-items (always expanded)
}

/**
 * Nav hrefs use subdomain-relative paths (no /dashboard prefix).
 * On my.sidequest.me, middleware already rewrites /* → /dashboard/*,
 * so "/" here maps to /dashboard internally, "/profile" → /dashboard/profile, etc.
 */
const NAV: NavSection[] = [
  {
    key: 'home',
    label: 'Home',
    icon: '🏠',
    href: '/',
  },
  {
    key: 'identity',
    label: 'Profile & Identity',
    icon: '👤',
    children: [
      { label: 'Avatar & Name', href: '/profile?tab=avatar' },
      { label: 'Bio & Factoids', href: '/profile?tab=factoids' },
      { label: 'Likes & Dislikes', href: '/profile?tab=likes' },
    ],
  },
  {
    key: 'professional',
    label: 'Professional',
    icon: '💼',
    children: [
      { label: 'Career History', href: '/professional' },
      { label: 'LinkedIn & Links', href: '/professional?tab=links' },
    ],
  },
  {
    key: 'content',
    label: 'Content',
    icon: '✍️',
    children: [
      { label: 'Microblogs', href: '/content/microblogs' },
      { label: 'Writings', href: '/content/writings' },
      { label: 'Photos', href: '/content/photos' },
      { label: 'Ticker', href: '/content/ticker' },
    ],
  },
  {
    key: 'sidequests',
    label: 'Sidequests',
    icon: '🚀',
    children: [
      { label: 'Adventures', href: '/sidequests/adventures' },
      { label: 'My Projects', href: '/sidequests/projects' },
      { label: 'Backed Projects', href: '/sidequests/backed' },
    ],
  },
  {
    key: 'site',
    label: 'Site Settings',
    icon: '⚙️',
    children: [
      { label: 'Theme & Visuals', href: '/settings/theme' },
      { label: 'Tags', href: '/settings/tags' },
      { label: 'API Keys', href: '/settings/api-keys' },
    ],
  },
];

export default function DashboardNav({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  /* Match current path + query to an href */
  const isChildActive = (href: string) => {
    const [path, qs] = href.split('?');
    if (path === '/') {
      if (pathname !== '/') return false;
    } else {
      if (!pathname.startsWith(path)) return false;
      if (!qs) return pathname === path || pathname.startsWith(path + '/');
    }
    if (!qs) return pathname === path;
    // Match query param too (e.g. ?tab=avatar)
    const params = new URLSearchParams(qs);
    for (const [k, v] of params) {
      if (searchParams.get(k) !== v) return false;
    }
    return true;
  };

  const isSectionActive = (section: NavSection) => {
    if (section.href) return pathname === section.href;
    return section.children?.some((c) => {
      const [path] = c.href.split('?');
      if (path === '/') return pathname === '/';
      return pathname.startsWith(path);
    }) ?? false;
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <nav
      className="flex flex-col w-60 min-h-screen flex-shrink-0 bg-[var(--ink)]"
    >
      {/* ─── Logo ─── */}
      <Link href="/" className="block">
        <div
          className="px-5 py-5 flex items-center gap-3 border-b border-[var(--ink-secondary)]"
        >
          <div
            className="w-8 h-8 flex items-center justify-center flex-shrink-0 font-head font-[900] text-[0.7rem] text-white border-2 border-white/30"
            style={{ background: 'linear-gradient(135deg, var(--orange), var(--pink))' }}
          >
            SQ
          </div>
          <span className="font-head font-[900] text-[0.82rem] text-[var(--cream)] uppercase tracking-[0.02em]">
            MY SIDEQUEST
          </span>
        </div>
      </Link>

      {/* ─── Nav sections ─── */}
      <div className="flex-1 overflow-y-auto py-2">
        {NAV.map((section) => {
          const active = isSectionActive(section);

          return (
            <div key={section.key} className="mb-1">
              {/* Section heading — clickable, links to first child or direct href */}
              <Link href={section.href || section.children?.[0]?.href || '/'}>
                <div
                  className="flex items-center gap-2.5 py-2.5 font-body text-[0.82rem] transition-colors cursor-pointer"
                  style={{
                    paddingLeft: active ? 17 : 20,
                    borderLeft: active ? '3px solid var(--orange)' : '3px solid transparent',
                    backgroundColor: active ? 'rgba(255,107,53,0.12)' : 'transparent',
                    color: active ? 'var(--orange)' : 'var(--cream)',
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  <span className="text-base flex-shrink-0">{section.icon}</span>
                  <span>{section.label}</span>
                </div>
              </Link>

              {/* Children — always expanded */}
              {section.children && section.children.map((child) => {
                const childActive = isChildActive(child.href);
                return (
                  <Link key={child.href} href={child.href}>
                    <div
                      className="font-mono text-[0.68rem] uppercase tracking-[0.02em] transition-colors cursor-pointer"
                      style={{
                        padding: '5px 20px 5px 52px',
                        backgroundColor: childActive ? 'rgba(255,107,53,0.12)' : 'transparent',
                        color: childActive ? 'var(--orange)' : 'var(--ink-muted)',
                        fontWeight: childActive ? 700 : 400,
                      }}
                    >
                      {child.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ─── User footer ─── */}
      <div className="border-t border-[var(--ink-secondary)] px-5 py-3.5">
        <div className="flex items-center gap-3 mb-3">
          {profile.avatar_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={profile.avatar_url}
              alt={profile.display_name || profile.username}
              className="w-8 h-8 rounded-full flex-shrink-0 object-cover border-2 border-white/20"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-[0.7rem]"
              style={{ background: 'linear-gradient(135deg, var(--orange), var(--pink))' }}
            >
              {(profile.display_name || profile.username || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-body font-semibold text-[0.78rem] text-[var(--cream)] truncate">
              {profile.display_name || profile.username}
            </div>
            <div className="font-mono text-[0.58rem] text-[var(--ink-muted)] truncate">
              sidequest.me/{profile.username}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <a
            href={`https://sidequest.me/${profile.username}`}
            className="font-mono text-[0.62rem] text-[var(--orange)] no-underline uppercase font-bold"
          >
            View profile →
          </a>
          <button
            onClick={handleLogout}
            className="font-mono text-[0.62rem] text-[var(--divider)] uppercase bg-transparent border-none cursor-pointer hover:text-[var(--ink-muted)]"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
