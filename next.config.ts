import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      "example.com",
      "posters.movieposterdb.com",
      "localc.ph",
      "lh3.googleusercontent.com",
      "th.bing.com",
      "m.media-amazon.com",
    ].map((hostname) => ({ hostname })),
  },
  // Add experimental features that might help with server-side rendering
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
};

export default nextConfig;
