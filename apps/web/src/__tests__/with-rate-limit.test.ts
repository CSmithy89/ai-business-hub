import { describe, expect, it } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '../lib/middleware/with-rate-limit'

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
    const handler = withRateLimit(
      { ...RATE_LIMIT_CONFIGS.auth, keyPrefix: 'test:auth429' },
      async () => NextResponse.json({ ok: true })
    )

    const request = new NextRequest('http://localhost/api/test429')

    // Exhaust the limit quickly
    await handler(request)
    await handler(request)
    const blocked = await handler(request)

    expect(blocked.status).toBe(429)
    expect(blocked.headers.get('X-RateLimit-Limit')).toBe(String(RATE_LIMIT_CONFIGS.auth.limit))
    expect(blocked.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(blocked.headers.get('X-RateLimit-Reset')).toBeDefined()
    expect(blocked.headers.get('Retry-After')).toBeDefined()
  })
})
