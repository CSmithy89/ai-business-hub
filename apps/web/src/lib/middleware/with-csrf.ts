/**
 * CSRF Protection Middleware for Next.js API Routes
 *
 * Story: 10.6 - CSRF Protection
 *
 * Validates CSRF tokens on state-changing requests (POST, PUT, DELETE, PATCH)
 * to prevent cross-site request forgery attacks.
 *
 * Usage:
 * - Compose with withAuth to protect authenticated routes
 * - Token validation requires valid session
 * - Returns 403 for missing or invalid tokens
 *
 * @module with-csrf
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  verifyCSRFToken,
  isCSRFExemptRoute,
  isSafeMethod,
  CSRF_HEADER_NAME,
} from '@/lib/csrf'
import type { AuthContext } from './with-auth'

/**
 * CSRF validation result
 */
export interface CSRFValidationResult {
  valid: boolean
  error?: string
}

/**
 * Route handler that requires CSRF protection
 * Must be composed with withAuth (needs session for token validation)
 */
export type CSRFHandler<T = NextResponse | Response> = (
  req: NextRequest,
  context: AuthContext,
  ...args: unknown[]
) => Promise<T> | T

/**
 * Extract CSRF token from request
 *
 * Checks in order:
 * 1. X-CSRF-Token header
 * 2. x-csrf-token header (lowercase)
 * 3. Request body (for form submissions)
 *
 * @param req - Next.js request
 * @returns CSRF token or null
 */
export function extractCSRFToken(req: NextRequest): string | null {
  // Check header (preferred method for AJAX/fetch requests)
  const headerToken =
    req.headers.get(CSRF_HEADER_NAME) ||
    req.headers.get(CSRF_HEADER_NAME.toLowerCase()) ||
    req.headers.get('X-XSRF-Token') ||
    req.headers.get('x-xsrf-token')

  if (headerToken) {
    return headerToken
  }

  // For form submissions, token might be in the body
  // But we can't read body here without consuming it
  // So form submissions should use header or rely on SameSite cookies
  return null
}

/**
 * Get session ID from better-auth session cookie
 *
 * @param req - Next.js request
 * @returns Session ID or null
 */
function getSessionIdFromCookie(req: NextRequest): string | null {
  const sessionCookie = req.cookies.get('hyvve.session_token')
  return sessionCookie?.value || null
}

/**
 * CSRF protection middleware for Next.js API routes
 *
 * Validates CSRF tokens on state-changing requests to prevent
 * cross-site request forgery attacks.
 *
 * Features:
 * - Validates token against session ID
 * - Skips safe methods (GET, HEAD, OPTIONS)
 * - Skips exempt routes (OAuth callbacks, webhooks)
 * - Returns 403 Forbidden for invalid/missing tokens
 *
 * Must be used AFTER withAuth since it requires session context.
 *
 * @param handler - Route handler to protect
 * @returns Wrapped handler with CSRF protection
 *
 * @example
 * ```typescript
 * // Protected route with CSRF validation
 * export const POST = withAuth(
 *   withCSRF(async (req, { user }) => {
 *     // Handler is only called if CSRF token is valid
 *     return NextResponse.json({ success: true })
 *   })
 * )
 * ```
 */
export function withCSRF<T>(handler: CSRFHandler<T>) {
  return async (req: NextRequest, context: AuthContext, ...args: unknown[]) => {
    const { pathname } = req.nextUrl
    const method = req.method

    // Skip CSRF check for safe methods (GET, HEAD, OPTIONS)
    if (isSafeMethod(method)) {
      return handler(req, context, ...args)
    }

    // Skip CSRF check for exempt routes
    if (isCSRFExemptRoute(pathname)) {
      return handler(req, context, ...args)
    }

    // Get session ID for token validation
    const sessionId = getSessionIdFromCookie(req)

    if (!sessionId) {
      // No session means withAuth should have already rejected
      // But we check anyway for defense in depth
      return NextResponse.json(
        {
          error: {
            code: 'CSRF_NO_SESSION',
            message: 'Session required for CSRF validation',
          },
        },
        { status: 403 }
      )
    }

    // Extract CSRF token from request
    const token = extractCSRFToken(req)

    if (!token) {
      return NextResponse.json(
        {
          error: {
            code: 'CSRF_TOKEN_MISSING',
            message: 'CSRF token is required for this request',
            hint: `Include token in ${CSRF_HEADER_NAME} header`,
          },
        },
        { status: 403 }
      )
    }

    // Verify token
    const isValid = verifyCSRFToken(token, sessionId)

    if (!isValid) {
      return NextResponse.json(
        {
          error: {
            code: 'CSRF_TOKEN_INVALID',
            message: 'Invalid CSRF token',
            hint: 'Token may have expired or session changed',
          },
        },
        { status: 403 }
      )
    }

    // Token is valid, proceed to handler
    return handler(req, context, ...args)
  }
}

/**
 * Standalone CSRF validation for routes that don't use withAuth
 * Uses session cookie directly for token validation
 *
 * @param req - Next.js request
 * @returns Validation result
 */
export function validateCSRF(req: NextRequest): CSRFValidationResult {
  const { pathname } = req.nextUrl
  const method = req.method

  // Skip safe methods
  if (isSafeMethod(method)) {
    return { valid: true }
  }

  // Skip exempt routes
  if (isCSRFExemptRoute(pathname)) {
    return { valid: true }
  }

  // Get session ID
  const sessionId = getSessionIdFromCookie(req)
  if (!sessionId) {
    return { valid: false, error: 'Session required for CSRF validation' }
  }

  // Get token
  const token = extractCSRFToken(req)
  if (!token) {
    return { valid: false, error: 'CSRF token is required' }
  }

  // Verify
  const isValid = verifyCSRFToken(token, sessionId)
  if (!isValid) {
    return { valid: false, error: 'Invalid CSRF token' }
  }

  return { valid: true }
}
