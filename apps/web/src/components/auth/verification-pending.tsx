'use client'

import { Mail } from 'lucide-react'
import { CountdownButton } from '@/components/ui/countdown-button'

interface VerificationPendingProps {
  /**
   * User email address
   */
  email: string
  /**
   * Callback when resend button is clicked
   */
  onResend: () => Promise<void>
  /**
   * Loading state for resend action
   */
  isResending?: boolean
}

/**
 * Verification Pending State Component
 *
 * Displays when user needs to check their email for verification link.
 * Includes quick links to Gmail/Outlook and resend functionality.
 */
export function VerificationPending({
  email,
  onResend,
  isResending = false,
}: VerificationPendingProps) {
  return (
    <div className="w-full max-w-md space-y-6">
      {/* HYVVE Logo */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">HYVVE</h2>
      </div>

      {/* Mail Icon Badge */}
      <div className="flex justify-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#FF6B6B]/10">
          <Mail className="w-8 h-8 text-[#FF6B6B]" />
        </div>
      </div>

      {/* Heading and Message */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Verify your email
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          We&apos;ve sent a verification link to:
        </p>
        <p className="font-semibold text-gray-900 dark:text-white">{email}</p>
        <p className="text-gray-600 dark:text-gray-400">
          Click the link in the email to verify your account and get started.
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* Email Client Quick Links */}
      <div className="flex gap-3">
        <a
          href="https://mail.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 h-10 px-4 flex items-center justify-center gap-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            Open Gmail
          </span>
        </a>
        <a
          href="https://outlook.live.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 h-10 px-4 flex items-center justify-center gap-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            Open Outlook
          </span>
        </a>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* Help Section */}
      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
        <p className="text-center">Didn&apos;t receive the email?</p>
        <ul className="list-disc list-inside space-y-1 text-left max-w-xs mx-auto">
          <li>Check your spam/junk folder</li>
          <li>Make sure {email} is correct</li>
        </ul>
      </div>

      {/* Resend Button with Countdown */}
      <div className="flex justify-center">
        <CountdownButton
          onClick={onResend}
          isLoading={isResending}
          countdownSeconds={45}
          className="text-[#FF6B6B] hover:underline"
        >
          Resend verification email
        </CountdownButton>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* Wrong Email Link (Placeholder) */}
      <p className="text-sm text-center text-gray-600 dark:text-gray-400">
        Wrong email?{' '}
        <button
          type="button"
          className="font-semibold text-[#FF6B6B] hover:underline"
          onClick={() => {
            // Placeholder - email change functionality out of scope
            alert('Email change functionality coming soon!')
          }}
        >
          Change email address
        </button>
      </p>
    </div>
  )
}
