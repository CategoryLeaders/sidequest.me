import { requireOwner } from "@/lib/auth/require";
import PublishForm from "./PublishForm";

/**
 * Owner-only publish page for uploading photos.
 * [SQ.S-W-2603-0042]
 */

interface Props {
  params: Promise<{ username: string }>;
}

export default async function PublishPage({ params }: Props) {
  const { username } = await params;
  await requireOwner(username);

  return (
    <main className="max-w-[680px] mx-auto px-8 py-12">
      <div className="mb-8">
        <h1 className="font-head font-[900] text-[2rem] uppercase leading-tight mb-1">
          Post Photos
        </h1>
        <p className="font-mono text-[0.78rem] opacity-60">@{username}</p>
      </div>

      <PublishForm username={username} />
    </main>
  );
}
