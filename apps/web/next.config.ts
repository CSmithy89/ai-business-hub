import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable type-safe routing
  typedRoutes: true,

  // Image optimization domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  // Transpile shared workspace packages
  transpilePackages: ['@hyvve/shared', '@hyvve/ui'],
};

export default nextConfig;
