/**
 * CSRF Integration Tests (Story 14-6)
 *
 * Validates CSRF token issuance and enforcement using Next.js request objects.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { withCSRF, CSRF_HEADER_NAME } from '@/lib/middleware/with-csrf'
import { generateCSRFToken } from '@/lib/csrf'

const sessionToken = 'session-token-123'
const otherSessionToken = 'session-token-456'

function createRequest(pathname: string, method: string, headers: HeadersInit = {}) {
  const headerObj = new Headers(headers)
  if (!headerObj.has('cookie')) {
    headerObj.set('cookie', `hyvve.session_token=${sessionToken}`)
  }
  return new NextRequest(new Request(`https://example.com${pathname}`, { method, headers: headerObj }))
}

function mockContext() {
  return { user: { id: 'user-1' } as any }
}

const handler = withCSRF(async () => NextResponse.json({ ok: true }))

describe('CSRF integration', () => {
  beforeEach(() => {
    process.env.CSRF_SECRET = 'a-secure-csrf-secret-value-that-is-long-enough'
  })

  it('allows safe method without CSRF header', async () => {
    const req = createRequest('/api/test', 'GET')
    const res = await handler(req, mockContext())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('rejects missing token on unsafe method', async () => {
    const req = createRequest('/api/test', 'POST')
    const res = await handler(req, mockContext())
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error.code).toBe('CSRF_TOKEN_MISSING')
  })

  it('rejects invalid token', async () => {
    const req = createRequest('/api/test', 'POST', {
      [CSRF_HEADER_NAME]: 'invalid-token',
    })
    const res = await handler(req, mockContext())
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error.code).toBe('CSRF_TOKEN_INVALID')
  })

  it('rejects token tied to different session (session change / expired)', async () => {
    const validForOtherSession = generateCSRFToken(otherSessionToken)
    const req = createRequest('/api/test', 'POST', {
      [CSRF_HEADER_NAME]: validForOtherSession,
      cookie: `hyvve.session_token=${sessionToken}`,
    })
    const res = await handler(req, mockContext())
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error.code).toBe('CSRF_TOKEN_INVALID')
  })

  it('accepts valid token for session and supports concurrent usage', async () => {
    const token = generateCSRFToken(sessionToken)
    const makeReq = () =>
      createRequest('/api/test', 'POST', {
        [CSRF_HEADER_NAME]: token,
        cookie: `hyvve.session_token=${sessionToken}`,
      })

    const [resA, resB] = await Promise.all([handler(makeReq(), mockContext()), handler(makeReq(), mockContext())])
    expect(resA.status).toBe(200)
    expect(resB.status).toBe(200)
  })
})
