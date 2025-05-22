import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["example.com", "posters.movieposterdb.com"], // Add any other trusted domains here
  },
};

export default nextConfig;
