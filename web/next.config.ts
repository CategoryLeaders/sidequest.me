import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
      source: "/ideas",
      destination: "/sophie/ideas",
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
