import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/profiles';
import DashboardNav from '@/components/dashboard/DashboardNav';

export const metadata = {
  title: 'Dashboard | SideQuest.me',
  description: 'Manage your SideQuest profile and content',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentUserProfile();

  // Not authenticated — render children without nav.
  // The login page (or middleware rewrite) will handle the UX.
  if (!profile) {
    return <>{children}</>;
  }

  // Mini accounts don't get the dashboard — redirect to public profile on main domain
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((profile as any).account_type === 'mini') {
    redirect(`https://sidequest.me/${profile.username}`);
  }

  // Force light-mode CSS variables on the dashboard regardless of the user's
  // theme preference. Dark mode applies to the public profile, not the admin UI.
  const lightVars: React.CSSProperties & Record<string, string> = {
    '--bg': '#fffbe6',
    '--bg-card': '#ffffff',
    '--ink': '#1a1a1a',
    '--ink-secondary': '#444444',
    '--ink-muted': '#777777',
    '--border-color': '#1a1a1a',
    '--shadow-color': '#1a1a1a',
    '--cream': '#fffbe6',
    '--divider': '#ccc',
    '--input-bg': '#ffffff',
    '--input-border-color': '#1a1a1a',
    '--orange': '#ff6b35',
    '--green': '#00d4aa',
    '--pink': '#ff69b4',
    '--blue': '#4d9fff',
    '--yellow': '#ffd23f',
    '--lilac': '#c4a8ff',
    '--nav-active-bg': '#1a1a1a',
    '--nav-active-text': '#fffbe6',
    backgroundColor: '#fffbe6',
    color: '#1a1a1a',
  };

  return (
    <div className="flex min-h-screen" style={lightVars}>
      <DashboardNav profile={profile} />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
