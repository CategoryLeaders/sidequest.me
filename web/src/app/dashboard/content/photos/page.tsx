import { getCurrentUserProfile } from '@/lib/profiles';
import PhotoUpload from '@/components/PhotoUpload';

export const metadata = {
  title: 'Photos | Content | Dashboard | SideQuest.me',
  description: 'Upload and manage your photo wall',
};

export default async function PhotosPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-lg text-gray-600">Not authenticated</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8" style={{ backgroundColor: 'var(--cream, #faf8f3)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1
            className="font-head font-[900] text-[2rem] uppercase leading-tight mb-1"
            style={{ color: 'var(--ink, #1a1a1a)' }}
          >
            Photos
          </h1>
          <p className="font-mono text-[0.78rem] opacity-60">
            Upload and manage your photo wall.
          </p>
        </div>

        <div className="bg-white p-8 border-3 border-ink" style={{ boxShadow: '3px 3px 0 var(--ink)' }}>
          <PhotoUpload />
        </div>
      </div>
    </main>
  );
}
