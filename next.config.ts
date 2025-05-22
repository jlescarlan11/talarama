import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["example.com", "posters.movieposterdb.com", "localc.ph"], // Add any other trusted domains here
  },
};

export default nextConfig;
