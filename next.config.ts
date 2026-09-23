import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // Ensure private headers and no public leaks of secrets
  poweredByHeader: false,
  serverExternalPackages: ['@resvg/resvg-js'],
};

export default nextConfig;
