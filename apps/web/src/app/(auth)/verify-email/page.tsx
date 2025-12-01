'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AuthLayout } from '@/components/auth/auth-layout'
import { VerificationPending } from '@/components/auth/verification-pending'
import { VerificationSuccess } from '@/components/auth/verification-success'
import { VerificationError } from '@/components/auth/verification-error'
import { Loader2 } from 'lucide-react'

/**
 * Verification state types
 */
type VerificationState =
  | { type: 'pending'; email: string }
  | { type: 'verifying' }
  | { type: 'success' }
  | { type: 'error'; errorType: 'expired' | 'invalid' | 'unknown'; email?: string }

/**
 * Email Verification Page
 *
 * Handles email verification with token from query params.
 * Supports multiple states: pending, verifying, success, error.
 *
 * Route: /verify-email?token={token}&email={email}
 */
export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const emailParam = searchParams.get('email')

  const [state, setState] = useState<VerificationState>({
    type: token ? 'verifying' : 'pending',
    email: emailParam || '',
  })
  const [resending, setResending] = useState(false)

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
    <AuthLayout>
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
          <VerificationPending
            email={state.email}
            onResend={handleResend}
            isResending={resending}
          />
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
    </AuthLayout>
  )
}
