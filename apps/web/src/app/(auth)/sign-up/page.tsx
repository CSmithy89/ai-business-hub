import { Metadata } from 'next'
import { AuthLayout } from '@/components/auth/auth-layout'
import { SignUpForm } from '@/components/auth/sign-up-form'

export const metadata: Metadata = {
  title: 'Sign Up - HYVVE',
  description: 'Create your HYVVE account to get started with AI-powered business automation.',
}

export default function SignUpPage() {
  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-600">
            Start your 14-day free trial. No credit card required.
          </p>
        </div>

        {/* Sign Up Form */}
        <SignUpForm />

        {/* Sign In Link */}
        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/sign-in" className="font-medium text-[#FF6B6B] hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </AuthLayout>
  )
}
