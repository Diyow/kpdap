import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'qaloryhljydujnolevrm.supabase.co',
      },
    ],
  },
  /* config options here */
};

export default nextConfig;
