'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AuthLayout } from '@/components/auth/auth-layout'
import { VerificationPending } from '@/components/auth/verification-pending'
import { VerificationSuccess } from '@/components/auth/verification-success'
import { VerificationError } from '@/components/auth/verification-error'
import { OtpCodeInput } from '@/components/auth/otp-code-input'
import { Loader2, AlertCircle } from 'lucide-react'

/**
 * Verification state types
 */
type VerificationState =
  | { type: 'pending'; email: string }
  | { type: 'verifying' }
  | { type: 'verifying-otp' }
  | { type: 'success' }
  | { type: 'error'; errorType: 'expired' | 'invalid' | 'unknown'; email?: string }

/**
 * Email Verification Content Component
 * Separated to handle Suspense boundary for useSearchParams
 */
function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const emailParam = searchParams.get('email')

  const [state, setState] = useState<VerificationState>({
    type: token ? 'verifying' : 'pending',
    email: emailParam || '',
  })
  const [resending, setResending] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)

  // Auto-verify token on mount if present
  useEffect(() => {
    if (!token) return

    const verifyToken = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (response.ok && data.success) {
          setState({ type: 'success' })
        } else {
          // Determine error type from response
          let errorType: 'expired' | 'invalid' | 'unknown' = 'unknown'

          if (data.error === 'EXPIRED_TOKEN') {
            errorType = 'expired'
          } else if (data.error === 'INVALID_TOKEN') {
            errorType = 'invalid'
          }

          setState({
            type: 'error',
            errorType,
            email: emailParam || undefined,
          })
        }
      } catch (error) {
        console.error('Verification error:', error)
        setState({
          type: 'error',
          errorType: 'unknown',
          email: emailParam || undefined,
        })
      }
    }

    verifyToken()
  }, [token, emailParam])

  /**
   * Handle OTP code submission
   */
  const handleOtpSubmit = async (code: string) => {
    const email = state.type === 'pending' ? state.email : emailParam

    if (!email) {
      setOtpError('Email address is required')
      return
    }

    setState({ type: 'verifying-otp' })
    setOtpError(null)

    try {
      const response = await fetch('/api/auth/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setState({ type: 'success' })
      } else {
        // Handle errors
        let errorMessage = data.error?.message || 'Invalid or expired code'

        if (response.status === 429) {
          errorMessage = data.message || 'Too many attempts. Please try again later.'
        }

        setOtpError(errorMessage)
        setState({
          type: 'pending',
          email: email || '',
        })
      }
    } catch (error) {
      console.error('OTP verification error:', error)
      setOtpError('An error occurred. Please try again.')
      setState({
        type: 'pending',
        email: email || '',
      })
    }
  }

  /**
   * Handle resend verification email
   */
  const handleResend = async () => {
    const email = state.type === 'pending' ? state.email : state.type === 'error' ? state.email : emailParam

    if (!email) {
      alert('Email address is required to resend verification.')
      return
    }

    setResending(true)

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Show success message
        alert('Verification email sent! Please check your inbox.')
        // Update state to pending
        setState({ type: 'pending', email })
      } else if (response.status === 429) {
        // Rate limited
        const retryAfter = data.retryAfter || 60
        alert(`Too many requests. Please try again in ${retryAfter} seconds.`)
      } else {
        alert(data.message || 'Failed to resend verification email.')
      }
    } catch (error) {
      console.error('Resend error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      {/* Verifying State */}
      {state.type === 'verifying' && (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF6B6B]" />
          <p className="text-gray-600 dark:text-gray-400">
            Verifying your email...
          </p>
        </div>
      )}

      {/* Pending State */}
      {state.type === 'pending' && (
        <div className="w-full max-w-md space-y-6">
          <VerificationPending
            email={state.email}
            onResend={handleResend}
            isResending={resending}
          />

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                Or verify with code
              </span>
            </div>
          </div>

          {/* OTP Input Section */}
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter the 6-digit code from your email
              </p>
            </div>

            {otpError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{otpError}</p>
              </div>
            )}

            <OtpCodeInput
              length={6}
              onComplete={handleOtpSubmit}
              disabled={false}
              error={!!otpError}
              autoSubmit={true}
            />
          </div>
        </div>
      )}

      {/* Verifying OTP State */}
      {state.type === 'verifying-otp' && (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF6B6B]" />
          <p className="text-gray-600 dark:text-gray-400">
            Verifying your code...
          </p>
        </div>
      )}

      {/* Success State */}
      {state.type === 'success' && <VerificationSuccess />}

      {/* Error State */}
      {state.type === 'error' && (
        <VerificationError
          type={state.errorType}
          email={state.email}
          onResend={state.email ? handleResend : undefined}
          isResending={resending}
        />
      )}
    </div>
  )
}

/**
 * Email Verification Page
 *
 * Handles email verification with token from query params.
 * Supports multiple states: pending, verifying, success, error.
 *
 * Route: /verify-email?token={token}&email={email}
 */
export default function VerifyEmailPage() {
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#FF6B6B]" />
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </AuthLayout>
  )
}
