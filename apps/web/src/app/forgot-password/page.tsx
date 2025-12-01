import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Forgot Password | HYVVE',
  description: 'Reset your HYVVE account password',
}

/**
 * Forgot Password Page (Placeholder)
 *
 * This is a placeholder page for the password reset flow.
 * Full implementation will be in Story 01.6.
 */
export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Forgot Password</h1>
          <p className="text-gray-600">
            Password reset functionality will be available in Story 01.6.
          </p>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <p className="text-gray-700">
            For now, please contact support if you need to reset your password.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <a
            href="/sign-in"
            className="inline-flex items-center justify-center px-6 py-3 bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white rounded-md font-medium transition-colors"
          >
            Back to Sign In
          </a>
        </div>
      </div>
    </div>
  )
}
