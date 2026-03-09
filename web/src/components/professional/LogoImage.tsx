"use client";

import Image from "next/image";

interface LogoImageProps {
  src: string;
  alt: string;
  fallbackText: string;
  size: number;
}

export default function LogoImage({ src, alt, fallbackText, size }: LogoImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
        (e.target as HTMLImageElement).parentElement!.textContent = fallbackText;
      }}
    />
  );
}
