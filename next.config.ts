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
};

export default nextConfig;
