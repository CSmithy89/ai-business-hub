/**
 * CSRF Token Endpoint
 *
 * Story: 10.6 - CSRF Protection
 *
 * Provides CSRF tokens for authenticated users.
 * Token is tied to the user's session for security.
 *
 * @route GET /api/auth/csrf-token
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateCSRFToken, CSRF_COOKIE_NAME } from '@/lib/csrf'

/**
 * Get CSRF token for authenticated session
 *
 * Returns the CSRF token that should be included in
 * state-changing requests (POST, PUT, DELETE, PATCH).
 *
 * Token is:
 * - Deterministically generated from session ID
 * - Valid for the lifetime of the session
 * - Must match the session cookie
 */
export async function GET(req: NextRequest) {
  try {
    // Get session from better-auth
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.session?.id) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Valid session required to get CSRF token',
          },
        },
        { status: 401 }
      )
    }

    // Get session token from cookie (used for CSRF generation)
    const sessionToken = req.cookies.get('hyvve.session_token')?.value

    if (!sessionToken) {
      return NextResponse.json(
        {
          error: {
            code: 'NO_SESSION_TOKEN',
            message: 'Session token cookie not found',
          },
        },
        { status: 401 }
      )
    }

    // Generate CSRF token from session token
    const csrfToken = generateCSRFToken(sessionToken)

    // Create response with token
    const response = NextResponse.json({
      csrfToken,
      expiresAt: session.session.expiresAt,
    })

    // Also set as a cookie for convenience (can be read by JS)
    // This is a non-httpOnly cookie so JavaScript can read it
    // Calculate maxAge dynamically from session expiry
    const sessionExpiresAt = new Date(session.session.expiresAt).getTime()
    const maxAgeSeconds = Math.max(0, Math.floor((sessionExpiresAt - Date.now()) / 1000))

    response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false, // Must be readable by JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      // Token expires when session expires (calculated dynamically)
      maxAge: maxAgeSeconds,
    })

    return response
  } catch (error) {
    console.error('Error generating CSRF token:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate CSRF token',
        },
      },
      { status: 500 }
    )
  }
}
