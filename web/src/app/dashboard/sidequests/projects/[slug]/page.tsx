import { notFound } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/profiles';
import { createClient } from '@/lib/supabase/server';
import ProjectDetailClient from './ProjectDetailClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const profile = await getCurrentUserProfile();

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-lg text-gray-600">Not authenticated</p>
      </div>
    );
  }

  const supabase = await createClient();

  // Fetch project
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: project } = await (supabase as any)
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .eq('user_id', profile.id)
    .single();

  if (!project) notFound();

  // Fetch linked microblogs (via microblog_links)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: linkedMicroblogIds } = await (supabase as any)
    .from('microblog_links')
    .select('microblog_id')
    .eq('entity_type', 'project')
    .eq('entity_id', project.id);

  let linkedMicroblogs: any[] = [];
  if (linkedMicroblogIds && linkedMicroblogIds.length > 0) {
    const ids = linkedMicroblogIds.map((l: any) => l.microblog_id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('microblog_posts')
      .select('id, body, images, published_at, created_at, tags')
      .in('id', ids)
      .order('published_at', { ascending: false });
    linkedMicroblogs = data ?? [];
  }

  // Fetch writings tagged with this project slug
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: taggedWritings } = await (supabase as any)
    .from('writings')
    .select('id, title, slug, status, published_at, tags')
    .eq('user_id', profile.id)
    .contains('tags', [project.slug])
    .order('published_at', { ascending: false });

  // Fetch photos tagged with this project slug
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: taggedPhotos } = await (supabase as any)
    .from('photos')
    .select('id, image_urls, caption, date, tags')
    .eq('user_id', profile.id)
    .contains('tags', [project.slug])
    .order('date', { ascending: false });

  return (
    <ProjectDetailClient
      project={project}
      username={profile.username}
      microblogs={linkedMicroblogs ?? []}
      writings={taggedWritings ?? []}
      photos={taggedPhotos ?? []}
    />
  );
}