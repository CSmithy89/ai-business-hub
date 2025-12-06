import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Ensure Next.js resolves workspace roots correctly in monorepo/lockfile setups
  outputFileTracingRoot: path.join(__dirname, '..', '..'),

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
