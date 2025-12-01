'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/auth-layout'

/**
 * Simple in-memory rate limiting for forgot password requests
 * Tracks attempts by email address
 * MVP implementation - should be moved to Redis for production
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [email, data] of rateLimitStore.entries()) {
    if (now > data.resetAt) {
      rateLimitStore.delete(email)
    }
  }
}, 5 * 60 * 1000)

/**
 * Check if email is rate limited
 */
function isRateLimited(email: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(email)

  if (!record) {
    return false
  }

  // Reset if time window passed
  if (now > record.resetAt) {
    rateLimitStore.delete(email)
    return false
  }

  // Check if limit exceeded
  return record.count >= 3
}

/**
 * Record attempt
 */
function recordAttempt(email: string) {
  const now = Date.now()
  const record = rateLimitStore.get(email)

  if (!record || now > record.resetAt) {
    // New window
    rateLimitStore.set(email, {
      count: 1,
      resetAt: now + 60 * 60 * 1000, // 1 hour from now
    })
  } else {
    // Increment count
    record.count += 1
  }
}

/**
 * Get time until rate limit reset (in minutes)
 */
function getTimeUntilReset(email: string): number {
  const record = rateLimitStore.get(email)
  if (!record) return 0

  const now = Date.now()
  const remainingMs = record.resetAt - now
  return Math.ceil(remainingMs / (60 * 1000))
}

type FormState = 'initial' | 'submitting' | 'success' | 'error' | 'rate-limited'

/**
 * Forgot Password Page
 *
 * Allows users to request a password reset link via email.
 * Implements rate limiting (3 attempts per hour) and security best practices.
 *
 * Features:
 * - Email validation
 * - Rate limiting (3 requests per hour)
 * - Always shows success message (security best practice)
 * - Resend capability with cooldown
 * - Error handling
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<FormState>('initial')
  const [error, setError] = useState<string>('')
  const [canResend, setCanResend] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(30)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    // Check rate limiting
    if (isRateLimited(email)) {
      const minutesUntilReset = getTimeUntilReset(email)
      setError(`Too many requests. Please wait ${minutesUntilReset} minutes before trying again.`)
      setState('rate-limited')
      return
    }

    setState('submitting')

    try {
      // Call better-auth forget-password endpoint
      const response = await fetch('/api/auth/forget-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      // Record attempt for rate limiting
      recordAttempt(email)

      if (!response.ok) {
        throw new Error('Failed to send reset email')
      }

      // Always show success message for security
      // (Don't reveal if email exists in database)
      setState('success')
      setCanResend(false)

      // Enable resend after 30 seconds
      let countdown = 30
      setResendCountdown(countdown)
      const interval = setInterval(() => {
        countdown -= 1
        setResendCountdown(countdown)
        if (countdown <= 0) {
          clearInterval(interval)
          setCanResend(true)
        }
      }, 1000)
    } catch (err) {
      console.error('Forgot password error:', err)
      setError('Something went wrong. Please try again.')
      setState('error')
    }
  }

  const handleResend = () => {
    setCanResend(false)
    setState('initial')
    // Form can be resubmitted
  }

  return (
    <AuthLayout>
      <div className="flex w-full flex-col gap-8">
        {/* Initial Form State */}
        {(state === 'initial' || state === 'submitting' || state === 'error') && (
          <>
            <div className="flex flex-col items-center gap-2 text-center">
              <h3 className="font-display text-2xl font-bold leading-tight tracking-tight text-text-primary-light dark:text-text-primary-dark">
                Forgot your password?
              </h3>
              <p className="font-display max-w-xs text-[15px] font-normal leading-normal text-text-secondary">
                No worries! Enter your email and we&apos;ll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full">
              <div className="mb-4 flex flex-col items-start self-stretch">
                <label className="mb-2 flex w-full flex-col">
                  <p className="font-display text-sm font-medium leading-normal text-text-primary-light dark:text-text-primary-dark">
                    Email Address
                  </p>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={state === 'submitting'}
                  className="form-input font-display h-12 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-md border border-border-light bg-surface-light p-3 text-base font-normal leading-normal text-text-primary-light placeholder:text-text-secondary/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-border-dark dark:bg-surface-dark dark:text-text-primary-dark disabled:opacity-50"
                  placeholder="john@company.com"
                  autoFocus
                />
              </div>

              {error && (state === 'initial' || state === 'error') && (
                <div className="mb-4 flex items-start gap-2 rounded-md bg-error/10 p-3">
                  <span className="material-symbols-outlined mt-0.5 text-base text-error">
                    warning
                  </span>
                  <p className="font-display text-sm text-error">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={state === 'submitting'}
                className="flex h-11 min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-md bg-primary px-5 text-base font-semibold leading-normal text-white transition-colors duration-150 ease-out hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-light dark:focus:ring-offset-surface-dark disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {state === 'submitting' ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    <span className="truncate">Sending...</span>
                  </>
                ) : (
                  <span className="truncate">Send Reset Link</span>
                )}
              </button>
            </form>

            <div className="h-px w-full bg-border-light dark:bg-border-dark" />

            <Link
              href="/sign-in"
              className="flex items-center gap-2 font-display text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Back to sign in</span>
            </Link>
          </>
        )}

        {/* Success State */}
        {state === 'success' && (
          <>
            <span className="material-symbols-outlined text-5xl !font-light text-primary self-center">
              mark_email_read
            </span>
            <div className="flex flex-col gap-2 text-center">
              <h3 className="font-display text-2xl font-bold leading-tight tracking-tight text-text-primary-light dark:text-text-primary-dark">
                Check your email
              </h3>
              <p className="font-display text-[15px] font-normal leading-normal text-text-secondary">
                We&apos;ve sent a password reset link to:
                <br />
                <strong className="text-text-primary-light dark:text-text-primary-dark">{email}</strong>
              </p>
              <p className="font-display text-xs text-text-secondary">The link will expire in 1 hour.</p>
            </div>

            <div className="h-px w-full bg-border-light dark:bg-border-dark" />

            <div className="flex flex-col gap-2 text-center">
              <p className="font-display text-sm text-text-secondary">
                Didn&apos;t receive the email?
                <br />
                Check your spam folder or{' '}
                {canResend ? (
                  <button
                    onClick={handleResend}
                    className="font-medium text-primary hover:underline"
                  >
                    Resend email
                  </button>
                ) : (
                  <span className="font-medium text-text-secondary">
                    Resend available in {resendCountdown}s
                  </span>
                )}
                .
              </p>
            </div>

            <div className="h-px w-full bg-border-light dark:bg-border-dark" />

            <Link
              href="/sign-in"
              className="flex items-center gap-2 font-display text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Back to sign in</span>
            </Link>
          </>
        )}

        {/* Rate Limited State */}
        {state === 'rate-limited' && (
          <>
            <div className="flex flex-col items-center gap-2 text-center">
              <h3 className="font-display text-2xl font-bold leading-tight tracking-tight text-text-primary-light dark:text-text-primary-dark">
                Forgot your password?
              </h3>
              <p className="font-display max-w-xs text-[15px] font-normal leading-normal text-text-secondary">
                No worries! Enter your email and we&apos;ll send you a link to reset your password.
              </p>
            </div>

            <div className="w-full">
              <div className="mb-4 flex items-start gap-2 rounded-md bg-warning/10 p-3">
                <span className="material-symbols-outlined mt-0.5 text-base text-warning">
                  warning
                </span>
                <p className="font-display text-sm text-warning">{error}</p>
              </div>

              <div className="mb-4 flex flex-col items-start self-stretch">
                <label className="mb-2 flex w-full flex-col">
                  <p className="font-display text-sm font-medium leading-normal text-text-primary-light dark:text-text-primary-dark">
                    Email Address
                  </p>
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="form-input font-display h-12 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-md border border-border-light bg-surface-light p-3 text-base font-normal leading-normal text-text-primary-light placeholder:text-text-secondary/60 dark:border-border-dark dark:bg-surface-dark dark:text-text-primary-dark opacity-50"
                  placeholder="john@company.com"
                />
              </div>

              <button
                disabled
                className="flex h-11 min-w-[84px] w-full cursor-not-allowed items-center justify-center overflow-hidden rounded-md bg-primary px-5 text-base font-semibold leading-normal text-white opacity-50"
              >
                <span className="truncate">Send Reset Link</span>
              </button>
            </div>

            <div className="h-px w-full bg-border-light dark:bg-border-dark" />

            <Link
              href="/sign-in"
              className="flex items-center gap-2 font-display text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Back to sign in</span>
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
