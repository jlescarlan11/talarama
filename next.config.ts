import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "example.com",
      "posters.movieposterdb.com",
      "localc.ph",
      "lh3.googleusercontent.com",
      "th.bing.com",
      "m.media-amazon.com",
    ], // Add any other trusted domains here
  },
  // Add experimental features that might help with server-side rendering
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  // Ensure proper handling of server-side errors
  onError: (err: Error) => {
    console.error('Next.js build error:', err);
  },
};

export default nextConfig;
