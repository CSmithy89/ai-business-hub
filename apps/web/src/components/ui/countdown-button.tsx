'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface CountdownButtonProps {
  /**
   * Callback when button is clicked (after countdown completes)
   */
  onClick: () => void | Promise<void>
  /**
   * Initial countdown time in seconds
   * @default 45
   */
  countdownSeconds?: number
  /**
   * Button text when ready to click
   * @default "Resend verification email"
   */
  children?: React.ReactNode
  /**
   * Loading state (external)
   */
  isLoading?: boolean
  /**
   * CSS classes
   */
  className?: string
  /**
   * Button variant
   */
  variant?: 'default' | 'outline' | 'ghost' | 'link'
}

/**
 * Button with countdown timer
 *
 * Used for resend verification email functionality.
 * Prevents rapid clicking by showing countdown before button becomes active.
 */
export function CountdownButton({
  onClick,
  countdownSeconds = 45,
  children = 'Resend verification email',
  isLoading = false,
  className,
  variant = 'link',
}: CountdownButtonProps) {
  const [countdown, setCountdown] = useState<number>(0)
  const [internalLoading, setInternalLoading] = useState(false)

  // Check localStorage for countdown on mount
  useEffect(() => {
    const stored = localStorage.getItem('verification-resend-countdown')
    if (stored) {
      const { expiresAt } = JSON.parse(stored)
      const remaining = Math.ceil((expiresAt - Date.now()) / 1000)
      if (remaining > 0) {
        setCountdown(remaining)
      } else {
        localStorage.removeItem('verification-resend-countdown')
      }
    }
  }, [])

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        const next = prev - 1
        if (next <= 0) {
          localStorage.removeItem('verification-resend-countdown')
          return 0
        }
        return next
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [countdown])

  const handleClick = async () => {
    setInternalLoading(true)

    try {
      await onClick()

      // Start countdown after successful click
      const expiresAt = Date.now() + countdownSeconds * 1000
      localStorage.setItem(
        'verification-resend-countdown',
        JSON.stringify({ expiresAt })
      )
      setCountdown(countdownSeconds)
    } catch (error) {
      console.error('Error in countdown button:', error)
    } finally {
      setInternalLoading(false)
    }
  }

  const isDisabled = countdown > 0 || isLoading || internalLoading

  if (countdown > 0) {
    return (
      <p className="text-sm text-gray-500">
        Resend available in {countdown}s
      </p>
    )
  }

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleClick}
      disabled={isDisabled}
      className={className}
    >
      {(isLoading || internalLoading) && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      )}
      {children}
    </Button>
  )
}
