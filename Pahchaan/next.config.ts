import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/pahchaan",
  output: "standalone",
  // Keep Webpack development output separate from existing Turbopack builds.
  distDir: process.env.NODE_ENV === "development" ? ".next-webpack" : ".next",
  turbopack: { root: process.cwd() },
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      }
    ]
  },
  async redirects() {
    return [
      {
        source: "/signIn",
        destination: "/login",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
