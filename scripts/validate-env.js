#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Environment Validation Script
 *
 * Validates required env vars for HYVVE services and fails fast with actionable errors.
 *
 * Usage:
 *   node scripts/validate-env.js --service=all --mode=production
 *   node scripts/validate-env.js --service=api --mode=development
 *
 * Notes:
 * - This script is intentionally dependency-free (Node built-ins only).
 * - It validates presence + basic shape (URLs, base64 key length) but does not contact external services.
 */

const crypto = require('node:crypto');

function parseArgs(argv) {
  const args = {
    service: 'all',
    mode: process.env.NODE_ENV || 'development',
  };

  for (const raw of argv) {
    if (raw.startsWith('--service=')) args.service = raw.split('=')[1] || 'all';
    if (raw.startsWith('--mode=')) args.mode = raw.split('=')[1] || args.mode;
  }

  return args;
}

function isTruthy(value) {
  return value !== undefined && value !== null && String(value).trim().length > 0;
}

function requireVar(name, errors) {
  const value = process.env[name];
  if (!isTruthy(value)) {
    errors.push(`Missing ${name}`);
    return undefined;
  }
  return String(value);
}

function validateUrl(name, value, errors) {
  if (!value) return;
  try {
    // eslint-disable-next-line no-new
    new URL(value);
  } catch {
    errors.push(`Invalid URL for ${name}: ${value}`);
  }
}

function validateBase64Key32(name, value, errors) {
  if (!value) return;
  let decoded;
  try {
    decoded = Buffer.from(value, 'base64');
  } catch {
    errors.push(`${name} must be base64`);
    return;
  }
  if (decoded.length !== 32) {
    errors.push(`${name} must decode to 32 bytes (got ${decoded.length})`);
  }
}

function validateMinLength(name, value, minLen, errors) {
  if (!value) return;
  if (value.length < minLen) {
    errors.push(`${name} must be at least ${minLen} characters`);
  }
}

function validateCommaList(name, value, errors) {
  if (!value) return;
  const items = value.split(',').map((s) => s.trim()).filter(Boolean);
  if (items.length === 0) {
    errors.push(`${name} must contain at least one origin`);
  }
  for (const item of items) {
    validateUrl(name, item, errors);
  }
}

function validateService(service, mode, errors) {
  const isProd = mode === 'production';

  if (service === 'all' || service === 'web') {
    // Web app (Next)
    requireVar('NEXT_PUBLIC_API_URL', errors);
    requireVar('NEXT_PUBLIC_AGENTS_URL', errors);
  }

  if (service === 'all' || service === 'api') {
    // Nest API
    requireVar('DATABASE_URL', errors);
    validateUrl('DATABASE_URL', process.env.DATABASE_URL, errors);

    const authSecret = requireVar('BETTER_AUTH_SECRET', errors);
    validateMinLength('BETTER_AUTH_SECRET', authSecret, 32, errors);

    const encryptionKey = requireVar('ENCRYPTION_MASTER_KEY', errors);
    validateBase64Key32('ENCRYPTION_MASTER_KEY', encryptionKey, errors);

    if (isProd) {
      const origins = requireVar('CORS_ALLOWED_ORIGINS', errors);
      validateCommaList('CORS_ALLOWED_ORIGINS', origins, errors);
    }
  }

  if (service === 'all' || service === 'agents') {
    // AgentOS (FastAPI)
    requireVar('DATABASE_URL', errors);
    validateUrl('DATABASE_URL', process.env.DATABASE_URL, errors);

    const encryptionKey = requireVar('ENCRYPTION_MASTER_KEY', errors);
    validateBase64Key32('ENCRYPTION_MASTER_KEY', encryptionKey, errors);
  }
}

function main() {
  const { service, mode } = parseArgs(process.argv.slice(2));

  const errors = [];
  validateService(service, mode, errors);

  // Optional hints
  if (service === 'all' || service === 'api' || service === 'agents') {
    const redis = process.env.REDIS_URL;
    if (isTruthy(redis)) {
      try {
        // eslint-disable-next-line no-new
        new URL(redis);
      } catch {
        errors.push(`Invalid URL for REDIS_URL: ${redis}`);
      }
    }
  }

  if (errors.length > 0) {
    console.error('[validate-env] Environment validation failed:\n');
    for (const err of errors) console.error(`- ${err}`);
    console.error('\n[validate-env] Fix the above and re-run.');
    process.exitCode = 1;
    return;
  }

  // Add a tiny entropy signal for secrets (non-binding).
  if (isTruthy(process.env.BETTER_AUTH_SECRET)) {
    const entropyHint = crypto
      .createHash('sha256')
      .update(String(process.env.BETTER_AUTH_SECRET))
      .digest('hex')
      .slice(0, 8);
    console.log(`[validate-env] OK (service=${service}, mode=${mode}) authSecretHashPrefix=${entropyHint}`);
    return;
  }

  console.log(`[validate-env] OK (service=${service}, mode=${mode})`);
}

main();

