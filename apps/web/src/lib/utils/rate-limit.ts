/**
 * Unified Rate Limiter with Redis (Upstash) and In-Memory Fallback
 *
 * Production: Uses Upstash Redis for distributed rate limiting across instances
 * Development: Falls back to in-memory Map when Redis is not configured
 *
 * Environment Variables:
 * - UPSTASH_REDIS_REST_URL: Upstash Redis REST API URL
 * - UPSTASH_REDIS_REST_TOKEN: Upstash Redis REST API token
 *
 * @module rate-limit
 */

import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// ============================================================================
// Configuration Constants
// ============================================================================

/** Maximum entries in in-memory fallback (prevents unbounded growth) */
export const RATE_LIMIT_MAX_ENTRIES = 10000

/** Default rate limit window in seconds */
export const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 900 // 15 minutes

/** Default maximum attempts per window */
export const DEFAULT_RATE_LIMIT_MAX_ATTEMPTS = 5

// ============================================================================
// Types
// ============================================================================

interface RateLimitEntry {
  count: number
  resetAt: number // Unix timestamp in milliseconds
}

interface RateLimitResult {
  isRateLimited: boolean
  remaining: number
  resetAt: Date
  retryAfter?: number // Seconds until reset
}

interface RateLimitConfig {
  /** Maximum number of attempts allowed in the window */
  limit: number
  /** Time window in seconds */
  windowSeconds: number
}

// ============================================================================
// Redis Client Initialization
// ============================================================================

let redis: Redis | null = null
let isRedisConfigured = false

// Check if Redis is configured at module load
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    isRedisConfigured = true
    console.log('[rate-limit] Redis configured - using distributed rate limiting')
  } catch (error) {
    console.warn('[rate-limit] Failed to initialize Redis, falling back to in-memory:', error)
    redis = null
    isRedisConfigured = false
  }
} else {
  console.log('[rate-limit] Redis not configured - using in-memory rate limiting (NOT production-ready)')
}

// ============================================================================
// Upstash Ratelimit Cache
// ============================================================================

const ratelimitCache = new Map<string, Ratelimit>()

/**
 * Get or create an Upstash Ratelimit instance for the given config
 */
function getRatelimiter(config: RateLimitConfig): Ratelimit | null {
  if (!redis) return null

  const cacheKey = `${config.limit}:${config.windowSeconds}`
  let limiter = ratelimitCache.get(cacheKey)

  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.limit, `${config.windowSeconds} s`),
      analytics: true,
      prefix: 'hyvve:ratelimit',
    })
    ratelimitCache.set(cacheKey, limiter)
  }

  return limiter
}

// ============================================================================
// In-Memory Fallback Storage
// ============================================================================

const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Clean up expired entries and enforce max entries limit
 * @internal
 */
function cleanupRateLimits(): void {
  const now = Date.now()

  // Remove expired entries
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }

  // Enforce max entries if still over limit
  if (rateLimitStore.size > RATE_LIMIT_MAX_ENTRIES) {
    const entries = Array.from(rateLimitStore.entries())
    entries.sort((a, b) => a[1].resetAt - b[1].resetAt) // Oldest first
    const toRemove = entries.slice(0, rateLimitStore.size - RATE_LIMIT_MAX_ENTRIES)
    for (const [key] of toRemove) {
      rateLimitStore.delete(key)
    }
  }
}

// Clean up expired entries periodically (every 5 minutes)
// Only start the interval if we're in a long-running process (not serverless)
if (typeof setInterval !== 'undefined' && !isRedisConfigured) {
  setInterval(cleanupRateLimits, 5 * 60 * 1000)
}

/**
 * In-memory rate limit check (fallback when Redis not available)
 * @internal
 */
function checkRateLimitInMemory(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  let entry = rateLimitStore.get(key)

  // If entry doesn't exist or window has expired, create new entry
  if (!entry || entry.resetAt < now) {
    // Ensure capacity before adding new entry
    if (rateLimitStore.size >= RATE_LIMIT_MAX_ENTRIES && !rateLimitStore.has(key)) {
      cleanupRateLimits()
    }
    entry = {
      count: 0,
      resetAt: now + windowMs,
    }
    rateLimitStore.set(key, entry)
  }

  // Increment count
  entry.count++

  const remaining = Math.max(0, limit - entry.count)
  const isRateLimited = entry.count > limit
  const retryAfter = isRateLimited
    ? Math.ceil((entry.resetAt - now) / 1000)
    : undefined

  return {
    isRateLimited,
    remaining,
    resetAt: new Date(entry.resetAt),
    retryAfter,
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Check if a rate limit key has exceeded the limit
 *
 * Uses Redis when configured, falls back to in-memory for development.
 *
 * @param key - Unique identifier for rate limiting (e.g., `2fa:user@example.com`)
 * @param limit - Maximum number of attempts allowed (default: 5)
 * @param windowSeconds - Time window in seconds (default: 900 = 15 minutes)
 * @returns Object with whether rate limited and retry information
 *
 * @example
 * ```typescript
 * const result = await checkRateLimit(`2fa:${userId}`, 5, 900)
 * if (result.isRateLimited) {
 *   return NextResponse.json(
 *     { error: 'Too many attempts', retryAfter: result.retryAfter },
 *     { status: 429 }
 *   )
 * }
 * ```
 */
export async function checkRateLimit(
  key: string,
  limit: number = DEFAULT_RATE_LIMIT_MAX_ATTEMPTS,
  windowSeconds: number = DEFAULT_RATE_LIMIT_WINDOW_SECONDS
): Promise<RateLimitResult> {
  // Try Redis first if configured
  const limiter = getRatelimiter({ limit, windowSeconds })

  if (limiter) {
    try {
      const result = await limiter.limit(key)

      return {
        isRateLimited: !result.success,
        remaining: result.remaining,
        resetAt: new Date(result.reset),
        retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
      }
    } catch (error) {
      console.warn('[rate-limit] Redis error, falling back to in-memory:', error)
      // Fall through to in-memory
    }
  }

  // In-memory fallback
  return checkRateLimitInMemory(key, limit, windowSeconds)
}

/**
 * Generate standard X-RateLimit-* headers for a given rate limit state.
 *
 * @param limit - Maximum attempts allowed in the window
 * @param remaining - Remaining attempts in the current window
 * @param resetAt - When the window resets
 */
export function generateRateLimitHeaders({
  limit,
  remaining,
  resetAt,
}: {
  limit: number
  remaining: number
  resetAt: Date
}): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.floor(resetAt.getTime() / 1000)),
  }
}

/**
 * Synchronous rate limit check (in-memory only)
 *
 * Use this when you cannot use async/await (e.g., in some middleware).
 * Note: This bypasses Redis and only uses in-memory storage.
 *
 * @param key - Unique identifier for rate limiting
 * @param limit - Maximum number of attempts allowed
 * @param windowSeconds - Time window in seconds
 * @returns Object with whether rate limited and retry information
 *
 * @deprecated Prefer async `checkRateLimit` for production use
 */
export function checkRateLimitSync(
  key: string,
  limit: number = DEFAULT_RATE_LIMIT_MAX_ATTEMPTS,
  windowSeconds: number = DEFAULT_RATE_LIMIT_WINDOW_SECONDS
): RateLimitResult {
  if (isRedisConfigured) {
    console.warn('[rate-limit] checkRateLimitSync called with Redis configured. Use async checkRateLimit instead.')
  }
  return checkRateLimitInMemory(key, limit, windowSeconds)
}

/**
 * Get current rate limit info without incrementing counter
 *
 * Note: Only works with in-memory storage. Redis rate limits cannot be queried
 * without modification due to how sliding window works.
 *
 * @param key - Rate limit key
 * @returns Current rate limit status
 */
export function getRateLimitInfo(key: string): {
  count: number
  resetAt: Date | null
  isRedisConfigured: boolean
} {
  const entry = rateLimitStore.get(key)

  if (!entry) {
    return {
      count: 0,
      resetAt: null,
      isRedisConfigured,
    }
  }

  const now = Date.now()
  if (entry.resetAt < now) {
    rateLimitStore.delete(key)
    return {
      count: 0,
      resetAt: null,
      isRedisConfigured,
    }
  }

  return {
    count: entry.count,
    resetAt: new Date(entry.resetAt),
    isRedisConfigured,
  }
}

/**
 * Reset rate limit for a specific key
 *
 * Works for both in-memory and Redis storage.
 *
 * @param key - Rate limit key to reset
 */
export async function resetRateLimit(key: string): Promise<void> {
  // Clear in-memory
  rateLimitStore.delete(key)

  // Clear Redis if configured
  if (redis) {
    try {
      await redis.del(`hyvve:ratelimit:${key}`)
    } catch (error) {
      console.warn('[rate-limit] Failed to reset Redis rate limit:', error)
    }
  }
}

/**
 * Check if Redis is configured for distributed rate limiting
 * @returns true if Redis/Upstash is configured and available
 */
export function isDistributedRateLimitingEnabled(): boolean {
  return isRedisConfigured
}

// ============================================================================
// Pre-configured Rate Limiters for Common Use Cases
// ============================================================================

/**
 * Rate limit for 2FA verification attempts
 * 5 attempts per 15 minutes
 */
export async function checkTwoFactorRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkRateLimit(`2fa:${identifier}`, 5, 900)
}

/**
 * Rate limit for password reset requests
 * 3 attempts per hour
 */
export async function checkPasswordResetRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkRateLimit(`password-reset:${identifier}`, 3, 3600)
}

/**
 * Rate limit for email verification resends
 * 3 attempts per 5 minutes
 */
export async function checkEmailResendRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkRateLimit(`email-resend:${identifier}`, 3, 300)
}

/**
 * Rate limit for login attempts
 * 10 attempts per 15 minutes
 */
export async function checkLoginRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkRateLimit(`login:${identifier}`, 10, 900)
}

/**
 * Rate limit for API requests (general)
 * 100 requests per minute
 */
export async function checkApiRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkRateLimit(`api:${identifier}`, 100, 60)
}
