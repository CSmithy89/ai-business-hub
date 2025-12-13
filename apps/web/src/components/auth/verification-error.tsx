'use client'

import { XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VerificationErrorProps {
  /**
   * Error type
   */
  type: 'expired' | 'invalid' | 'unknown'
  /**
   * User email (optional, for resend)
   */
  email?: string
  /**
   * Callback when resend button is clicked
   */
  onResend?: () => Promise<void>
  /**
   * Loading state for resend action
   */
  isResending?: boolean
}

/**
 * Verification Error State Component
 *
 * Displays error message for expired or invalid verification tokens.
 * Provides resend option and support link.
 */
export function VerificationError({
  type,
  email,
  onResend,
  isResending = false,
}: VerificationErrorProps) {
  // Error messages based on type
  const errorContent = {
    expired: {
      heading: 'Verification link expired',
      message:
        'This verification link has expired. Verification links are valid for 24 hours. Please request a new verification email.',
    },
    invalid: {
      heading: 'Invalid verification link',
      message:
        'This verification link is invalid or has already been used. Please check the link or request a new verification email.',
    },
    unknown: {
      heading: 'Verification failed',
      message:
        'We were unable to verify your email address. Please try again or request a new verification email.',
    },
  }

  const { heading, message } = errorContent[type]

  return (
    <div className="w-full max-w-md space-y-6">
      {/* HYVVE Logo */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">HYVVE</h2>
      </div>

      {/* Error Icon Badge */}
      <div className="flex justify-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20">
          <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
      </div>

      {/* Heading and Message */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {heading}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>

      {/* Resend Button */}
      {onResend && email && (
        <Button
          onClick={onResend}
          disabled={isResending}
          className="w-full bg-primary hover:bg-primary/90"
        >
          {isResending ? 'Sending...' : 'Resend Verification Email'}
        </Button>
      )}

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* Support Link */}
      <p className="text-sm text-center text-gray-600 dark:text-gray-400">
        Need help?{' '}
        <a
          href="mailto:support@hyvve.app"
          className="font-semibold text-[#FF6B6B] hover:underline"
        >
          Contact Support
        </a>
      </p>
    </div>
  )
}
