/**
 * Slim top bar for the my.sidequest.me dashboard.
 * Just two links: home and public profile.
 */

interface DashboardHeaderProps {
  username: string | null;
}

export default function DashboardHeader({ username }: DashboardHeaderProps) {
  return (
    <header
      className="w-full flex items-center justify-between px-6 py-3 bg-[var(--ink)] border-b-3 border-[var(--ink-secondary)]"
    >
      <a
        href="https://sidequest.me"
        className="font-head font-[900] text-[0.78rem] uppercase no-underline tracking-[0.02em] text-[var(--cream)]"
      >
        SideQuest.me Home
      </a>

      {username && (
        <a
          href={`https://sidequest.me/${username}`}
          className="font-mono font-bold text-[0.72rem] uppercase no-underline tracking-[0.02em] text-[var(--orange)]"
        >
          My public profile →
        </a>
      )}
    </header>
  );
}
