import { createCivicAuthPlugin } from "@civic/auth-web3/nextjs"
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

const withCivicAuth = createCivicAuthPlugin({
  clientId: "9356c69f-5175-4dd8-a266-10bfbd2f8894"
});

export default withCivicAuth(nextConfig);