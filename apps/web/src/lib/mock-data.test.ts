import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'development')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('mock-data module', () => {
  it('exposes deterministic notification payloads', async () => {
    const { MOCK_NOTIFICATIONS } = await import('./mock-data')

    expect(MOCK_NOTIFICATIONS).toHaveLength(6)
    expect(MOCK_NOTIFICATIONS[0].timestamp.toISOString()).toBe('2025-06-01T15:00:00.000Z')
  })

  it('returns deterministic confidence breakdowns per id', async () => {
    const { getMockConfidenceBreakdown } = await import('./mock-data')

    const first = getMockConfidenceBreakdown('approval-123')
    const second = getMockConfidenceBreakdown('approval-123')

    expect(first).toEqual(second)
    expect(first.overallScore).toBeGreaterThan(0)
    expect(first.factors).toHaveLength(4)
  })

  it('gates mock data when disabled', async () => {
    vi.unstubAllEnvs()
    vi.stubEnv('NODE_ENV', 'production')
    vi.unstubAllEnvs()
    vi.stubEnv('NEXT_PUBLIC_ENABLE_MOCK_DATA', '')

    const { ensureMockDataEnabled } = await import('./mock-data')

    expect(() => ensureMockDataEnabled('test feature')).toThrow(/Mock data is disabled|disabled/)
  })
})
