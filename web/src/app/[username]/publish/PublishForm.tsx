"use client";

/**
 * Client wrapper for the photo upload form on the publish page.
 * Redirects to the photowall after a successful upload.
 * [SQ.S-W-2603-0042]
 */

import { useRouter } from "next/navigation";
import PhotoUpload from "@/components/PhotoUpload";

interface Props {
  username: string;
}

export default function PublishForm({ username }: Props) {
  const router = useRouter();

  return (
    <PhotoUpload
      onUploaded={() => {
        router.push(`/${username}/photowall`);
      }}
    />
  );
}
