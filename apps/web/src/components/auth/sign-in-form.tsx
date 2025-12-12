'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, authClient } from '@/lib/auth-client'
import { signInSchema, type SignInFormData } from '@/lib/validations/auth'
import { isAllowedRedirect, getSafeRedirectUrl } from '@/lib/utils/redirect-validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { PasswordInput } from './password-input'
import { TwoFactorVerify } from './two-factor-verify'
import { Loader2, AlertCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

type ErrorType = 'INVALID_CREDENTIALS' | 'EMAIL_NOT_VERIFIED' | 'RATE_LIMITED' | 'NETWORK_ERROR' | 'OAUTH_ERROR' | null

export function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false)
  const [isGitHubLoading, setIsGitHubLoading] = useState(false)
  const [error, setError] = useState<ErrorType>(null)
  const [retryAfter, setRetryAfter] = useState<number | null>(null)
  const [show2FA, setShow2FA] = useState(false)
  const [verifyingUserId, setVerifyingUserId] = useState<string | null>(null)

  // Track pending OAuth operations to prevent duplicate submissions
  const pendingOAuthRef = useRef<'google' | 'microsoft' | 'github' | null>(null)

  // OAuth timeout cleanup
  const oauthTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup OAuth timeout on unmount
  useEffect(() => {
    return () => {
      if (oauthTimeoutRef.current) {
        clearTimeout(oauthTimeoutRef.current)
      }
    }
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SignInFormData>({
    resolver: standardSchemaResolver(signInSchema),
    mode: 'onBlur',
    defaultValues: {
      rememberMe: false,
    },
  })

  const rememberMe = watch('rememberMe')

  /**
   * Handles successful sign-in by determining the appropriate redirect destination
   * Based on user state:
   * - If deep link provided in URL → redirect to deep link (with validation)
   * - If no workspaces → /onboarding/account-setup
   * - If workspaces exist → /businesses
   *
   * Story: 15.15 - Update Sign-In Flow Redirect Logic
   * Security: Validates redirect URLs to prevent open redirect attacks
   */
  const handleSuccessfulSignIn = useCallback(async () => {
    try {
      // Check for intended destination from URL params (deep link support)
      const redirectParam = searchParams.get('redirect')

      // Validate redirect URL to prevent open redirect attacks
      if (isAllowedRedirect(redirectParam)) {
        router.push(getSafeRedirectUrl(redirectParam) as Parameters<typeof router.push>[0])
        return
      }

      // Fetch the appropriate redirect destination from the API
      const response = await fetch('/api/auth/redirect-destination')
      const result = await response.json()

      if (result.success && result.data?.destination) {
        // API responses are trusted but still validate for defense in depth
        const destination = getSafeRedirectUrl(result.data.destination)
        router.push(destination as Parameters<typeof router.push>[0])
      } else {
        // Default fallback to businesses page
        router.push('/businesses')
      }
    } catch (error) {
      console.error('Failed to determine redirect destination:', error)
      // Default fallback to businesses page
      router.push('/businesses')
    }
  }, [searchParams, router])

  const onSubmit = async (data: SignInFormData) => {
    setIsSubmitting(true)
    setError(null)
    setRetryAfter(null)

    try {
      const result = await signIn({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      })

      if (result.error) {
        // Handle specific error types
        const errorMessage = result.error.message?.toLowerCase() || ''

        if (errorMessage.includes('not verified') || errorMessage.includes('email verification')) {
          setError('EMAIL_NOT_VERIFIED')
        } else if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
          setError('RATE_LIMITED')
          // Extract retry time if available (parse from message or use default)
          const retryMatch = errorMessage.match(/(\d+)\s*(minute|second)/i)
          if (retryMatch) {
            const time = parseInt(retryMatch[1])
            const unit = retryMatch[2].toLowerCase()
            setRetryAfter(unit === 'minute' ? time * 60 : time)
          }
        } else {
          // Generic error for invalid credentials (prevents user enumeration)
          setError('INVALID_CREDENTIALS')
        }
      } else {
        // Check if 2FA is enabled for this user
        // Need to fetch 2FA status separately as better-auth doesn't include it in sign-in response
        const userId = result.data?.user?.id
        if (userId) {
          try {
            const statusResponse = await fetch('/api/auth/2fa/status')
            const statusData = await statusResponse.json()

            if (statusData.enabled) {
              // Show 2FA verification component
              setShow2FA(true)
              setVerifyingUserId(userId)
            } else {
              // Success - determine redirect destination based on user state
              await handleSuccessfulSignIn()
            }
          } catch (error) {
            console.error('Failed to check 2FA status:', error)
            // Fail closed - show error, don't let user through without 2FA verification
            setError('NETWORK_ERROR')
          }
        } else {
          // Success - determine redirect destination based on user state
          await handleSuccessfulSignIn()
        }
      }
    } catch (err) {
      console.error('Sign-in error:', err)
      setError('NETWORK_ERROR')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendVerification = async () => {
    // TODO: Implement resend verification email
    // This will be reused from Story 01.3
    console.log('Resend verification email')
  }

  /**
   * Get the callback URL for OAuth sign-in
   * Uses the redirect param if available (with validation), otherwise defaults to /businesses
   * Story: 15.15 - Update Sign-In Flow Redirect Logic
   * Security: Validates redirect URLs to prevent open redirect attacks
   * Note: Returns absolute URL as required by OAuth providers
   */
  const getOAuthCallbackURL = useCallback(() => {
    const redirectParam = searchParams.get('redirect')
    // Use validated redirect URL or fall back to businesses
    const relativePath = getSafeRedirectUrl(redirectParam, '/businesses')
    // Return absolute URL for OAuth callback - required by OAuth providers
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${relativePath}`
    }
    return relativePath
  }, [searchParams])

  /**
   * Generic OAuth sign-in handler with deduplication and timeout handling
   * Prevents duplicate OAuth requests and handles stuck loading states
   */
  const handleOAuthSignIn = useCallback(
    async (provider: 'google' | 'microsoft' | 'github') => {
      // Prevent duplicate OAuth operations
      if (pendingOAuthRef.current) {
        console.warn(`OAuth operation already pending for ${pendingOAuthRef.current}`)
        return
      }

      // Set loading state based on provider
      const setLoading = {
        google: setIsGoogleLoading,
        microsoft: setIsMicrosoftLoading,
        github: setIsGitHubLoading,
      }[provider]

      pendingOAuthRef.current = provider
      setLoading(true)
      setError(null)

      // Clear any existing timeout
      if (oauthTimeoutRef.current) {
        clearTimeout(oauthTimeoutRef.current)
      }

      // Set timeout to reset loading state if OAuth doesn't complete
      // This handles cases where the OAuth popup is closed without completing
      oauthTimeoutRef.current = setTimeout(() => {
        if (pendingOAuthRef.current === provider) {
          console.warn(`OAuth timeout for ${provider}`)
          setLoading(false)
          pendingOAuthRef.current = null
          setError('OAUTH_ERROR')
          oauthTimeoutRef.current = null // Clear ref after timeout fires
        }
      }, 60000) // 60 second timeout

      try {
        await authClient.signIn.social({
          provider,
          callbackURL: getOAuthCallbackURL(),
        })
        // Redirect happens automatically - timeout will be cleared on unmount
      } catch (error) {
        console.error(`${provider} sign-in error:`, error)
        setError('OAUTH_ERROR')
        setLoading(false)
        pendingOAuthRef.current = null
        if (oauthTimeoutRef.current) {
          clearTimeout(oauthTimeoutRef.current)
          oauthTimeoutRef.current = null
        }
      }
    },
    [getOAuthCallbackURL]
  )

  const handleGoogleSignIn = useCallback(() => handleOAuthSignIn('google'), [handleOAuthSignIn])
  const handleMicrosoftSignIn = useCallback(
    () => handleOAuthSignIn('microsoft'),
    [handleOAuthSignIn]
  )
  const handleGitHubSignIn = useCallback(() => handleOAuthSignIn('github'), [handleOAuthSignIn])

  const handle2FASuccess = useCallback(async () => {
    // Use the same intelligent redirect logic after 2FA success
    await handleSuccessfulSignIn()
  }, [handleSuccessfulSignIn])

  const handle2FACancel = () => {
    setShow2FA(false)
    setVerifyingUserId(null)
  }

  return (
    <div className="space-y-6">
      {show2FA && verifyingUserId ? (
        <TwoFactorVerify
          userId={verifyingUserId}
          onSuccess={handle2FASuccess}
          onCancel={handle2FACancel}
        />
      ) : (
        <>
          {/* Page Header */}
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

      {/* Social Sign-In Buttons */}
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isSubmitting || isMicrosoftLoading || isGitHubLoading}
          data-testid="google-sign-in-button"
        >
          {isGoogleLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting to Google...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleMicrosoftSignIn}
          disabled={isMicrosoftLoading || isSubmitting || isGoogleLoading || isGitHubLoading}
          data-testid="microsoft-sign-in-button"
        >
          {isMicrosoftLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting to Microsoft...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
              </svg>
              Continue with Microsoft
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGitHubSignIn}
          disabled={isGitHubLoading || isSubmitting || isGoogleLoading || isMicrosoftLoading}
          data-testid="github-sign-in-button"
        >
          {isGitHubLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting to GitHub...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Continue with GitHub
            </>
          )}
        </Button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Or</span>
        </div>
      </div>

      {/* Sign-In Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Error Banners */}
        {error === 'INVALID_CREDENTIALS' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-600">
                Invalid email or password. Please try again.
              </p>
            </div>
          </div>
        )}

        {error === 'EMAIL_NOT_VERIFIED' && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-yellow-600">
                  Please verify your email address before signing in. Check your inbox for a verification link.
                </p>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  className="mt-2 text-sm font-medium text-yellow-600 hover:underline"
                >
                  Resend Verification Email
                </button>
              </div>
            </div>
          </div>
        )}

        {error === 'RATE_LIMITED' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-600">
                Too many sign-in attempts. Please try again in{' '}
                {retryAfter ? `${Math.ceil(retryAfter / 60)} minutes` : 'a few minutes'}.
              </p>
            </div>
          </div>
        )}

        {error === 'NETWORK_ERROR' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-600">
                Unable to connect. Please check your internet connection and try again.
              </p>
            </div>
          </div>
        )}

        {error === 'OAUTH_ERROR' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-600">
                Unable to sign in with OAuth provider. Please try again or use email sign-in.
              </p>
            </div>
          </div>
        )}

        {/* Email Field - Story 15-24: Form Accessibility */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            {...register('email')}
            disabled={isSubmitting}
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
            aria-required="true"
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-red-600" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field - Story 15-24: Form Accessibility */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-sm text-[#FF6B6B] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            aria-describedby={errors.password ? 'password-error' : undefined}
            aria-required="true"
            {...register('password')}
            disabled={isSubmitting}
            error={!!errors.password}
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-red-600" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="rememberMe"
            checked={rememberMe}
            onCheckedChange={(checked) => setValue('rememberMe', !!checked)}
            disabled={isSubmitting}
          />
          <Label
            htmlFor="rememberMe"
            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Remember me (extends session to 30 days)
          </Label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-[#FF6B6B] hover:bg-[#FF6B6B]/90"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>

      {/* Sign-Up Link */}
      <p className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <Link href="/sign-up" className="text-[#FF6B6B] hover:underline font-medium">
          Sign up
        </Link>
      </p>

      {/* Magic Link Option */}
      <p className="text-center text-sm text-gray-600">
        Prefer passwordless sign-in?{' '}
        <Link href="/magic-link" prefetch={false} className="text-[#FF6B6B] hover:underline font-medium">
          Email me a login link
        </Link>
      </p>
        </>
      )}
    </div>
  )
}
