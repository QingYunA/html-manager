import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      "https://jbtrtfandrayxekioddo.supabase.co";

    const cleanSupabaseUrl = supabaseUrl.replace(/\/+$/, "");

    return [
      {
        source: "/auth/v1/:path*",
        destination: `${cleanSupabaseUrl}/auth/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;

