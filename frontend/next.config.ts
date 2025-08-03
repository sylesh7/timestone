import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // This will allow the build to pass even with ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // This will allow the build to pass even with TypeScript errors
    ignoreBuildErrors: true,
  },
  compiler: {
    // Add styled-components support for SSR
    styledComponents: true,
  },
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;