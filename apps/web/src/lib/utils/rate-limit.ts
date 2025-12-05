/**
 * In-memory rate limiter for MVP
 *
 * For production, consider using Redis-backed rate limiting
 * with a library like `@upstash/ratelimit` or implementing
 * a custom Redis solution.
 */

interface RateLimitEntry {
  count: number
  resetAt: number // Unix timestamp in milliseconds
}

// In-memory store (cleared on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>()
const MAX_ENTRIES = 10000 // Prevent unbounded memory growth

/**
 * Clean up expired entries and enforce max entries
 */
function cleanupRateLimits() {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
  // Enforce max entries if still over limit
  if (rateLimitStore.size > MAX_ENTRIES) {
    const entries = Array.from(rateLimitStore.entries())
    entries.sort((a, b) => a[1].resetAt - b[1].resetAt) // Oldest first
    const toRemove = entries.slice(0, rateLimitStore.size - MAX_ENTRIES)
    for (const [key] of toRemove) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Clean up expired entries periodically (every 5 minutes)
 */
setInterval(cleanupRateLimits, 5 * 60 * 1000)

/**
 * Check if a rate limit key has exceeded the limit
 *
 * @param key - Unique identifier for rate limiting (e.g., `resend:user@example.com`)
 * @param limit - Maximum number of attempts allowed
 * @param windowSeconds - Time window in seconds
 * @returns Object with whether rate limited and retry information
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): {
  isRateLimited: boolean
  remaining: number
  resetAt: Date
  retryAfter?: number // Seconds until reset
} {
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  let entry = rateLimitStore.get(key)

  // If entry doesn't exist or window has expired, create new entry
  if (!entry || entry.resetAt < now) {
    // Ensure capacity before adding new entry
    if (rateLimitStore.size >= MAX_ENTRIES && !rateLimitStore.has(key)) {
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

/**
 * Get current rate limit info without incrementing counter
 *
 * @param key - Rate limit key
 * @returns Current rate limit status
 */
export function getRateLimitInfo(key: string): {
  count: number
  resetAt: Date | null
} {
  const entry = rateLimitStore.get(key)

  if (!entry) {
    return {
      count: 0,
      resetAt: null,
    }
  }

  const now = Date.now()
  if (entry.resetAt < now) {
    rateLimitStore.delete(key)
    return {
      count: 0,
      resetAt: null,
    }
  }

  return {
    count: entry.count,
    resetAt: new Date(entry.resetAt),
  }
}

/**
 * Reset rate limit for a specific key
 * Useful for testing or manual resets
 *
 * @param key - Rate limit key to reset
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key)
}
