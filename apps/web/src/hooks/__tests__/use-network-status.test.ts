import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useNetworkStatus } from '../use-network-status'

describe('useNetworkStatus', () => {
  it('updates when online/offline events fire', () => {
    const originalOnline = navigator.onLine

    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => true,
    })

    const { result } = renderHook(() => useNetworkStatus())
    expect(result.current).toBe(true)

    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => false,
    })

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    expect(result.current).toBe(false)

    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => true,
    })

    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(result.current).toBe(true)

    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => originalOnline,
    })
  })
})

