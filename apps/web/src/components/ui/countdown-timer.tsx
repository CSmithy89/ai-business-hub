'use client'

import { useEffect, useState, useCallback, type ReactNode } from 'react'

interface CountdownTimerProps {
  /** Initial countdown time in seconds */
  seconds: number
  /** Callback when countdown reaches 0 */
  onComplete?: () => void
  /** Custom render function for the countdown display */
  render?: (timeLeft: number) => ReactNode
  /** Whether to auto-start the countdown (default: true) */
  autoStart?: boolean
  /** Key to reset the timer (change this to restart) */
  resetKey?: number | string
}

/**
 * Countdown Timer Component
 *
 * A reusable countdown timer that counts down from a specified number of seconds.
 * Supports custom rendering and callback on completion.
 *
 * @example
 * // Simple countdown
 * <CountdownTimer seconds={30} onComplete={() => setCanResend(true)} />
 *
 * @example
 * // Custom render for resend button
 * <CountdownTimer
 *   seconds={30}
 *   onComplete={() => setCanResend(true)}
 *   render={(time) => `Resend in ${time}s`}
 * />
 *
 * @example
 * // Auto-redirect with message
 * <CountdownTimer
 *   seconds={5}
 *   onComplete={() => router.push('/sign-in')}
 *   render={(time) => (
 *     <p className="text-sm text-gray-600">
 *       Redirecting to sign in in {time} seconds...
 *     </p>
 *   )}
 * />
 */
export function CountdownTimer({
  seconds,
  onComplete,
  render,
  autoStart = true,
  resetKey,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds)
  const [isRunning, setIsRunning] = useState(autoStart)

  // Reset timer when resetKey changes
  useEffect(() => {
    setTimeLeft(seconds)
    setIsRunning(autoStart)
  }, [resetKey, seconds, autoStart])

  // Handle the countdown
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      if (timeLeft <= 0 && isRunning) {
        onComplete?.()
        setIsRunning(false)
      }
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newValue = prev - 1
        if (newValue <= 0) {
          clearInterval(timer)
        }
        return newValue
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isRunning, timeLeft, onComplete])

  // Render custom content or default
  if (render) {
    return <>{render(timeLeft)}</>
  }

  return (
    <span
      role="timer"
      aria-live="polite"
      aria-atomic="true"
    >
      {timeLeft}s
    </span>
  )
}

/**
 * Hook for countdown timer logic without the component
 *
 * @example
 * const { timeLeft, isComplete, reset } = useCountdown(30)
 */
export function useCountdown(
  initialSeconds: number,
  options?: {
    onComplete?: () => void
    autoStart?: boolean
  }
) {
  const { onComplete, autoStart = true } = options ?? {}
  const [timeLeft, setTimeLeft] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(autoStart)
  const [isComplete, setIsComplete] = useState(false)

  const reset = useCallback(() => {
    setTimeLeft(initialSeconds)
    setIsRunning(true)
    setIsComplete(false)
  }, [initialSeconds])

  const stop = useCallback(() => {
    setIsRunning(false)
  }, [])

  const start = useCallback(() => {
    if (timeLeft > 0) {
      setIsRunning(true)
    }
  }, [timeLeft])

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      if (timeLeft <= 0 && !isComplete) {
        setIsComplete(true)
        setIsRunning(false)
        onComplete?.()
      }
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [isRunning, timeLeft, onComplete, isComplete])

  return {
    /** Current time remaining in seconds */
    timeLeft,
    /** Whether the countdown has completed */
    isComplete,
    /** Whether the countdown is currently running */
    isRunning,
    /** Reset the countdown to initial value */
    reset,
    /** Stop the countdown */
    stop,
    /** Start or resume the countdown */
    start,
  }
}
