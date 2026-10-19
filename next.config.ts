import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 100],
    remotePatterns: [...['upload.wikimedia.org','thumb.wikimedia.org'].map(hostname=>({protocol:'https' as const,hostname,port:'',pathname:'/wikipedia/commons/**',search:''})), { protocol: 'https', hostname: 'image.tmdb.org', port: '', pathname: '/t/p/**', search: '' }, ...[
      "example.com",
      "posters.movieposterdb.com",
      "localc.ph",
      "lh3.googleusercontent.com",
      "th.bing.com",
      "m.media-amazon.com",
    ].map((hostname) => ({ hostname }))],
  },
  // Add experimental features that might help with server-side rendering
  experimental: {
    // Disposable browser runs and constrained local verification need no persistent compiler cache.
    turbopackFileSystemCacheForDev: process.env.TALARAMA_DISABLE_COMPILER_CACHE !== '1',
    turbopackFileSystemCacheForBuild: process.env.TALARAMA_DISABLE_COMPILER_CACHE !== '1',
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
};

export default nextConfig;
