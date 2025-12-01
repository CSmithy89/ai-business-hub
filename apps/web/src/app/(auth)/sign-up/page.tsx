import { Metadata } from 'next'
import { AuthLayout } from '@/components/auth/auth-layout'
import { SignUpForm } from '@/components/auth/sign-up-form'
import { Button } from '@/components/ui/button'

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

        {/* Social Login Buttons (Placeholder for Story 01.5) */}
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full"
            disabled={true}
            title="Google sign-in coming soon"
          >
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
          </Button>

          <Button
            variant="outline"
            className="w-full"
            disabled={true}
            title="Microsoft sign-in coming soon"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
            </svg>
            Continue with Microsoft
          </Button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
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
