import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Optimize image domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.licdn.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "webnox.blr1.digitaloceanspaces.com",
      },
      {
        protocol: "https",
        hostname: "makeyoueasy.s3.ap-south-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "ecomwebsite-webnox.s3.us-east-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "makeyoueasy3.s3.us-east-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "makeyoueasy.blr1.digitaloceanspaces.com",
      },
    ],
  },

  // ✅ Ignore TypeScript/ESLint build errors in production
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },


};


export default nextConfig;
