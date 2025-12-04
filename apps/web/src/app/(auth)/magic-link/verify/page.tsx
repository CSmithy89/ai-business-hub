'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token')

      if (!token) {
        setStatus('error')
        setErrorMessage('No verification token provided')
        return
      }

      try {
        // Call the verification endpoint
        // better-auth handles this automatically via GET /api/auth/magic-link/verify
        const response = await fetch(
          `/api/auth/magic-link/verify?token=${encodeURIComponent(token)}`,
          {
            method: 'GET',
            credentials: 'include',
          }
        )

        if (response.ok) {
          setStatus('success')
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        } else {
          const data = await response.json()
          setStatus('error')

          // Parse error message
          const errorMsg = data.error?.message?.toLowerCase() || ''
          if (errorMsg.includes('expired')) {
            setErrorMessage('This magic link has expired. Please request a new one.')
          } else if (errorMsg.includes('invalid') || errorMsg.includes('not found')) {
            setErrorMessage('This magic link is invalid or has already been used.')
          } else {
            setErrorMessage('Unable to verify magic link. Please try again.')
          }
        }
      } catch (err) {
        console.error('Verification error:', err)
        setStatus('error')
        setErrorMessage('Network error. Please check your connection and try again.')
      }
    }

    verifyToken()
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-lg rounded-lg px-8 py-10">
          <div className="space-y-6">
            {status === 'verifying' && (
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Verifying your magic link...
                </h1>
                <p className="text-gray-600">
                  Please wait while we sign you in
                </p>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Successfully signed in!
                </h1>
                <p className="text-gray-600">
                  Redirecting you to your dashboard...
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Verification Failed
                  </h1>
                </div>

                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 text-center">
                    {errorMessage}
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    asChild
                    className="w-full bg-[#FF6B6B] hover:bg-[#FF6B6B]/90"
                  >
                    <Link href="/magic-link" prefetch={false}>Request New Magic Link</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                  >
                    <Link href="/sign-in">Sign In with Password</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MagicLinkVerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
