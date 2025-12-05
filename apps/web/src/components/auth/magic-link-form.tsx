'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { sendMagicLink } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, AlertCircle, CheckCircle2, Mail } from 'lucide-react'
import Link from 'next/link'

// Validation schema
const magicLinkSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type MagicLinkFormData = z.infer<typeof magicLinkSchema>

export function MagicLinkForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [emailSent, setEmailSent] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MagicLinkFormData>({
    resolver: standardSchemaResolver(magicLinkSchema),
    mode: 'onBlur',
  })

  const onSubmit = async (data: MagicLinkFormData) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await sendMagicLink({
        email: data.email,
        callbackURL: '/dashboard',
      })

      if (result.error) {
        const errorMessage = result.error.message?.toLowerCase() || ''
        if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
          setError('Too many requests. Please try again in a few minutes.')
        } else {
          setError('Failed to send magic link. Please try again.')
        }
      } else {
        setSuccess(true)
        setEmailSent(data.email)
      }
    } catch (err) {
      console.error('Magic link error:', err)
      setError('Unable to send magic link. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2 text-center">
        <div className="mx-auto w-12 h-12 bg-[#FF6B6B]/10 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-[#FF6B6B]" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Sign in with Magic Link</h1>
        <p className="text-gray-600">
          We&apos;ll email you a link to sign in instantly
        </p>
      </div>

      {success ? (
        /* Success State */
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-green-900 mb-1">
                  Check your email
                </h3>
                <p className="text-sm text-green-700">
                  We&apos;ve sent a sign-in link to <strong>{emailSent}</strong>
                </p>
                <p className="text-sm text-green-700 mt-2">
                  The link will expire in 15 minutes. Check your spam folder if you don&apos;t see it.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-gray-600">
            <button
              type="button"
              onClick={() => {
                setSuccess(false)
                setEmailSent('')
              }}
              className="text-[#FF6B6B] hover:underline font-medium"
            >
              Send to a different email
            </button>
          </div>
        </div>
      ) : (
        /* Form */
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Error Banner */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
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

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-[#FF6B6B] hover:bg-[#FF6B6B]/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending Magic Link...
              </>
            ) : (
              'Send Magic Link'
            )}
          </Button>
        </form>
      )}

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Or</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="space-y-3 text-center text-sm">
        <p className="text-gray-600">
          <Link href="/sign-in" className="text-[#FF6B6B] hover:underline font-medium">
            Sign in with password
          </Link>
        </p>
        <p className="text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="text-[#FF6B6B] hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
