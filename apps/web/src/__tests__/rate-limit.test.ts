/**
 * Rate Limit Concurrency Integration Tests
 * Story 14-1: Tests for rate limiting with real Redis using Testcontainers
 *
 * These tests verify:
 * - Concurrent request handling
 * - Sliding window behavior
 * - Rate limit enforcement under load
 * - Multi-user isolation
 * - DDoS simulation
 *
 * @module rate-limit.integration.test
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { RedisContainer, type StartedRedisContainer } from '@testcontainers/redis'
import { Ratelimit } from '@upstash/ratelimit'
import IORedis from 'ioredis'
import { execSync } from 'child_process'
import { generateRateLimitHeaders } from '../lib/utils/rate-limit'

/**
 * Custom Redis adapter for @upstash/ratelimit to work with ioredis.
 * Upstash's REST client cannot connect directly to the Testcontainers Redis instance,
 * so this adapter translates the methods ratelimit expects into standard Redis calls.
 */
class IORedisAdapter {
  private client: IORedis

  constructor(client: IORedis) {
    this.client = client
  }

  async eval<TArgs extends unknown[], TData = unknown>(
    script: string,
    keys: string[],
    args: TArgs
  ): Promise<TData> {
    // Cast args to string/number array as expected by ioredis
    const stringArgs = args.map((arg) => String(arg))
    return this.client.eval(script, keys.length, ...keys, ...stringArgs) as Promise<TData>
  }

  async hgetall<TData extends Record<string, unknown>>(
    key: string
  ): Promise<TData | null> {
    const result = await this.client.hgetall(key)
    if (!result || Object.keys(result).length === 0) return null
    return result as TData
  }
}

/**
 * Check if Docker is available
 */
function isDockerAvailable(): boolean {
  try {
    execSync('docker ps', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

// Skip all tests if Docker is not available
const describeWithDocker = isDockerAvailable() ? describe : describe.skip

describeWithDocker('Rate Limit Concurrency - Integration Tests with Real Redis', () => {
  let redisContainer: StartedRedisContainer
  let redisClient: IORedis
  let redisAdapter: IORedisAdapter

  // Setup: Start Redis container before all tests
  beforeAll(async () => {
    console.log('[Test Setup] Starting Redis container...')
    redisContainer = await new RedisContainer('redis:7-alpine').start()

    const host = redisContainer.getHost()
    const port = redisContainer.getFirstMappedPort()
    console.log(`[Test Setup] Redis container started: ${host}:${port}`)

    redisClient = new IORedis({
      host,
      port,
      maxRetriesPerRequest: null,
    })
    redisAdapter = new IORedisAdapter(redisClient)
  }, 120000) // 2 minute timeout for container startup

  // Cleanup: Stop Redis container after all tests
  afterAll(async () => {
    console.log('[Test Cleanup] Stopping Redis container...')
    await redisClient?.quit()
    await redisContainer?.stop()
  }, 60000)

  // Clear Redis before each test to ensure clean state
  beforeEach(async () => {
    await redisClient.flushdb()
  })

  // ============================================================================
  // AC2 & AC3: Concurrent Requests & Rate Limit Enforcement
  // ============================================================================

  describe('AC2 & AC3: Concurrent Request Handling', () => {
    it('should enforce rate limit under concurrent load (100 requests)', async () => {
      const limiter = new Ratelimit({
         
        redis: redisAdapter as any,
        limiter: Ratelimit.slidingWindow(10, '1 m'),
        prefix: 'test:concurrent',
      })

      const userId = 'test-user-1'

      // Send 100 concurrent requests
      const results = await Promise.all(
        Array(100)
          .fill(null)
          .map(() => limiter.limit(userId))
      )

      const allowed = results.filter((r) => r.success).length
      const blocked = results.filter((r) => !r.success).length

      // Exactly 10 should be allowed (the limit)
      expect(allowed).toBe(10)
      // Remaining 90 should be blocked
      expect(blocked).toBe(90)

      console.log(`[Concurrency Test] Allowed: ${allowed}, Blocked: ${blocked}`)
    })

    it('should handle burst of concurrent requests with different limits', async () => {
      const limiter = new Ratelimit({
         
        redis: redisAdapter as any,
        limiter: Ratelimit.slidingWindow(25, '1 m'),
        prefix: 'test:burst',
      })

      const userId = 'burst-user'

      // Send 50 concurrent requests
      const results = await Promise.all(
        Array(50)
          .fill(null)
          .map(() => limiter.limit(userId))
      )

      const allowed = results.filter((r) => r.success).length
      const blocked = results.filter((r) => !r.success).length

      expect(allowed).toBe(25)
      expect(blocked).toBe(25)
    })

    it('should correctly track remaining count during concurrent load', async () => {
      const limiter = new Ratelimit({
         
        redis: redisAdapter as any,
        limiter: Ratelimit.slidingWindow(10, '1 m'),
        prefix: 'test:remaining',
      })

      const userId = 'remaining-user'

      // Send 10 requests (exactly at limit)
      const results = await Promise.all(
        Array(10)
          .fill(null)
          .map(() => limiter.limit(userId))
      )

      // All should succeed
      expect(results.every((r) => r.success)).toBe(true)

      // Next request should fail
      const nextResult = await limiter.limit(userId)
      expect(nextResult.success).toBe(false)
      expect(nextResult.remaining).toBe(0)
    })
  })

  // ============================================================================
  // AC4: Sliding Window Behavior
  // ============================================================================

  describe('AC4: Sliding Window Behavior', () => {
    it('should reset rate limit after window expires', async () => {
      // Use 2 second window for faster test
      const limiter = new Ratelimit({
         
        redis: redisAdapter as any,
        limiter: Ratelimit.slidingWindow(5, '2 s'),
        prefix: 'test:window',
      })

      const userId = 'window-user'

      // Exhaust limit
      await Promise.all(Array(5).fill(null).map(() => limiter.limit(userId)))

      // Verify limit is exhausted
      const blockedResult = await limiter.limit(userId)
      expect(blockedResult.success).toBe(false)

      console.log('[Window Test] Waiting 2.5 seconds for window to expire...')
      // Wait for window to expire (2s + buffer)
      await new Promise((resolve) => setTimeout(resolve, 2500))

      // Should be allowed again after window reset
      const allowedResult = await limiter.limit(userId)
      expect(allowedResult.success).toBe(true)
      expect(allowedResult.remaining).toBeLessThan(5) // Should have quota again

      console.log('[Window Test] Window reset verified, remaining:', allowedResult.remaining)
    }, 10000) // 10s timeout for this test

    it('should enforce sliding window accurately (not fixed window)', async () => {
      const limiter = new Ratelimit({
         
        redis: redisAdapter as any,
        limiter: Ratelimit.slidingWindow(3, '3 s'),
        prefix: 'test:sliding',
      })

      const userId = 'sliding-user'

      // Make 3 requests at t=0
      await Promise.all(Array(3).fill(null).map(() => limiter.limit(userId)))

      // 4th request should be blocked
      const blocked1 = await limiter.limit(userId)
      expect(blocked1.success).toBe(false)

      // Wait 1.5 seconds (still within 3s window)
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Should still be blocked (sliding window hasn't moved enough)
      const blocked2 = await limiter.limit(userId)
      expect(blocked2.success).toBe(false)

      // Wait another 2 seconds (total 3.5s, past first requests)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Now should be allowed (sliding window has moved past first requests)
      const allowed = await limiter.limit(userId)
      expect(allowed.success).toBe(true)
    }, 10000)

    it('should handle partial window expiration correctly', async () => {
      const limiter = new Ratelimit({
         
        redis: redisAdapter as any,
        limiter: Ratelimit.slidingWindow(5, '2 s'),
        prefix: 'test:partial',
      })

      const userId = 'partial-user'

      // Make 5 requests to exhaust limit
      await Promise.all(Array(5).fill(null).map(() => limiter.limit(userId)))

      // Wait 1 second (half the window)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Make 2 more requests (should still count toward limit)
      const result1 = await limiter.limit(userId)
      expect(result1.success).toBe(false)

      // Wait another 1.5 seconds (total 2.5s, past initial requests)
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Should have quota again
      const result2 = await limiter.limit(userId)
      expect(result2.success).toBe(true)
    }, 10000)
  })

  // ============================================================================
  // AC5: Rate Limit Headers
  // ============================================================================

  describe('AC5: Rate Limit Headers', () => {
    it('should generate correct rate limit headers', async () => {
      const limiter = new Ratelimit({
         
        redis: redisAdapter as any,
        limiter: Ratelimit.slidingWindow(10, '1 m'),
        prefix: 'test:headers',
      })

      const userId = 'header-user'

      // Make first request
      const result = await limiter.limit(userId)

      // Generate headers from result
      const headers = generateRateLimitHeaders({
        limit: 10,
        remaining: result.remaining,
        resetAt: new Date(result.reset),
      })

      expect(headers['X-RateLimit-Limit']).toBe('10')
      expect(headers['X-RateLimit-Remaining']).toBe('9')
      expect(headers['X-RateLimit-Reset']).toBeDefined()

      // Reset timestamp should be a valid Unix timestamp
      const resetTimestamp = parseInt(headers['X-RateLimit-Reset'], 10)
      expect(resetTimestamp).toBeGreaterThan(Math.floor(Date.now() / 1000))
      expect(resetTimestamp).toBeLessThan(Math.floor(Date.now() / 1000) + 120)

      console.log('[Headers Test] Generated headers:', headers)
    })

    it('should show zero remaining when limit exhausted', async () => {
      const limiter = new Ratelimit({
         
        redis: redisAdapter as any,
        limiter: Ratelimit.slidingWindow(3, '1 m'),
        prefix: 'test:headers-zero',
      })

      const userId = 'header-exhausted-user'

      // Exhaust limit
      await Promise.all(Array(3).fill(null).map(() => limiter.limit(userId)))

      // Next request should show 0 remaining
      const result = await limiter.limit(userId)
      const headers = generateRateLimitHeaders({
        limit: 3,
        remaining: result.remaining,
        resetAt: new Date(result.reset),
      })

      expect(headers['X-RateLimit-Limit']).toBe('3')
      expect(headers['X-RateLimit-Remaining']).toBe('0')
      expect(result.success).toBe(false)
    })

    it('should maintain consistent headers across concurrent requests', async () => {
      const limiter = new Ratelimit({
         
        redis: redisAdapter as any,
        limiter: Ratelimit.slidingWindow(10, '1 m'),
        prefix: 'test:headers-concurrent',
      })

      const userId = 'header-concurrent-user'

      // Make concurrent requests
      const results = await Promise.all(
        Array(5)
          .fill(null)
          .map(() => limiter.limit(userId))
      )

      // All should succeed
      expect(results.every((r) => r.success)).toBe(true)

      // Generate headers for each result
      const allHeaders = results.map((r) =>
        generateRateLimitHeaders({
          limit: 10,
          remaining: r.remaining,
          resetAt: new Date(r.reset),
        })
      )

      // All should have same limit
      expect(allHeaders.every((h) => h['X-RateLimit-Limit'] === '10')).toBe(true)

      // Remaining should be consistent with limit
      allHeaders.forEach((headers) => {
        const remaining = parseInt(headers['X-RateLimit-Remaining'], 10)
        expect(remaining).toBeGreaterThanOrEqual(0)
        expect(remaining).toBeLessThan(10)
      })
    })
  })

  // ============================================================================
  // AC6: Multi-User Isolation
  // ============================================================================

  describe('Multi-User Isolation', () => {
    it('should isolate rate limits between different users', async () => {
      const limiter = new Ratelimit({
         
        redis: redisAdapter as any,
        limiter: Ratelimit.slidingWindow(5, '1 m'),
        prefix: 'test:isolation',
      })

      const user1 = 'user-1'
      const user2 = 'user-2'
      const user3 = 'user-3'

      // Exhaust limit for user1
      await Promise.all(Array(5).fill(null).map(() => limiter.limit(user1)))
      const user1Blocked = await limiter.limit(user1)
      expect(user1Blocked.success).toBe(false)

      // user2 and user3 should still have full quota
      const user2Result = await limiter.limit(user2)
      const user3Result = await limiter.limit(user3)

      expect(user2Result.success).toBe(true)
      expect(user2Result.remaining).toBe(4)
      expect(user3Result.success).toBe(true)
      expect(user3Result.remaining).toBe(4)

      console.log('[Isolation Test] User1 blocked, User2/3 allowed independently')
    })

    it('should handle concurrent requests from multiple users', async () => {
      const limiter = new Ratelimit({
         
        redis: redisAdapter as any,
        limiter: Ratelimit.slidingWindow(10, '1 m'),
        prefix: 'test:multi-user',
      })

      const users = ['user-a', 'user-b', 'user-c', 'user-d', 'user-e']

      // Each user makes 15 concurrent requests
      const allResults = await Promise.all(
        users.map((userId) =>
          Promise.all(Array(15).fill(null).map(() => limiter.limit(userId)))
        )
      )

      // For each user, exactly 10 should succeed and 5 should fail
      allResults.forEach((userResults, index) => {
        const allowed = userResults.filter((r) => r.success).length
        const blocked = userResults.filter((r) => !r.success).length

        expect(allowed).toBe(10)
        expect(blocked).toBe(5)

        console.log(`[Multi-User Test] User ${users[index]}: ${allowed} allowed, ${blocked} blocked`)
      })
    })
  })

  // ============================================================================
  // DDoS Simulation
  // ============================================================================

  describe('DDoS Simulation', () => {
    it('should handle 1000+ concurrent requests without crashing', async () => {
      const limiter = new Ratelimit({
         
        redis: redisAdapter as any,
        limiter: Ratelimit.slidingWindow(50, '1 m'),
        prefix: 'test:ddos',
      })

      const userId = 'ddos-target'

      console.log('[DDoS Test] Sending 1000 concurrent requests...')
      const startTime = Date.now()

      // Send 1000 concurrent requests
      const results = await Promise.all(
        Array(1000)
          .fill(null)
          .map(() => limiter.limit(userId))
      )

      const endTime = Date.now()
      const duration = endTime - startTime

      const allowed = results.filter((r) => r.success).length
      const blocked = results.filter((r) => !r.success).length

      // Exactly 50 should be allowed
      expect(allowed).toBe(50)
      // Remaining 950 should be blocked
      expect(blocked).toBe(950)

      console.log(`[DDoS Test] Completed in ${duration}ms: ${allowed} allowed, ${blocked} blocked`)

      // Performance check: Should complete in reasonable time (under 10s)
      expect(duration).toBeLessThan(10000)
    }, 15000) // 15s timeout

    it('should handle DDoS from multiple IPs/users simultaneously', async () => {
      const limiter = new Ratelimit({
         
        redis: redisAdapter as any,
        limiter: Ratelimit.slidingWindow(20, '1 m'),
        prefix: 'test:ddos-multi',
      })

      // Simulate 10 attackers, each sending 100 requests
      const attackers = Array(10)
        .fill(null)
        .map((_, i) => `attacker-${i}`)

      console.log('[DDoS Multi Test] Simulating 10 attackers x 100 requests each...')
      const startTime = Date.now()

      const allResults = await Promise.all(
        attackers.map((attackerId) =>
          Promise.all(Array(100).fill(null).map(() => limiter.limit(attackerId)))
        )
      )

      const endTime = Date.now()
      const duration = endTime - startTime

      // Each attacker should have exactly 20 allowed, 80 blocked
      allResults.forEach((attackerResults) => {
        const allowed = attackerResults.filter((r) => r.success).length
        const blocked = attackerResults.filter((r) => !r.success).length

        expect(allowed).toBe(20)
        expect(blocked).toBe(80)
      })

      const totalRequests = attackers.length * 100
      console.log(
        `[DDoS Multi Test] ${totalRequests} total requests in ${duration}ms (${Math.round(
          totalRequests / (duration / 1000)
        )} req/s)`
      )
    }, 20000)
  })

  // ============================================================================
  // Edge Cases & Reliability
  // ============================================================================

  describe('Edge Cases & Reliability', () => {
    it('should handle rapid sequential requests correctly', async () => {
      const limiter = new Ratelimit({
         
        redis: redisAdapter as any,
        limiter: Ratelimit.slidingWindow(10, '1 m'),
        prefix: 'test:sequential',
      })

      const userId = 'sequential-user'

      // Make requests rapidly in sequence (not parallel)
      const results: any[] = []
      for (let i = 0; i < 15; i++) {
        results.push(await limiter.limit(userId))
      }

      const allowed = results.filter((r) => r.success).length
      const blocked = results.filter((r) => !r.success).length

      expect(allowed).toBe(10)
      expect(blocked).toBe(5)
    })

    it('should maintain accuracy under mixed concurrent and sequential load', async () => {
      const limiter = new Ratelimit({
         
        redis: redisAdapter as any,
        limiter: Ratelimit.slidingWindow(20, '1 m'),
        prefix: 'test:mixed',
      })

      const userId = 'mixed-user'

      // First batch: 10 concurrent
      await Promise.all(Array(10).fill(null).map(() => limiter.limit(userId)))

      // Second batch: 10 sequential
      for (let i = 0; i < 10; i++) {
        await limiter.limit(userId)
      }

      // Third batch: 10 concurrent (should all fail)
      const results = await Promise.all(
        Array(10)
          .fill(null)
          .map(() => limiter.limit(userId))
      )

      expect(results.every((r) => !r.success)).toBe(true)
    })

    it('should handle very high limits correctly', async () => {
      const limiter = new Ratelimit({
         
        redis: redisAdapter as any,
        limiter: Ratelimit.slidingWindow(1000, '1 m'),
        prefix: 'test:high-limit',
      })

      const userId = 'high-limit-user'

      // Make 500 requests
      const results = await Promise.all(
        Array(500)
          .fill(null)
          .map(() => limiter.limit(userId))
      )

      // All should succeed
      expect(results.every((r) => r.success)).toBe(true)

      // Remaining should be around 500
      const lastResult = results[results.length - 1]
      expect(lastResult.remaining).toBeGreaterThan(400)
      expect(lastResult.remaining).toBeLessThan(600)
    })
  })
})
