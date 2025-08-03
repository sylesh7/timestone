import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      resolveAlias: {
        '@': './src',
      },
    },
  },
};

export default nextConfig;
