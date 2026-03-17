"use client";

/**
 * Image upload widget for crowdfunding projects.
 * Click to upload, hover to replace/delete. Resizes client-side to max 800px wide,
 * converts to WebP, uploads to Supabase Storage.
 */

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MAX_INPUT_MB = 10;
const MAX_INPUT_BYTES = MAX_INPUT_MB * 1024 * 1024;
const RESIZE_PX = 800;
const OUTPUT_QUALITY = 0.85;

interface ProjectImageUploadProps {
  userId: string;
  projectId: string;
  currentImageUrl: string | null;
  onUploaded: (url: string | null) => void;
}

/** Resize image client-side → WebP, max RESIZE_PX on longest edge */
async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > RESIZE_PX || height > RESIZE_PX) {
        const ratio = Math.min(RESIZE_PX / width, RESIZE_PX / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas context unavailable")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => { if (blob) resolve(blob); else reject(new Error("Failed to create blob")); },
        "image/webp",
        OUTPUT_QUALITY
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export default function ProjectImageUpload({
  userId,
  projectId,
  currentImageUrl,
  onUploaded,
}: ProjectImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const displayUrl = previewUrl ?? currentImageUrl;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    try {
      const resized = await resizeImage(file);
      const supabase = createClient();
      const filePath = `${userId}/crowdfunding/${projectId}/image.webp`;

      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(filePath, resized, { upsert: true, contentType: "image/webp" });

      if (uploadError) {
        setError(uploadError.message);
        setPreviewUrl(null);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from("photos").getPublicUrl(filePath);
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

  const handleDelete = async () => {
    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const filePath = `${userId}/crowdfunding/${projectId}/image.webp`;

      // Remove from storage (ignore errors if file doesn't exist)
      await supabase.storage.from("photos").remove([filePath]);

      setPreviewUrl(null);
      onUploaded(null);
    } catch {
      setError("Delete failed — please try again");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {displayUrl ? (
        /* ── Has image: show preview with replace/delete ── */
        <div className="relative group">
          <div className="w-full h-32 overflow-hidden border-3 border-ink bg-bg-card">
            <img
              src={displayUrl}
              alt="Project image"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity bg-ink/40">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="font-mono text-[0.6rem] font-bold uppercase px-3 py-1.5 bg-bg-card border-2 border-ink cursor-pointer hover:bg-ink/5"
            >
              {uploading ? "Uploading…" : "Replace"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={uploading}
              className="font-mono text-[0.6rem] font-bold uppercase px-3 py-1.5 bg-pink/80 border-2 border-ink cursor-pointer hover:bg-pink"
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        /* ── No image: upload prompt ── */
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full h-24 border-3 border-dashed border-ink/30 bg-bg-card flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-ink/60 hover:bg-ink/5 transition-all"
        >
          <span className="font-mono text-[0.65rem] font-bold uppercase opacity-40">
            {uploading ? "Uploading…" : "+ Add Image"}
          </span>
          <span className="font-mono text-[0.5rem] opacity-25">
            Max {MAX_INPUT_MB} MB · Resized to {RESIZE_PX}px
          </span>
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <p className="font-mono text-[0.65rem] text-pink font-bold mt-1">{error}</p>
      )}
    </div>
  );
}
