import { Metadata } from 'next'
import { AuthLayout } from '@/components/auth/auth-layout'
import { SignInForm } from '@/components/auth/sign-in-form'

export const metadata: Metadata = {
  title: 'Sign In | HYVVE',
  description: 'Sign in to your HYVVE account',
}

/**
 * Sign-In Page
 *
 * Allows existing users to authenticate with email/password.
 *
 * Features:
 * - Email/password authentication via better-auth
 * - "Remember me" option (extends session to 30 days)
 * - Password show/hide toggle
 * - Rate limiting (5 attempts per 15 minutes)
 * - Email verification check
 * - Google OAuth button (non-functional, Story 01.5)
 * - Redirects to dashboard on success
 *
 * Security:
 * - Generic error messages prevent user enumeration
 * - HTTP-only session cookies
 * - Argon2id password hashing
 * - Rate limiting prevents brute force attacks
 */
export default function SignInPage() {
  return (
    <AuthLayout>
      <SignInForm />
    </AuthLayout>
  )
}
