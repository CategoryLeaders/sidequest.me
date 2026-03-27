import { getCurrentUserProfile } from '@/lib/profiles';
import { createClient } from '@/lib/supabase/server';
import PhotoUpload from '@/components/PhotoUpload';
import { posts as archivePosts } from '@/lib/photowall-data';
import { photowallUrl } from '@/lib/cdn';

export const metadata = {
  title: 'Photos | Content | Dashboard | SideQuest.me',
  description: 'Upload and manage your photo wall',
};

export default async function PhotosPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-lg text-ink/60">Not authenticated</p>
      </div>
    );
  }

  // Fetch DB photos
  const supabase = await createClient();
  const { data: dbPhotos } = await (supabase as any)
    .from('photos')
    .select('id, image_urls, caption, date, tags')
    .eq('user_id', profile.id)
    .order('date', { ascending: false })
    .limit(50);

  const dbCount = dbPhotos?.length ?? 0;
  const archiveCount = archivePosts.length;

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
            {dbCount + archiveCount} photos on your wall ({dbCount} uploaded, {archiveCount} imported).{' '}
            <a
              href={`https://sidequest.me/${profile.username}/photowall`}
              className="text-orange no-underline hover:underline"
            >
              View public photowall →
            </a>
          </p>
        </div>

        {/* Upload form */}
        <div className="bg-white p-8 border-3 border-ink mb-8" style={{ boxShadow: '3px 3px 0 var(--ink)' }}>
          <PhotoUpload />
        </div>

        {/* Recent DB photos */}
        {dbCount > 0 && (
          <div className="mb-8">
            <h2 className="font-head font-bold text-[0.82rem] uppercase mb-4" style={{ color: 'var(--ink, #1a1a1a)' }}>
              Uploaded Photos
            </h2>
            <div className="grid grid-cols-4 gap-2">
              {(dbPhotos ?? []).map((p: any) => (
                <div key={p.id} className="aspect-square border-2 border-ink overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image_urls?.[0] ?? ''}
                    alt={p.caption ?? ''}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Archive preview */}
        <div>
          <h2 className="font-head font-bold text-[0.82rem] uppercase mb-4" style={{ color: 'var(--ink, #1a1a1a)' }}>
            Imported Photos ({archiveCount})
          </h2>
          <div className="grid grid-cols-6 gap-1">
            {archivePosts.slice(0, 24).map((p) => (
              <div key={p.id} className="aspect-square border border-ink/10 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photowallUrl(p.images[0])}
                  alt={p.caption ?? ''}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
          {archiveCount > 24 && (
            <p className="font-mono text-[0.68rem] opacity-50 mt-3 text-center">
              + {archiveCount - 24} more imported photos.{' '}
              <a
                href={`https://sidequest.me/${profile.username}/photowall`}
                className="text-orange no-underline"
              >
                View all on photowall →
              </a>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}