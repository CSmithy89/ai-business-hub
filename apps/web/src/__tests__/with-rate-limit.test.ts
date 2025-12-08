import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '../lib/middleware/with-rate-limit'
import * as rateLimit from '../lib/utils/rate-limit'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('withRateLimit middleware', () => {
  it('adds standard X-RateLimit-* headers to responses', async () => {
    const handler = withRateLimit(
      { ...RATE_LIMIT_CONFIGS.auth, keyPrefix: 'test:auth' },
      async () => NextResponse.json({ ok: true })
    )

    const request = new NextRequest('http://localhost/api/test')

    const response = await handler(request)

    expect(response.headers.get('X-RateLimit-Limit')).toBe(String(RATE_LIMIT_CONFIGS.auth.limit))
    expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined()
    expect(response.headers.get('X-RateLimit-Reset')).toBeDefined()
  })

  it('returns 429 with headers when rate limit exceeded', async () => {
    const resetAt = new Date(Date.now() + 30_000)
    vi.spyOn(rateLimit, 'checkRateLimitSync').mockReturnValue({
      isRateLimited: true,
      remaining: 0,
      resetAt,
      retryAfter: 15,
    })

    const handler = withRateLimit(
      { ...RATE_LIMIT_CONFIGS.auth, keyPrefix: 'test:auth429' },
      async () => NextResponse.json({ ok: true })
    )

    const request = new NextRequest('http://localhost/api/test429')

    const blocked = await handler(request)

    expect(blocked.status).toBe(429)
    expect(blocked.headers.get('X-RateLimit-Limit')).toBe(String(RATE_LIMIT_CONFIGS.auth.limit))
    expect(blocked.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(blocked.headers.get('X-RateLimit-Reset')).toBe(String(Math.floor(resetAt.getTime() / 1000)))
    expect(blocked.headers.get('Retry-After')).toBeDefined()
  })
})
