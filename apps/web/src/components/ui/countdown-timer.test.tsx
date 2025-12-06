import { act, render, renderHook } from '@testing-library/react'
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'

import { useOptimizedCountdown, CountdownTimer } from './countdown-timer'

describe('useOptimizedCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('uses a single interval per start', () => {
    const setIntervalSpy = vi.spyOn(window, 'setInterval')
    const { result } = renderHook(() => useOptimizedCountdown(3, { autoStart: true }))

    expect(setIntervalSpy).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.timeLeft).toBe(0)
    expect(result.current.isComplete).toBe(true)
    expect(setIntervalSpy).toHaveBeenCalledTimes(1)
  })

  it('reset restarts timer and clears interval', () => {
    const { result } = renderHook(() => useOptimizedCountdown(2, { autoStart: false }))

    act(() => {
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.timeLeft).toBe(1)

    act(() => {
      result.current.reset()
    })

    expect(result.current.timeLeft).toBe(2)
    expect(result.current.isRunning).toBe(true)
  })
})

describe('CountdownTimer component snapshot', () => {
  it('renders the time left text when no custom render provided', () => {
    const { getByRole } = render(<CountdownTimer seconds={5} autoStart={false} />)
    expect(getByRole('timer')).toBeTruthy()
  })
})
