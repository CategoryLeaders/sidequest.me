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

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg, #fffbe6)' }}>
      <DashboardNav profile={profile} />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
