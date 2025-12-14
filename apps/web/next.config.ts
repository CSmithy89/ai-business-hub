import fs from 'fs';
import path from 'path';
import type { NextConfig } from 'next';

function loadMonorepoEnvFallback(): void {
  const root = path.join(__dirname, '..', '..');

  const candidates = [path.join(root, '.env.local'), path.join(root, '.env')];
  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;

    const contents = fs.readFileSync(filePath, 'utf8');
    for (const rawLine of contents.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const eq = line.indexOf('=');
      if (eq <= 0) continue;

      const key = line.slice(0, eq).trim();
      if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) continue;

      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  }
}

// In a monorepo, Next loads env files relative to the app directory.
// This pulls in missing vars (e.g. REDIS_URL) from the repo root without overriding app env.
loadMonorepoEnvFallback();

const nextConfig: NextConfig & { typedRoutes?: boolean } = {
  // Ensure Next.js resolves workspace roots correctly in monorepo/lockfile setups
  outputFileTracingRoot: path.join(__dirname, '..', '..'),

  // Enable type-safe routing
  typedRoutes: true,

  // Image optimization domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },

  // Transpile shared workspace packages
  transpilePackages: ['@hyvve/shared', '@hyvve/ui'],
};

export default nextConfig;
