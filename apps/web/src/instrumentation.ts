/**
 * Next.js Instrumentation Hook
 * Story 10.2: Encryption Key Validation
 *
 * This file runs BEFORE any modules are loaded, ensuring critical
 * environment validation happens at the earliest possible point.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import { validateEncryptionKeyOnStartup } from './lib/utils/validate-encryption-key'

/**
 * Called when the Next.js server is initializing.
 * Runs before any page or API route is processed.
 */
export async function register() {
  // Instrumentation can run in edge/browser contexts in some configurations
  // Only validate on server-side to avoid client-side errors
  if (typeof window === 'undefined') {
    // Validate encryption key before anything else
    // This ensures the app fails fast in production with weak keys
    validateEncryptionKeyOnStartup()
  }
}
