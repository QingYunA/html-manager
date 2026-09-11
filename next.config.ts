import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack does not walk up to unrelated lockfiles
  // in parent directories (which produces a build warning in some setups).
  turbopack: {
    root: path.join(__dirname),
  },
  async redirects() {
    return [
      {
        source: "/admin/login",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/admin",
        destination: "/workspace",
        permanent: true,
      },
      {
        source: "/admin/:path*",
        destination: "/workspace/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
