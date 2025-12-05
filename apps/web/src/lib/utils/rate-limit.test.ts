/**
 * Rate Limiter Tests
 * Story 09: Tests for rate limiting with in-memory fallback behavior
 *
 * Note: Redis tests would require a test Redis instance.
 * These tests focus on in-memory fallback behavior.
 *
 * @module rate-limit.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Upstash modules before importing rate-limit
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(() => ({
    del: vi.fn(),
  })),
}))

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: vi.fn(() => ({
    limit: vi.fn(),
  })),
}))

// Store original env
const originalEnv = { ...process.env }

describe('Rate Limiter - In-Memory Mode', () => {
  beforeEach(async () => {
    // Reset modules to ensure clean state
    vi.resetModules()

    // Clear env to force in-memory mode
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv }
  })

  it('should allow requests under the limit', async () => {
    const { checkRateLimit } = await import('./rate-limit')

    const key = `test:${Date.now()}`
    const limit = 5
    const windowSeconds = 60

    // First request should pass
    const result = await checkRateLimit(key, limit, windowSeconds)

    expect(result.isRateLimited).toBe(false)
    expect(result.remaining).toBe(4) // 5 - 1 = 4
    expect(result.resetAt).toBeInstanceOf(Date)
    expect(result.retryAfter).toBeUndefined()
  })

  it('should track multiple requests correctly', async () => {
    const { checkRateLimit } = await import('./rate-limit')

    const key = `test:multiple:${Date.now()}`
    const limit = 5
    const windowSeconds = 60

    // Make 3 requests
    await checkRateLimit(key, limit, windowSeconds)
    await checkRateLimit(key, limit, windowSeconds)
    const result = await checkRateLimit(key, limit, windowSeconds)

    expect(result.isRateLimited).toBe(false)
    expect(result.remaining).toBe(2) // 5 - 3 = 2
  })

  it('should block requests when limit is exceeded', async () => {
    const { checkRateLimit } = await import('./rate-limit')

    const key = `test:exceed:${Date.now()}`
    const limit = 3
    const windowSeconds = 60

    // Make requests up to and exceeding limit
    await checkRateLimit(key, limit, windowSeconds) // 1
    await checkRateLimit(key, limit, windowSeconds) // 2
    await checkRateLimit(key, limit, windowSeconds) // 3
    const result = await checkRateLimit(key, limit, windowSeconds) // 4 - exceeds

    expect(result.isRateLimited).toBe(true)
    expect(result.remaining).toBe(0)
    expect(result.retryAfter).toBeGreaterThan(0)
    expect(result.retryAfter).toBeLessThanOrEqual(windowSeconds)
  })

  it('should use default values when not specified', async () => {
    const { checkRateLimit, DEFAULT_RATE_LIMIT_MAX_ATTEMPTS } = await import('./rate-limit')

    const key = `test:defaults:${Date.now()}`

    const result = await checkRateLimit(key)

    expect(result.remaining).toBe(DEFAULT_RATE_LIMIT_MAX_ATTEMPTS - 1)
  })

  it('should isolate rate limits by key', async () => {
    const { checkRateLimit } = await import('./rate-limit')

    const key1 = `test:isolate:user1:${Date.now()}`
    const key2 = `test:isolate:user2:${Date.now()}`
    const limit = 2

    // Exhaust limit for key1
    await checkRateLimit(key1, limit, 60)
    await checkRateLimit(key1, limit, 60)
    const result1 = await checkRateLimit(key1, limit, 60)

    // key2 should still have full quota
    const result2 = await checkRateLimit(key2, limit, 60)

    expect(result1.isRateLimited).toBe(true)
    expect(result2.isRateLimited).toBe(false)
    expect(result2.remaining).toBe(1)
  })
})

describe('Rate Limiter - Synchronous Check', () => {
  beforeEach(async () => {
    vi.resetModules()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('should work synchronously for in-memory mode', async () => {
    const { checkRateLimitSync } = await import('./rate-limit')

    const key = `test:sync:${Date.now()}`
    const limit = 5

    const result = checkRateLimitSync(key, limit, 60)

    expect(result.isRateLimited).toBe(false)
    expect(result.remaining).toBe(4)
  })

  it('should share state with async function', async () => {
    const { checkRateLimit, checkRateLimitSync } = await import('./rate-limit')

    const key = `test:shared:${Date.now()}`
    const limit = 3

    // Use async first - 3 calls to reach limit
    await checkRateLimit(key, limit, 60)
    await checkRateLimit(key, limit, 60)
    await checkRateLimit(key, limit, 60)

    // Use sync - should see same state (4th call exceeds limit)
    const result = checkRateLimitSync(key, limit, 60)

    // isRateLimited = count > limit (4 > 3 = true)
    expect(result.isRateLimited).toBe(true)
    expect(result.remaining).toBe(0)
  })
})

describe('Rate Limiter - Info and Reset', () => {
  beforeEach(async () => {
    vi.resetModules()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('should get rate limit info without incrementing', async () => {
    const { checkRateLimit, getRateLimitInfo } = await import('./rate-limit')

    const key = `test:info:${Date.now()}`

    // Make some requests
    await checkRateLimit(key, 5, 60)
    await checkRateLimit(key, 5, 60)

    // Get info without incrementing
    const info1 = getRateLimitInfo(key)
    const info2 = getRateLimitInfo(key)

    expect(info1.count).toBe(2)
    expect(info2.count).toBe(2) // Should not have incremented
    expect(info1.resetAt).toBeInstanceOf(Date)
  })

  it('should return empty info for unknown key', async () => {
    const { getRateLimitInfo } = await import('./rate-limit')

    const info = getRateLimitInfo('unknown:key')

    expect(info.count).toBe(0)
    expect(info.resetAt).toBeNull()
  })

  it('should reset rate limit for a key', async () => {
    const { checkRateLimit, resetRateLimit, getRateLimitInfo } = await import('./rate-limit')

    const key = `test:reset:${Date.now()}`

    // Exhaust limit
    await checkRateLimit(key, 2, 60)
    await checkRateLimit(key, 2, 60)
    const beforeReset = await checkRateLimit(key, 2, 60)

    expect(beforeReset.isRateLimited).toBe(true)

    // Reset
    await resetRateLimit(key)

    // Should have full quota again
    const afterReset = await checkRateLimit(key, 2, 60)
    expect(afterReset.isRateLimited).toBe(false)
    expect(afterReset.remaining).toBe(1)

    // Info should show fresh state
    const info = getRateLimitInfo(key)
    expect(info.count).toBe(1)
  })
})

describe('Rate Limiter - Pre-configured Limiters', () => {
  beforeEach(async () => {
    vi.resetModules()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('should provide 2FA rate limiter (5 per 15 min)', async () => {
    const { checkTwoFactorRateLimit } = await import('./rate-limit')

    const identifier = `test:2fa:${Date.now()}`

    // Should allow 5 attempts
    for (let i = 0; i < 5; i++) {
      const result = await checkTwoFactorRateLimit(identifier)
      expect(result.isRateLimited).toBe(false)
    }

    // 6th should be blocked
    const blocked = await checkTwoFactorRateLimit(identifier)
    expect(blocked.isRateLimited).toBe(true)
  })

  it('should provide password reset rate limiter (3 per hour)', async () => {
    const { checkPasswordResetRateLimit } = await import('./rate-limit')

    const identifier = `test:pwreset:${Date.now()}`

    // Should allow 3 attempts
    for (let i = 0; i < 3; i++) {
      const result = await checkPasswordResetRateLimit(identifier)
      expect(result.isRateLimited).toBe(false)
    }

    // 4th should be blocked
    const blocked = await checkPasswordResetRateLimit(identifier)
    expect(blocked.isRateLimited).toBe(true)
  })

  it('should provide email resend rate limiter (3 per 5 min)', async () => {
    const { checkEmailResendRateLimit } = await import('./rate-limit')

    const identifier = `test:email:${Date.now()}`

    // Should allow 3 attempts
    for (let i = 0; i < 3; i++) {
      const result = await checkEmailResendRateLimit(identifier)
      expect(result.isRateLimited).toBe(false)
    }

    // 4th should be blocked
    const blocked = await checkEmailResendRateLimit(identifier)
    expect(blocked.isRateLimited).toBe(true)
  })

  it('should provide login rate limiter (10 per 15 min)', async () => {
    const { checkLoginRateLimit } = await import('./rate-limit')

    const identifier = `test:login:${Date.now()}`

    // Should allow 10 attempts
    for (let i = 0; i < 10; i++) {
      const result = await checkLoginRateLimit(identifier)
      expect(result.isRateLimited).toBe(false)
    }

    // 11th should be blocked
    const blocked = await checkLoginRateLimit(identifier)
    expect(blocked.isRateLimited).toBe(true)
  })

  it('should provide API rate limiter (100 per minute)', async () => {
    const { checkApiRateLimit } = await import('./rate-limit')

    const identifier = `test:api:${Date.now()}`

    const result = await checkApiRateLimit(identifier)

    expect(result.isRateLimited).toBe(false)
    expect(result.remaining).toBe(99)
  })
})

describe('Rate Limiter - Distributed Mode Detection', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('should detect when Redis is not configured', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN

    const { isDistributedRateLimitingEnabled } = await import('./rate-limit')

    expect(isDistributedRateLimitingEnabled()).toBe(false)
  })
})

describe('Rate Limiter - Edge Cases', () => {
  beforeEach(async () => {
    vi.resetModules()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('should handle zero limit', async () => {
    const { checkRateLimit } = await import('./rate-limit')

    const key = `test:zero:${Date.now()}`

    // Even first request should be blocked
    const result = await checkRateLimit(key, 0, 60)

    expect(result.isRateLimited).toBe(true)
    expect(result.remaining).toBe(0)
  })

  it('should handle very short window', async () => {
    const { checkRateLimit } = await import('./rate-limit')

    const key = `test:short:${Date.now()}`

    const result = await checkRateLimit(key, 5, 1) // 1 second window

    expect(result.isRateLimited).toBe(false)
    expect(result.resetAt.getTime()).toBeLessThanOrEqual(Date.now() + 1000)
  })

  it('should handle concurrent requests correctly', async () => {
    const { checkRateLimit } = await import('./rate-limit')

    const key = `test:concurrent:${Date.now()}`
    const limit = 5

    // Make concurrent requests
    const results = await Promise.all([
      checkRateLimit(key, limit, 60),
      checkRateLimit(key, limit, 60),
      checkRateLimit(key, limit, 60),
      checkRateLimit(key, limit, 60),
      checkRateLimit(key, limit, 60),
    ])

    // All 5 should pass
    const passedCount = results.filter((r) => !r.isRateLimited).length
    expect(passedCount).toBe(5)

    // Next request should be blocked
    const nextResult = await checkRateLimit(key, limit, 60)
    expect(nextResult.isRateLimited).toBe(true)
  })
})
