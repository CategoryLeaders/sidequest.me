"use client";

/**
 * Avatar upload widget — shows current avatar with a click-to-change overlay.
 * Accepts images up to 10 MB, resizes client-side to max 512 px and converts
 * to WebP before uploading to Supabase Storage.
 * [SQ.S-W-2603-0034]
 */

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Avatar from "./Avatar";

const MAX_INPUT_MB = 10;
const MAX_INPUT_BYTES = MAX_INPUT_MB * 1024 * 1024;
const RESIZE_PX = 512;
const OUTPUT_QUALITY = 0.85;

interface AvatarUploadProps {
  userId: string;
  displayName: string | null;
  currentAvatarUrl: string | null;
  onUploaded: (url: string) => void;
}

/**
 * Resize an image file client-side using canvas.
 * Returns a WebP Blob capped at RESIZE_PX on the longest edge.
 */
async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Scale down if either dimension exceeds RESIZE_PX
      if (width > RESIZE_PX || height > RESIZE_PX) {
        const ratio = Math.min(RESIZE_PX / width, RESIZE_PX / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create image blob"));
        },
        "image/webp",
        OUTPUT_QUALITY
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export default function AvatarUpload({
  userId,
  displayName,
  currentAvatarUrl,
  onUploaded,
}: AvatarUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const displayUrl = previewUrl ?? currentAvatarUrl;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setError(`Image must be under ${MAX_INPUT_MB} MB`);
      return;
    }

    setError(null);
    setUploading(true);

    // Show instant local preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    try {
      // Resize client-side → WebP, max 512 px
      const resized = await resizeImage(file);

      const supabase = createClient();
      const filePath = `${userId}/avatars/avatar.webp`;

      // Upload (upsert to replace existing)
      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(filePath, resized, { upsert: true, contentType: "image/webp" });

      if (uploadError) {
        setError(uploadError.message);
        setPreviewUrl(null);
        return;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("photos").getPublicUrl(filePath);

      // Append cache-buster so the browser doesn't serve stale avatar
      const freshUrl = `${publicUrl}?t=${Date.now()}`;
      setPreviewUrl(freshUrl);
      onUploaded(freshUrl);
    } catch {
      setError("Upload failed — please try again");
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="relative group cursor-pointer bg-transparent border-0 p-0"
        title="Click to change avatar"
      >
        <Avatar
          displayName={displayName}
          avatarUrl={displayUrl}
          size={96}
          className="transition-opacity group-hover:opacity-70"
        />
        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-ink/30">
          <span className="font-mono text-[0.65rem] text-white font-bold uppercase">
            {uploading ? "Resizing…" : "Change"}
          </span>
        </div>
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      <p className="font-mono text-[0.68rem] opacity-50">
        Click to upload · Max {MAX_INPUT_MB} MB · Resized to {RESIZE_PX}px
      </p>

      {error && (
        <p className="font-mono text-[0.72rem] text-red-600">{error}</p>
      )}
    </div>
  );
}
