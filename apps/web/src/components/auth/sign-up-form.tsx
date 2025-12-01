'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signUp } from '@/lib/auth-client'
import { signUpSchema, type SignUpFormData } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { PasswordStrengthIndicator } from './password-strength-indicator'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onBlur',
  })

  const password = watch('password', '')

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

  return (
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
            className="pr-10"
          />
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
        <Checkbox
          id="terms"
          {...register('termsAccepted')}
          disabled={isSubmitting}
          aria-invalid={errors.termsAccepted ? 'true' : 'false'}
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
        className="w-full bg-[#FF6B6B] hover:bg-[#FF6B6B]/90"
        disabled={isSubmitting}
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
  )
}
