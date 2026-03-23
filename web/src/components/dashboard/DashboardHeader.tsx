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
      className="w-full flex items-center justify-between px-6 py-3"
      style={{
        backgroundColor: '#1a1a1a',
        borderBottom: '3px solid #333',
      }}
    >
      <a
        href="https://sidequest.me"
        style={{
          fontFamily: 'var(--font-head, Archivo, sans-serif)',
          fontWeight: 900,
          fontSize: '0.78rem',
          color: '#fffbe6',
          textTransform: 'uppercase',
          textDecoration: 'none',
          letterSpacing: '0.02em',
        }}
      >
        SideQuest.me Home
      </a>

      {username && (
        <a
          href={`https://sidequest.me/${username}`}
          style={{
            fontFamily: 'var(--font-mono, Space Mono, monospace)',
            fontWeight: 700,
            fontSize: '0.72rem',
            color: '#ff6b35',
            textTransform: 'uppercase',
            textDecoration: 'none',
            letterSpacing: '0.02em',
          }}
        >
          My public profile →
        </a>
      )}
    </header>
  );
}
