/**
 * Quick Actions CSRF Tests (Story 14-6)
 *
 * Ensures quick action endpoints enforce CSRF validation.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { withCSRF, CSRF_HEADER_NAME } from '@/lib/middleware/with-csrf'
import { generateCSRFToken } from '@/lib/csrf'

const sessionToken = 'qa-session-token'

function createRequest(method: string, headers: HeadersInit = {}) {
  const headerObj = new Headers(headers)
  if (!headerObj.has('cookie')) {
    headerObj.set('cookie', `hyvve.session_token=${sessionToken}`)
  }
  return new NextRequest(
    new Request('https://example.com/api/approvals/quick-actions', { method, headers: headerObj })
  )
}

function mockContext() {
  return { user: { id: 'user-qa' } as any }
}

const handler = withCSRF(async () => NextResponse.json({ ok: true }))

describe('Quick Actions CSRF', () => {
  beforeEach(() => {
    process.env.CSRF_SECRET = 'another-secure-csrf-secret-value-that-is-long-enough'
  })

  it('rejects quick action without CSRF token', async () => {
    const req = createRequest('POST')
    const res = await handler(req, mockContext())
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error.code).toBe('CSRF_TOKEN_MISSING')
  })

  it('allows quick action with valid CSRF token', async () => {
    const token = generateCSRFToken(sessionToken)
    const req = createRequest('POST', {
      [CSRF_HEADER_NAME]: token,
      cookie: `hyvve.session_token=${sessionToken}`,
    })
    const res = await handler(req, mockContext())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })
})
