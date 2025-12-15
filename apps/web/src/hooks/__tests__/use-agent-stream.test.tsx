import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAgentStream } from '../use-agent-stream'

vi.mock('@/lib/auth-client', () => ({
  getCurrentSessionToken: vi.fn(() => 'token-123'),
}))

describe('useAgentStream', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.useRealTimers()
  })

  it('aborts in-flight stream on unmount', async () => {
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort')

    // Keep fetch pending so the stream stays in-flight.
    global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch

    const { result, unmount } = renderHook(() => useAgentStream({ streamTimeoutMs: 60_000 }))

    await act(async () => {
      result.current.stream('validation', {
        message: 'hello',
        business_id: 'biz_1',
      })
    })

    unmount()

    expect(abortSpy).toHaveBeenCalled()
  })

  it('aborts the stream when timeout elapses', async () => {
    vi.useFakeTimers()
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort')

    global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch

    const { result } = renderHook(() => useAgentStream({ streamTimeoutMs: 10 }))

    await act(async () => {
      result.current.stream('validation', {
        message: 'hello',
        business_id: 'biz_1',
      })
    })

    await act(async () => {
      vi.advanceTimersByTime(11)
    })

    expect(abortSpy).toHaveBeenCalled()
  })
})
