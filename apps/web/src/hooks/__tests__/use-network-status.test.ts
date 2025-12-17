import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useNetworkStatus } from '../use-network-status'

describe('useNetworkStatus', () => {
  it('updates when online/offline events fire', () => {
    const originalNavigatorOnLine =
      Object.getOwnPropertyDescriptor(navigator, 'onLine') ??
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(navigator), 'onLine')

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

    if (originalNavigatorOnLine) {
      Object.defineProperty(navigator, 'onLine', originalNavigatorOnLine)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (navigator as any).onLine
    }
  })
})
