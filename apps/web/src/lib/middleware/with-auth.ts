/**
 * Authentication middleware for Next.js API routes
 * Validates better-auth session and extracts user information
 *
 * @module with-auth
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import type { User } from '@hyvve/db'

/**
 * Authentication context passed to route handlers
 * Contains authenticated user information
 */
export interface AuthContext {
  /** Authenticated user from session */
  user: User
}

/**
 * Route handler that receives authentication context
 *
 * @template T - Response type
 * @param req - Next.js request object
 * @param context - Authentication context with user
 * @param args - Additional arguments (e.g., params for dynamic routes)
 * @returns Response or Promise of response
 */
export type AuthHandler<T = any> = (
  req: NextRequest,
  context: AuthContext,
  ...args: any[]
) => Promise<T> | T

/**
 * Authentication middleware for Next.js API routes
 * Validates better-auth session and extracts user
 *
 * Usage:
 * - Wraps route handlers to enforce authentication
 * - Returns 401 if no valid session exists
 * - Passes user object to handler in context
 *
 * @param handler - Route handler that requires authentication
 * @returns Wrapped handler with authentication check
 *
 * @example
 * ```typescript
 * export const GET = withAuth(async (req, { user }) => {
 *   return NextResponse.json({ userId: user.id })
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Composable with other middleware
 * export const POST = withAuth(
 *   withTenant(async (req, { user, workspace }) => {
 *     // Handler with both user and workspace context
 *   })
 * )
 * ```
 */
export function withAuth<T>(handler: AuthHandler<T>) {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      // Get session from better-auth
      const session = await auth.api.getSession({ headers: req.headers })

      // Validate session and user
      if (!session?.user) {
        return NextResponse.json(
          {
            error: 'Unauthorized',
            message: 'Valid session required',
          },
          { status: 401 }
        )
      }

      // Pass user to handler in context
      const context: AuthContext = {
        user: session.user as User,
      }

      return handler(req, context, ...args)
    } catch (error) {
      console.error('Authentication error:', error)
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Failed to validate session',
        },
        { status: 401 }
      )
    }
  }
}
