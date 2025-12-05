/**
 * Rate Limiting Middleware for Next.js API Routes
 *
 * Provides configurable rate limiting to prevent abuse and DoS attacks.
 * Uses the existing rate-limit utility for the actual limiting logic.
 *
 * Features:
 * - Configurable limits per route
 * - User-based or IP-based rate limiting
 * - Standard rate limit headers (X-RateLimit-*)
 * - Composable with other middleware
 *
 * @module with-rate-limit
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/utils/rate-limit'
import type { AuthContext } from './with-auth'

/**
 * Rate limit configuration options
 */
export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number
  /** Time window in seconds */
  windowSeconds: number
  /** Key prefix for rate limit bucket (e.g., 'api:businesses') */
  keyPrefix: string
  /** Use user ID for rate limiting (requires auth middleware first) */
  byUser?: boolean
  /** Custom key generator function */
  keyGenerator?: (req: NextRequest, context?: AuthContext) => string
}

/**
 * Default rate limit configurations for different API types
 */
export const RATE_LIMIT_CONFIGS = {
  /** Standard API routes: 100 requests per minute */
  standard: {
    limit: 100,
    windowSeconds: 60,
    keyPrefix: 'api:standard',
  } satisfies Partial<RateLimitConfig>,

  /** Sensitive operations: 10 requests per minute */
  sensitive: {
    limit: 10,
    windowSeconds: 60,
    keyPrefix: 'api:sensitive',
  } satisfies Partial<RateLimitConfig>,

  /** File uploads: 20 requests per 5 minutes */
  upload: {
    limit: 20,
    windowSeconds: 300,
    keyPrefix: 'api:upload',
  } satisfies Partial<RateLimitConfig>,

  /** AI operations: 30 requests per minute */
  ai: {
    limit: 30,
    windowSeconds: 60,
    keyPrefix: 'api:ai',
  } satisfies Partial<RateLimitConfig>,

  /** Authentication: 5 attempts per 15 minutes */
  auth: {
    limit: 5,
    windowSeconds: 900,
    keyPrefix: 'api:auth',
  } satisfies Partial<RateLimitConfig>,
} as const

/**
 * Extract client identifier for rate limiting
 *
 * @param req - Next.js request
 * @param context - Optional auth context
 * @returns Client identifier string
 */
function getClientIdentifier(req: NextRequest, context?: AuthContext): string {
  // Prefer user ID if available (more accurate for authenticated users)
  if (context?.user?.id) {
    return `user:${context.user.id}`
  }

  // Fall back to IP address
  const forwardedFor = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown'

  return `ip:${ip}`
}

/**
 * Add rate limit headers to response
 *
 * @param response - Response to add headers to
 * @param limit - Maximum allowed requests
 * @param remaining - Remaining requests in window
 * @param resetAt - When the window resets
 * @returns Response with headers added
 */
function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  resetAt: Date
): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(limit))
  response.headers.set('X-RateLimit-Remaining', String(remaining))
  response.headers.set('X-RateLimit-Reset', String(Math.floor(resetAt.getTime() / 1000)))
  return response
}

/**
 * Rate limiting middleware for Next.js API routes
 *
 * @param config - Rate limit configuration
 * @param handler - Route handler to wrap
 * @returns Wrapped handler with rate limiting
 *
 * @example
 * ```typescript
 * // Basic usage with default config
 * export const GET = withRateLimit(
 *   { ...RATE_LIMIT_CONFIGS.standard, keyPrefix: 'api:businesses' },
 *   async (req) => {
 *     return NextResponse.json({ data: [] })
 *   }
 * )
 * ```
 *
 * @example
 * ```typescript
 * // With authentication (rate limit by user)
 * export const POST = withAuth(
 *   withRateLimit(
 *     { ...RATE_LIMIT_CONFIGS.sensitive, keyPrefix: 'api:delete', byUser: true },
 *     async (req, { user }) => {
 *       // Handler with user context
 *     }
 *   )
 * )
 * ```
 */
export function withRateLimit<T>(
  config: RateLimitConfig,
  handler: (req: NextRequest, ...args: any[]) => Promise<T> | T
) {
  return async (req: NextRequest, ...args: any[]) => {
    // Extract context if available (from withAuth middleware)
    const context = args[0] as AuthContext | undefined

    // Generate rate limit key
    const clientId = config.keyGenerator
      ? config.keyGenerator(req, context)
      : getClientIdentifier(req, config.byUser ? context : undefined)

    const rateLimitKey = `${config.keyPrefix}:${clientId}`

    // Check rate limit
    const { isRateLimited, remaining, resetAt, retryAfter } = checkRateLimit(
      rateLimitKey,
      config.limit,
      config.windowSeconds
    )

    // If rate limited, return 429 response
    if (isRateLimited) {
      const response = NextResponse.json(
        {
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Please retry after ${retryAfter} seconds.`,
          retryAfter,
        },
        { status: 429 }
      )

      addRateLimitHeaders(response, config.limit, 0, resetAt)
      response.headers.set('Retry-After', String(retryAfter))

      return response
    }

    // Execute handler
    const result = await handler(req, ...args)

    // Add rate limit headers to successful responses
    if (result instanceof NextResponse) {
      addRateLimitHeaders(result, config.limit, remaining, resetAt)
    }

    return result
  }
}

/**
 * Convenience function to create rate limited handler with standard config
 *
 * @param keyPrefix - Unique key prefix for this route
 * @param handler - Route handler
 * @returns Rate limited handler
 */
export function withStandardRateLimit<T>(
  keyPrefix: string,
  handler: (req: NextRequest, ...args: any[]) => Promise<T> | T
) {
  return withRateLimit(
    { ...RATE_LIMIT_CONFIGS.standard, keyPrefix },
    handler
  )
}

/**
 * Convenience function for sensitive operations with strict limits
 *
 * @param keyPrefix - Unique key prefix for this route
 * @param handler - Route handler
 * @returns Rate limited handler
 */
export function withSensitiveRateLimit<T>(
  keyPrefix: string,
  handler: (req: NextRequest, ...args: any[]) => Promise<T> | T
) {
  return withRateLimit(
    { ...RATE_LIMIT_CONFIGS.sensitive, keyPrefix },
    handler
  )
}
