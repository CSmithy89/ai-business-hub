'use client'

import { useState, useEffect, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/auth-layout'
import { PasswordInput } from '@/components/auth/password-input'
import { PasswordStrengthIndicator } from '@/components/auth/password-strength-indicator'
import { calculatePasswordStrength } from '@/lib/utils/password-strength'

type PageState = 'form' | 'submitting' | 'success' | 'invalid-token' | 'expired-token'

/**
 * Reset Password Page Content
 * Extracted to separate component to use useSearchParams
 */
function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')

  const [state, setState] = useState<PageState>('form')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string>('')
  const [redirectCountdown, setRedirectCountdown] = useState(5)

  // Check if token exists
  useEffect(() => {
    if (!token) {
      setState('invalid-token')
    }
  }, [token])

  // Auto-redirect after successful reset
  useEffect(() => {
    if (state === 'success') {
      const interval = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            router.push('/sign-in')
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        clearInterval(interval)
      }
    }
    return undefined
  }, [state, router])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords don't match")
      return
    }

    // Validate password strength
    const strength = calculatePasswordStrength(password)
    if (strength.score < 4) {
      setError('Password must meet all requirements')
      return
    }

    setState('submitting')

    try {
      // Call better-auth reset-password endpoint
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      })

      if (!response.ok) {
        const data = await response.json()

        // Check for specific error types
        if (data.error?.includes('expired') || data.error?.includes('invalid')) {
          setState('expired-token')
          return
        }

        throw new Error(data.error || 'Failed to reset password')
      }

      // Success - all sessions invalidated automatically by better-auth
      setState('success')
    } catch (err) {
      console.error('Reset password error:', err)
      setError('Something went wrong. Please try again.')
      setState('form')
    }
  }

  const passwordsMatch = password && confirmPassword && password === confirmPassword
  const passwordsDontMatch = password && confirmPassword && password !== confirmPassword

  return (
    <AuthLayout>
      <div className="flex w-full flex-col gap-8">
        {/* Form State */}
        {(state === 'form' || state === 'submitting') && (
          <>
            <div className="flex flex-col items-center text-center gap-4">
              <svg fill="none" height="48" viewBox="0 0 48 48" width="48" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M24 48C37.2548 48 48 37.2548 48 24C48 10.7452 37.2548 0 24 0C10.7452 0 0 10.7452 0 24C0 37.2548 10.7452 48 24 48Z"
                  fill="#1A1A1A"
                />
                <path
                  d="M27.291 14.0333L32.8333 19.5756V32.8333H15.1667V19.5756L20.709 14.0333H27.291ZM28.5 12.8333H19.5L12.8333 19.5V34.0333H35.1667V19.5L28.5 12.8333Z"
                  fill="#FAFAFA"
                />
                <path d="M29.5 28.3333H18.5V26H29.5V28.3333ZM29.5 23.6667H18.5V21.3333H29.5V23.6667Z" fill="#FAFAFA" />
              </svg>
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
                  Set new password
                </h1>
                <p className="text-text-secondary">Create a strong password for your account</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                {/* New Password Input */}
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="w-full"
                  name="new-password"
                  autoComplete="new-password"
                />

                {/* Password Strength Indicator */}
                {password && <PasswordStrengthIndicator password={password} />}
              </div>

              {/* Confirm Password Input */}
              <div className="flex flex-col gap-2">
                <label htmlFor="confirm-password" className="text-sm font-medium">
                  Confirm Password
                </label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="w-full"
                  name="confirm-password"
                  autoComplete="new-password"
                />

                {/* Match Indicator */}
                {passwordsMatch && (
                  <div className="flex items-center gap-2 text-sm text-success">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      check_circle
                    </span>
                    <p>Passwords match</p>
                  </div>
                )}
                {passwordsDontMatch && (
                  <div className="flex items-center gap-2 text-sm text-error">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      cancel
                    </span>
                    <p>Passwords don&apos;t match</p>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-2 rounded-md bg-error/10 p-3">
                  <span className="material-symbols-outlined mt-0.5 text-base text-error">
                    warning
                  </span>
                  <p className="font-display text-sm text-error">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={state === 'submitting' || !password || !confirmPassword || !passwordsMatch}
                className="h-11 w-full rounded-md bg-primary text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {state === 'submitting' ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        fill="currentColor"
                      />
                    </svg>
                    <span>Resetting...</span>
                  </div>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          </>
        )}

        {/* Success State */}
        {state === 'success' && (
          <div className="flex flex-col gap-8 items-center text-center">
            <svg fill="none" height="48" viewBox="0 0 48 48" width="48" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M24 48C37.2548 48 48 37.2548 48 24C48 10.7452 37.2548 0 24 0C10.7452 0 0 10.7452 0 24C0 37.2548 10.7452 48 24 48Z"
                fill="#1A1A1A"
              />
              <path
                d="M27.291 14.0333L32.8333 19.5756V32.8333H15.1667V19.5756L20.709 14.0333H27.291ZM28.5 12.8333H19.5L12.8333 19.5V34.0333H35.1667V19.5L28.5 12.8333Z"
                fill="#FAFAFA"
              />
              <path d="M29.5 28.3333H18.5V26H29.5V28.3333ZM29.5 23.6667H18.5V21.3333H29.5V23.6667Z" fill="#FAFAFA" />
            </svg>

            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
              <span className="material-symbols-outlined" style={{ fontSize: '32px', fontVariationSettings: "'wght' 600" }}>
                check
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
                Password reset successful!
              </h1>
              <p className="text-text-secondary max-w-sm">
                Your password has been updated. You can now sign in with your new password.
              </p>
            </div>

            <button
              onClick={() => router.push('/sign-in')}
              className="h-11 w-full rounded-md bg-primary text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Sign In
            </button>

            <p className="text-sm text-text-secondary">Redirecting in {redirectCountdown} seconds...</p>
          </div>
        )}

        {/* Expired Token State */}
        {state === 'expired-token' && (
          <div className="flex flex-col gap-8 items-center text-center">
            <svg fill="none" height="48" viewBox="0 0 48 48" width="48" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M24 48C37.2548 48 48 37.2548 48 24C48 10.7452 37.2548 0 24 0C10.7452 0 0 10.7452 0 24C0 37.2548 10.7452 48 24 48Z"
                fill="#1A1A1A"
              />
              <path
                d="M27.291 14.0333L32.8333 19.5756V32.8333H15.1667V19.5756L20.709 14.0333H27.291ZM28.5 12.8333H19.5L12.8333 19.5V34.0333H35.1667V19.5L28.5 12.8333Z"
                fill="#FAFAFA"
              />
              <path d="M29.5 28.3333H18.5V26H29.5V28.3333ZM29.5 23.6667H18.5V21.3333H29.5V23.6667Z" fill="#FAFAFA" />
            </svg>

            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/10 text-warning">
              <span className="material-symbols-outlined" style={{ fontSize: '32px', fontVariationSettings: "'wght' 600" }}>
                priority_high
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
                Reset link expired
              </h1>
              <p className="text-text-secondary max-w-sm">
                This password reset link has expired or has already been used.
              </p>
            </div>

            <Link
              href="/forgot-password"
              className="h-11 w-full rounded-md bg-primary text-sm font-semibold text-white transition-opacity hover:opacity-90 flex items-center justify-center"
            >
              Request New Reset Link
            </Link>

            <Link
              href="/sign-in"
              className="flex items-center gap-2 text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary-light dark:hover:text-text-primary-dark"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                arrow_back
              </span>
              Back to sign in
            </Link>
          </div>
        )}

        {/* Invalid Token State */}
        {state === 'invalid-token' && (
          <div className="flex flex-col gap-8 items-center text-center">
            <svg fill="none" height="48" viewBox="0 0 48 48" width="48" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M24 48C37.2548 48 48 37.2548 48 24C48 10.7452 37.2548 0 24 0C10.7452 0 0 10.7452 0 24C0 37.2548 10.7452 48 24 48Z"
                fill="#1A1A1A"
              />
              <path
                d="M27.291 14.0333L32.8333 19.5756V32.8333H15.1667V19.5756L20.709 14.0333H27.291ZM28.5 12.8333H19.5L12.8333 19.5V34.0333H35.1667V19.5L28.5 12.8333Z"
                fill="#FAFAFA"
              />
              <path d="M29.5 28.3333H18.5V26H29.5V28.3333ZM29.5 23.6667H18.5V21.3333H29.5V23.6667Z" fill="#FAFAFA" />
            </svg>

            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error/10 text-error">
              <span className="material-symbols-outlined" style={{ fontSize: '32px', fontVariationSettings: "'wght' 600" }}>
                close
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
                Invalid reset link
              </h1>
              <p className="text-text-secondary max-w-sm">
                This link is invalid or malformed. Please request a new password reset.
              </p>
            </div>

            <Link
              href="/forgot-password"
              className="h-11 w-full rounded-md bg-primary text-sm font-semibold text-white transition-opacity hover:opacity-90 flex items-center justify-center"
            >
              Request New Reset Link
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}

/**
 * Reset Password Page
 *
 * Allows users to set a new password using a reset token from email.
 * Validates token, enforces password requirements, and invalidates all sessions.
 *
 * Features:
 * - Token validation (checks expiry and validity)
 * - Password strength indicator and requirements
 * - Password confirmation with match validation
 * - Auto-redirect after successful reset
 * - Error states for invalid/expired tokens
 * - Session invalidation (handled by better-auth)
 */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthLayout><div className="text-center">Loading...</div></AuthLayout>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
