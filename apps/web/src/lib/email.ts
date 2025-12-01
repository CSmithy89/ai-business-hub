import { Resend } from 'resend'
import { VerificationEmail } from '../emails/verification-email'

/**
 * Initialize Resend client
 * For local development without API key, emails will be logged to console
 */
const resendApiKey = process.env.RESEND_API_KEY || 'test'
const resend = new Resend(resendApiKey)

/**
 * Base URL for verification links
 */
const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'

/**
 * Email service configuration
 */
const EMAIL_CONFIG = {
  from: 'HYVVE <onboarding@hyvve.app>',
  replyTo: 'support@hyvve.app',
}

/**
 * Send verification email to user
 *
 * @param to - Recipient email address
 * @param token - Verification token
 * @param userName - Optional user name for personalization
 * @returns Promise that resolves when email is sent
 */
export async function sendVerificationEmail(
  to: string,
  token: string,
  userName?: string
): Promise<void> {
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`

  // For local development without Resend API key
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'test') {
    console.log('\n📧 Verification Email (Local Dev Mode)')
    console.log('═══════════════════════════════════════')
    console.log(`To: ${to}`)
    console.log(`Subject: Verify your email address for HYVVE`)
    console.log(`Verification Link: ${verificationUrl}`)
    console.log(`Token: ${token}`)
    console.log('═══════════════════════════════════════\n')
    return
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: 'Verify your email address for HYVVE',
      react: VerificationEmail({
        verificationUrl,
        userName,
      }),
    })

    if (error) {
      console.error('Failed to send verification email:', error)
      throw new Error(`Email sending failed: ${error.message}`)
    }

    console.log('Verification email sent successfully:', data?.id)
  } catch (error) {
    console.error('Error sending verification email:', error)
    // Don't throw error to prevent blocking user registration
    // Log error and continue - user can request resend later
  }
}

/**
 * Send password reset email
 *
 * @param to - Recipient email address
 * @param token - Reset token
 * @returns Promise that resolves when email is sent
 */
export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const resetUrl = `${baseUrl}/reset-password?token=${token}`

  // For local development
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'test') {
    console.log('\n📧 Password Reset Email (Local Dev Mode)')
    console.log('═══════════════════════════════════════')
    console.log(`To: ${to}`)
    console.log(`Subject: Reset your HYVVE password`)
    console.log(`Reset Link: ${resetUrl}`)
    console.log(`Token: ${token}`)
    console.log('═══════════════════════════════════════\n')
    return
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: 'Reset your HYVVE password',
      html: `
        <h1>Reset your password</h1>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>Or copy and paste this URL into your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      `,
    })

    if (error) {
      console.error('Failed to send password reset email:', error)
      throw new Error(`Email sending failed: ${error.message}`)
    }

    console.log('Password reset email sent successfully:', data?.id)
  } catch (error) {
    console.error('Error sending password reset email:', error)
  }
}
