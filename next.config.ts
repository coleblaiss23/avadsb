import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Planespotters terms disallow disk-caching their photos; we still use
    // next/image with `unoptimized` for layout — allow the CDN hosts here.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.planespotters.net",
      },
      {
        protocol: "https",
        hostname: "*.planespotters.net",
      },
    ],
  },
};

export default nextConfig;
