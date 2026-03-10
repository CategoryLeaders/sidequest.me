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
