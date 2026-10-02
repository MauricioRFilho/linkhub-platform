import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SSR mode — NO static export (required for dynamic routes)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
