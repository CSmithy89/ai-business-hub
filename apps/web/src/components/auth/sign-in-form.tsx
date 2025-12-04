'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useRouter } from 'next/navigation'
import { signIn, authClient } from '@/lib/auth-client'
import { signInSchema, type SignInFormData } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { PasswordInput } from './password-input'
import { Loader2, AlertCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

type ErrorType = 'INVALID_CREDENTIALS' | 'EMAIL_NOT_VERIFIED' | 'RATE_LIMITED' | 'NETWORK_ERROR' | 'OAUTH_ERROR' | null

export function SignInForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<ErrorType>(null)
  const [retryAfter, setRetryAfter] = useState<number | null>(null)

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
        // Success - redirect to dashboard
        router.push('/dashboard')
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

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setError(null)
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/dashboard',
      })
      // Redirect happens automatically
    } catch (error) {
      console.error('Google sign-in error:', error)
      setError('OAUTH_ERROR')
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="space-y-6">
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
          disabled={isGoogleLoading || isSubmitting}
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
                Unable to sign in with Google. Please try again or use email sign-in.
              </p>
            </div>
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            {...register('email')}
            disabled={isSubmitting}
            aria-invalid={errors.email ? 'true' : 'false'}
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
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
            {...register('password')}
            disabled={isSubmitting}
            error={!!errors.password}
          />
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password.message}</p>
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
    </div>
  )
}
