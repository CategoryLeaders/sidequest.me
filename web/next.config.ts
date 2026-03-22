import type { NextConfig } from "next";

// In the Cowork VM the FUSE-mounted .next/ directory contains a macOS lock file
// (.fuse_hidden) that Next.js can't unlink when cleaning before a build.
// Set NEXT_DIST_DIR=/tmp/sidequest-next-build (via `npm run build:vm`) to redirect
// build output to the VM-local /tmp filesystem where no lock exists.
// Vercel always uses the default ".next" — this env var is never set in production.
const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.sidequest.me",
      },
      {
        protocol: "https",
        hostname: "*.b-cdn.net",
      },
      {
        protocol: "https",
        hostname: "loawjmjuwrjjgmedswro.supabase.co",
      },
      {
        protocol: "https",
        hostname: "www.hackthebox.com",
      },
      {
        protocol: "https",
        hostname: "webcore.1e.com",
      },
    ],
  },
  redirects: async () => [
    {
      source: "/about",
      destination: "/sophie/about",
      permanent: true,
    },
    {
      source: "/professional",
      destination: "/sophie/professional",
      permanent: true,
    },
    {
      source: "/photowall",
      destination: "/sophie/photowall",
      permanent: true,
    },
    {
      source: "/thoughts",
      destination: "/sophie/thoughts",
      permanent: true,
    },
    // Legacy /ideas → /thoughts 301 redirects [SQ.S-W-2603-0058]
    {
      source: "/ideas",
      destination: "/sophie/thoughts",
      permanent: true,
    },
    {
      source: "/:username/ideas/:path*",
      destination: "/:username/thoughts/:path*",
      permanent: true,
    },
    {
      source: "/ideas/:path*",
      destination: "/sophie/thoughts/:path*",
      permanent: true,
    },
    {
      source: "/projects",
      destination: "/sophie/projects",
      permanent: true,
    },
    {
      source: "/photos",
      destination: "/sophie/photos",
      permanent: true,
    },
  ],
};

export default nextConfig;
