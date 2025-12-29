import fs from 'fs';
import path from 'path';
import type { NextConfig } from 'next';
import dotenv from 'dotenv';

const MONOREPO_ENV_ALLOWLIST = new Set([
  // Database (server-only)
  'DATABASE_URL',
  'DIRECT_URL',

  // Auth (server-only)
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'CSRF_SECRET',

  // OAuth (server-only)
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'MICROSOFT_CLIENT_ID',
  'MICROSOFT_CLIENT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',

  // Encryption + secrets (server-only)
  'ENCRYPTION_MASTER_KEY',

  // Email (server-only)
  'RESEND_API_KEY',

  // Redis (server-only)
  'REDIS_URL',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',

  // File storage (server-only)
  'FILE_STORAGE_PROVIDER',
  'AWS_S3_BUCKET',
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_ENDPOINT',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_STORAGE_BUCKET',

  // Test helpers
  'E2E_OAUTH_TEST',
]);

function isAllowedMonorepoEnvKey(key: string): boolean {
  return key.startsWith('NEXT_PUBLIC_') || MONOREPO_ENV_ALLOWLIST.has(key);
}

function loadMonorepoEnvFallback(): void {
  const root = path.join(__dirname, '..', '..');

  const candidates = [path.join(root, '.env.local'), path.join(root, '.env')];
  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;

    let contents: string;
    try {
      contents = fs.readFileSync(filePath, 'utf8');
    } catch {
      // File was removed or became unreadable between exists check and read.
      continue;
    }

    const parsed = dotenv.parse(contents);
    for (const [key, value] of Object.entries(parsed)) {
      if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) continue;
      if (!isAllowedMonorepoEnvKey(key)) continue;
      process.env[key] = value;
    }
  }
}

// In a monorepo, Next loads env files relative to the app directory.
// This pulls in a safe allowlist of vars from the repo root without overriding app env.
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

  // Transpile shared workspace packages and CopilotKit (ESM compatibility)
  transpilePackages: [
    '@hyvve/shared',
    '@hyvve/ui',
    // CopilotKit and its dependencies require ESM transpilation (Story DM-01.4)
    '@copilotkit/react-core',
    '@copilotkit/react-ui',
    '@copilotkitnext/react',
    'streamdown',
    'shiki',
  ],
};

export default nextConfig;
