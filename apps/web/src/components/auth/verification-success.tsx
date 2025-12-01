'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VerificationSuccessProps {
  /**
   * Redirect URL after success
   * @default '/dashboard'
   */
  redirectUrl?: string
  /**
   * Auto-redirect countdown in seconds
   * @default 3
   */
  autoRedirectSeconds?: number
}

/**
 * Verification Success State Component
 *
 * Displays success message with auto-redirect countdown.
 * User can also click "Get Started" to redirect immediately.
 */
export function VerificationSuccess({
  redirectUrl = '/dashboard',
  autoRedirectSeconds = 3,
}: VerificationSuccessProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(autoRedirectSeconds)

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Redirect when countdown reaches 0
          router.push(redirectUrl as any)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router, redirectUrl])

  const handleGetStarted = () => {
    router.push(redirectUrl as any)
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {/* HYVVE Logo */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">HYVVE</h2>
      </div>

      {/* Success Icon Badge */}
      <div className="flex justify-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
      </div>

      {/* Heading and Message */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Email verified!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Your email has been verified successfully. Your account is now ready to use.
        </p>
      </div>

      {/* Get Started Button */}
      <Button
        onClick={handleGetStarted}
        className="w-full bg-[#FF6B6B] hover:bg-[#FF6B6B]/90"
      >
        Get Started
      </Button>

      {/* Auto-redirect Message */}
      <p className="text-sm text-center text-gray-500 dark:text-gray-400">
        Redirecting to your dashboard in {countdown}s...
      </p>
    </div>
  )
}
