import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Verifikasi/build manual memakai folder lain (NEXT_DIST_DIR=.next-verify) supaya tidak menimpa `.next` milik `next dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ampvduihfkdyvgobpwiv.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
