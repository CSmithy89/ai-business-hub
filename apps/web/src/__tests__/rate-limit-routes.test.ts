import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import * as rateLimit from '@/lib/utils/rate-limit'

vi.mock('@/lib/utils/rate-limit', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof rateLimit
  return {
    ...actual,
    checkRateLimit: vi.fn(),
    checkRateLimitSync: vi.fn(),
  }
})

vi.mock('@/lib/auth', () => ({
  auth: {
    handler: vi.fn(async () => NextResponse.json({ ok: true })),
  },
}))

const workspaceCreate = vi.fn(async ({ data }) => ({
  id: 'ws-1',
  ...data,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  deletedAt: null,
}))

const workspaceMemberCreate = vi.fn(async () => ({}))

vi.mock('@hyvve/db', () => ({
  prisma: {
    workspace: {
      findUnique: vi.fn(async () => null),
      create: workspaceCreate,
    },
    workspaceMember: {
      create: workspaceMemberCreate,
    },
    $transaction: vi.fn(async (cb: any) =>
      cb({
        workspace: { create: workspaceCreate },
        workspaceMember: { create: workspaceMemberCreate },
      })
    ),
  },
}))

vi.mock('@/lib/auth-server', () => ({
  getSession: vi.fn(async () => ({
    user: { id: 'user-1' },
    session: { id: 'session-1' },
  })),
  updateSessionWorkspace: vi.fn(async () => {}),
}))

vi.mock('@/lib/workspace', () => ({
  generateUniqueSlug: vi.fn(async () => 'test-slug'),
}))

describe('Rate limit headers on auth route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('adds headers on success', async () => {
    const resetAt = new Date(Date.now() + 60_000)
    const checkRateLimit = rateLimit.checkRateLimit as unknown as ReturnType<typeof vi.fn>
    checkRateLimit.mockResolvedValue({
      isRateLimited: false,
      remaining: 4,
      resetAt,
      retryAfter: undefined,
    })

    const { POST } = await import('@/app/api/auth/[...all]/route')

    const request = new NextRequest(
      new Request('http://localhost/api/auth/sign-in/email', { method: 'POST' })
    )

    const response = await POST(request as any)

    expect(response.status).toBe(200)
    expect(response.headers.get('X-RateLimit-Limit')).toBe('5')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('4')
    expect(response.headers.get('X-RateLimit-Reset')).toBeDefined()
  })

  it('returns 429 with headers when rate limited', async () => {
    const resetAt = new Date(Date.now() + 90_000)
    const checkRateLimit = rateLimit.checkRateLimit as unknown as ReturnType<typeof vi.fn>
    checkRateLimit.mockResolvedValue({
      isRateLimited: true,
      remaining: 0,
      resetAt,
      retryAfter: 30,
    })

    const { POST } = await import('@/app/api/auth/[...all]/route')

    const request = new NextRequest(
      new Request('http://localhost/api/auth/sign-in/email', { method: 'POST' })
    )

    const response = await POST(request as any)

    expect(response.status).toBe(429)
    expect(response.headers.get('X-RateLimit-Limit')).toBe('5')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(response.headers.get('X-RateLimit-Reset')).toBeDefined()
    expect(response.headers.get('Retry-After')).toBe('30')
  })
})

describe('Rate limit headers on workspace creation route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  const buildRequest = () =>
    new NextRequest(
      new Request('http://localhost/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({ name: 'Acme Corp' }),
        headers: { 'content-type': 'application/json' },
      })
    )

  it('adds headers on successful creation', async () => {
    const resetAt = new Date(Date.now() + 120_000)
    const checkRateLimit = rateLimit.checkRateLimit as unknown as ReturnType<typeof vi.fn>
    checkRateLimit.mockResolvedValue({
      isRateLimited: false,
      remaining: 4,
      resetAt,
      retryAfter: undefined,
    })

    const { POST } = await import('@/app/api/workspaces/route')

    const response = await POST(buildRequest() as any)

    expect(response.status).toBe(201)
    expect(response.headers.get('X-RateLimit-Limit')).toBe('5')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('4')
    expect(response.headers.get('X-RateLimit-Reset')).toBeDefined()
  })

  it('returns 429 with headers when rate limited', async () => {
    const resetAt = new Date(Date.now() + 45_000)
    const checkRateLimit = rateLimit.checkRateLimit as unknown as ReturnType<typeof vi.fn>
    checkRateLimit.mockResolvedValue({
      isRateLimited: true,
      remaining: 0,
      resetAt,
      retryAfter: 20,
    })

    const { POST } = await import('@/app/api/workspaces/route')

    const response = await POST(buildRequest() as any)

    expect(response.status).toBe(429)
    expect(response.headers.get('X-RateLimit-Limit')).toBe('5')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(response.headers.get('X-RateLimit-Reset')).toBeDefined()
    expect(response.headers.get('Retry-After')).toBe('20')
  })
})
