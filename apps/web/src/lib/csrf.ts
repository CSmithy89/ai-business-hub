/**
 * CSRF (Cross-Site Request Forgery) Protection Utilities
 *
 * Story: 10.6 - CSRF Protection
 *
 * This module provides CSRF token generation and verification
 * to protect against cross-site request forgery attacks.
 *
 * Token Generation:
 * - HMAC-SHA256 based on session ID and server secret
 * - Deterministic: same session always generates same token
 * - Tied to user session for security
 *
 * @module csrf
 */

import crypto from 'crypto'

/**
 * CSRF token length in bytes (before hex encoding)
 */
const CSRF_TOKEN_BYTES = 32

/**
 * Minimum required length for CSRF secret
 */
const MIN_SECRET_LENGTH = 32

/**
 * Cookie name for CSRF token
 */
export const CSRF_COOKIE_NAME = 'hyvve_csrf_token'

/**
 * Header name for CSRF token
 */
export const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Get CSRF secret from environment
 * Falls back to BETTER_AUTH_SECRET if CSRF_SECRET not set
 *
 * @returns CSRF secret string
 * @throws Error if no secret is configured
 */
export function getCSRFSecret(): string {
  const secret = process.env.CSRF_SECRET || process.env.BETTER_AUTH_SECRET

  if (!secret) {
    throw new Error(
      'CSRF protection requires CSRF_SECRET or BETTER_AUTH_SECRET environment variable'
    )
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    console.warn(
      `CSRF secret should be at least ${MIN_SECRET_LENGTH} characters for security`
    )
  }

  return secret
}

/**
 * Generate a CSRF token for a given session
 *
 * Uses HMAC-SHA256 to create a deterministic token based on:
 * - Session ID (unique per user session)
 * - Server secret (prevents token forgery)
 *
 * @param sessionId - The user's session ID
 * @returns Hex-encoded CSRF token
 *
 * @example
 * ```typescript
 * const token = generateCSRFToken(session.id)
 * // Returns: "a1b2c3d4e5f6..."
 * ```
 */
export function generateCSRFToken(sessionId: string): string {
  if (!sessionId) {
    throw new Error('Session ID is required to generate CSRF token')
  }

  const secret = getCSRFSecret()
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(sessionId)
  hmac.update('csrf') // Additional salt to separate from other HMAC uses

  return hmac.digest('hex')
}

/**
 * Verify a CSRF token against the expected value
 *
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param token - The token received from client
 * @param sessionId - The user's session ID
 * @returns True if token is valid, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = verifyCSRFToken(requestToken, session.id)
 * if (!isValid) {
 *   return Response.json({ error: 'Invalid CSRF token' }, { status: 403 })
 * }
 * ```
 */
export function verifyCSRFToken(token: string, sessionId: string): boolean {
  if (!token || !sessionId) {
    return false
  }

  try {
    const expected = generateCSRFToken(sessionId)

    // Decode hex strings into buffers first; this ensures we compare
    // byte lengths and avoid timingSafeEqual throwing for differing sizes.
    const tokenBuf = Buffer.from(token, 'hex')
    const expectedBuf = Buffer.from(expected, 'hex')

    if (tokenBuf.length !== expectedBuf.length) {
      return false
    }

    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(tokenBuf, expectedBuf)
  } catch {
    // Handle invalid hex strings or other errors
    return false
  }
}

/**
 * Generate a cryptographically secure random token
 * Used for one-time tokens or when session-based token isn't suitable
 *
 * @returns Hex-encoded random token
 */
export function generateRandomToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_BYTES).toString('hex')
}

/**
 * Routes that should be excluded from CSRF protection
 * These are typically:
 * - OAuth callbacks (handled by OAuth provider)
 * - Webhook endpoints (use signature verification instead)
 * - Public endpoints that don't change state
 */
export const CSRF_EXEMPT_ROUTES = [
  // OAuth callbacks
  '/api/auth/callback',
  // Webhooks (should use signature verification)
  '/api/webhooks',
  // Better-auth internal routes
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/signout',
  '/api/auth/session',
  '/api/auth/error',
  '/api/auth/verify-request',
  // CSRF token endpoint itself
  '/api/auth/csrf-token',
] as const

/**
 * Check if a route is exempt from CSRF protection
 *
 * @param pathname - The request pathname
 * @returns True if route is exempt
 */
export function isCSRFExemptRoute(pathname: string): boolean {
  return CSRF_EXEMPT_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

/**
 * HTTP methods that are considered "safe" and don't need CSRF protection
 * Per RFC 7231, these methods should not change server state
 */
export const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'] as const

/**
 * Check if HTTP method is safe (doesn't need CSRF protection)
 *
 * @param method - HTTP method
 * @returns True if method is safe
 */
export function isSafeMethod(method: string): boolean {
  if (!method || typeof method !== 'string') {
    return false
  }
  return (SAFE_METHODS as readonly string[]).includes(method.toUpperCase())
}
