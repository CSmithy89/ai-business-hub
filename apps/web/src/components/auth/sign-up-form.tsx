'use client'

import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { signUp, authClient } from '@/lib/auth-client'
import { signUpSchema, type SignUpFormData } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { PasswordStrengthIndicator } from './password-strength-indicator'
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react'
import { getPasswordMatchState, DEFAULT_PASSWORD_MIN_LENGTH_FOR_MATCH } from '@/hooks/use-password-match'

export function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false)
  const [isGitHubLoading, setIsGitHubLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: standardSchemaResolver(signUpSchema),
    mode: 'onBlur',
    defaultValues: {
      termsAccepted: false,
    },
  })

  const password = watch('password', '')
  const confirmPassword = watch('confirmPassword', '')

  const passwordMatchState = getPasswordMatchState(
    password,
    confirmPassword,
    DEFAULT_PASSWORD_MIN_LENGTH_FOR_MATCH
  )
  const { passwordsMatch, showMatchIndicator } = passwordMatchState

  // Generalized social sign-up handler to reduce code duplication
  const handleSocialSignUp = async (
    provider: 'google' | 'microsoft' | 'github',
    setLoading: (loading: boolean) => void
  ) => {
    setLoading(true)
    setError(null)
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: '/dashboard',
      })
      // Redirect happens automatically
    } catch (err) {
      console.error(`${provider} sign-up error:`, err)
      const providerName = provider.charAt(0).toUpperCase() + provider.slice(1)
      setError(`Unable to sign up with ${providerName}. Please try again or use email registration.`)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = () => handleSocialSignUp('google', setIsGoogleLoading)
  const handleMicrosoftSignUp = () => handleSocialSignUp('microsoft', setIsMicrosoftLoading)
  const handleGitHubSignUp = () => handleSocialSignUp('github', setIsGitHubLoading)

  const onSubmit = async (data: SignUpFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await signUp({
        email: data.email,
        password: data.password,
        name: data.name,
      })

      if (result.error) {
        // Handle specific error types
        const errorMessage = result.error.message || 'An error occurred during registration'

        if (errorMessage.includes('email') && errorMessage.includes('already')) {
          setError('This email is already registered. Try signing in instead.')
        } else if (errorMessage.includes('password')) {
          setError('Password does not meet requirements.')
        } else if (errorMessage.includes('rate limit')) {
          setError('Too many registration attempts. Please try again later.')
        } else {
          setError(errorMessage)
        }
      } else {
        setSuccess(true)
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show success message
  if (success) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Account Created!</h2>
          <p className="text-gray-600">
            Please check your email to verify your account. We&apos;ve sent a verification link to complete your registration.
          </p>
        </div>
        <div className="space-y-4">
          <Button asChild className="w-full">
            <a href="/sign-in">Go to Sign In</a>
          </Button>
          <p className="text-sm text-center text-gray-600">
            Didn&apos;t receive the email?{' '}
            <button type="button" className="text-[#FF6B6B] hover:underline">
              Resend verification email
            </button>
          </p>
        </div>
      </div>
    )
  }

  const isAnyOAuthLoading = isGoogleLoading || isMicrosoftLoading || isGitHubLoading

  return (
    <div className="space-y-6">
      {/* Social Sign-Up Buttons */}
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignUp}
          disabled={isAnyOAuthLoading || isSubmitting}
          data-testid="google-sign-up-button"
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
          onClick={handleMicrosoftSignUp}
          disabled={isAnyOAuthLoading || isSubmitting}
          data-testid="microsoft-sign-up-button"
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
          onClick={handleGitHubSignUp}
          disabled={isAnyOAuthLoading || isSubmitting}
          data-testid="github-sign-up-button"
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
          <span className="bg-white px-2 text-gray-500">Or sign up with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="John Doe"
          {...register('name')}
          disabled={isSubmitting}
          aria-invalid={errors.name ? 'true' : 'false'}
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email">Work Email</Label>
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
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a strong password"
            {...register('password')}
            disabled={isSubmitting}
            aria-invalid={errors.password ? 'true' : 'false'}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password.message}</p>
        )}
        <PasswordStrengthIndicator password={password} />
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            {...register('confirmPassword')}
            disabled={isSubmitting}
            aria-invalid={errors.confirmPassword ? 'true' : 'false'}
            className="pr-16"
          />
          {showMatchIndicator && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2">
              {passwordsMatch ? (
                <Check className="w-4 h-4 text-green-600" aria-label="Passwords match" />
              ) : (
                <X className="w-4 h-4 text-red-600" aria-label="Passwords do not match" />
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Terms Checkbox */}
      <div className="flex items-start space-x-2">
        <Controller
          name="termsAccepted"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Checkbox
              id="terms"
              checked={value}
              onCheckedChange={(checked) => onChange(!!checked)}
              disabled={isSubmitting}
              aria-invalid={errors.termsAccepted ? 'true' : 'false'}
            />
          )}
        />
        <div className="space-y-1">
          <Label
            htmlFor="terms"
            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I agree to the{' '}
            <a href="/terms" className="text-[#FF6B6B] hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-[#FF6B6B] hover:underline">
              Privacy Policy
            </a>
          </Label>
          {errors.termsAccepted && (
            <p className="text-sm text-red-600">{errors.termsAccepted.message}</p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90"
        disabled={isSubmitting}
        data-testid="sign-up-button"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </Button>
    </form>
    </div>
  )
}
