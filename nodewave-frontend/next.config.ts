import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/tasks/:path*",
        destination: "http://localhost:4000/tasks/:path*",
      },
      {
        source: "/auth/:path*",
        destination: "http://localhost:4000/auth/:path*",
      },
    ];
  },
};

export default nextConfig;
