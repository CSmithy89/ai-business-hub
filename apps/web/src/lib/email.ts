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
 * Send magic link email
 *
 * @param to - Recipient email address
 * @param url - Full magic link URL with token
 * @param token - Raw token for logging in dev mode
 * @returns Promise that resolves when email is sent
 */
export async function sendMagicLinkEmail(
  to: string,
  url: string,
  token: string
): Promise<void> {
  // For local development
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'test') {
    console.log('\n📧 Magic Link Email (Local Dev Mode)')
    console.log('═══════════════════════════════════════')
    console.log(`To: ${to}`)
    console.log(`Subject: Your Sign-In Link for HYVVE`)
    console.log(`Magic Link URL: ${url}`)
    console.log(`Token: ${token}`)
    console.log(`Expires: 15 minutes`)
    console.log('═══════════════════════════════════════\n')
    return
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: 'Your Sign-In Link for HYVVE',
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #111827; font-size: 24px; margin: 0;">Sign in to HYVVE</h1>
          </div>

          <div style="background-color: #f9fafb; border-radius: 12px; padding: 32px; margin-bottom: 32px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              Hello,
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              Click the button below to sign in to your HYVVE account:
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${url}"
                 style="display: inline-block; background-color: #FF6B6B; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Sign In to HYVVE
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
              Or copy and paste this link into your browser:
            </p>
            <p style="color: #4f46e5; font-size: 14px; word-break: break-all; margin: 8px 0 0 0;">
              ${url}
            </p>
          </div>

          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin-bottom: 32px; border-radius: 4px;">
            <p style="color: #991b1b; font-size: 14px; line-height: 1.6; margin: 0; font-weight: 600;">
              ⏱️ This link expires in 15 minutes
            </p>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
            <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0;">
              If you didn't request this sign-in link, you can safely ignore this email.
              The link will expire automatically.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0 0;">
              This is an automated message from HYVVE. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Failed to send magic link email:', error)
      throw new Error(`Email sending failed: ${error.message}`)
    }

    console.log('Magic link email sent successfully:', data?.id)
  } catch (error) {
    console.error('Error sending magic link email:', error)
    throw error
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

/**
 * Send workspace invitation email
 *
 * @param to - Invitee email address
 * @param inviterName - Name of the person sending the invitation
 * @param workspaceName - Name of the workspace
 * @param token - Secure invitation token
 * @param role - Role being assigned to the invitee
 * @returns Promise that resolves when email is sent
 */
export async function sendWorkspaceInvitationEmail(
  to: string,
  inviterName: string,
  workspaceName: string,
  token: string,
  role: string
): Promise<void> {
  const inviteUrl = `${baseUrl}/invite/${token}`

  // For local development
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'test') {
    console.log('\n📧 Workspace Invitation Email (Local Dev Mode)')
    console.log('═══════════════════════════════════════════════')
    console.log(`To: ${to}`)
    console.log(`From: ${inviterName}`)
    console.log(`Workspace: ${workspaceName}`)
    console.log(`Role: ${role}`)
    console.log(`Subject: You've been invited to join ${workspaceName} on HYVVE`)
    console.log(`Invite URL: ${inviteUrl}`)
    console.log('═══════════════════════════════════════════════\n')
    return
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `You've been invited to join ${workspaceName} on HYVVE`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #111827; margin-bottom: 24px;">You've been invited!</h1>

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            <strong>${inviterName}</strong> has invited you to join <strong>${workspaceName}</strong> on HYVVE as a <strong>${role}</strong>.
          </p>

          <div style="margin: 32px 0;">
            <a href="${inviteUrl}"
               style="display: inline-block; background-color: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Accept Invitation
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            Or copy and paste this URL into your browser:
          </p>
          <p style="color: #4f46e5; font-size: 14px; word-break: break-all;">
            ${inviteUrl}
          </p>

          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px;">
              This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Failed to send workspace invitation email:', error)
      throw new Error(`Email sending failed: ${error.message}`)
    }

    console.log('Workspace invitation email sent successfully:', data?.id)
  } catch (error) {
    console.error('Error sending workspace invitation email:', error)
    throw error
  }
}

/**
 * Send workspace deletion confirmation email
 *
 * @param to - Workspace owner's email address
 * @param workspaceName - Name of the workspace being deleted
 * @param deletedAt - Timestamp when deletion was initiated
 * @returns Promise that resolves when email is sent
 */
export async function sendWorkspaceDeletionEmail(
  to: string,
  workspaceName: string,
  deletedAt: Date
): Promise<void> {
  const hardDeleteDate = new Date(deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
  const formattedDate = hardDeleteDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // For local development
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'test') {
    console.log('\n📧 Workspace Deletion Email (Local Dev Mode)')
    console.log('═══════════════════════════════════════════')
    console.log(`To: ${to}`)
    console.log(`Subject: Workspace "${workspaceName}" scheduled for deletion`)
    console.log(`Deleted At: ${deletedAt.toISOString()}`)
    console.log(`Permanent Deletion Date: ${formattedDate}`)
    console.log('═══════════════════════════════════════════\n')
    return
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `Workspace "${workspaceName}" scheduled for deletion`,
      html: `
        <h1>Workspace Deletion Scheduled</h1>
        <p>Your workspace <strong>"${workspaceName}"</strong> has been scheduled for deletion.</p>

        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h2 style="color: #dc2626; margin-top: 0;">Important</h2>
          <p style="margin-bottom: 0;">All workspace data will be permanently deleted on <strong>${formattedDate}</strong> (30 days from now).</p>
        </div>

        <h2>What happens during this period?</h2>
        <ul>
          <li>The workspace will be inaccessible to all members</li>
          <li>All data, settings, and configurations will be preserved</li>
          <li>You can contact support if you need to restore the workspace</li>
        </ul>

        <h2>What will be deleted?</h2>
        <ul>
          <li>All workspace settings and configurations</li>
          <li>Member access and permissions</li>
          <li>AI provider configurations</li>
          <li>Approval queue history</li>
          <li>All module data associated with this workspace</li>
        </ul>

        <p>If this was done in error, please contact our support team immediately at <a href="mailto:support@hyvve.app">support@hyvve.app</a></p>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This action was requested on ${deletedAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}.
        </p>
      `,
    })

    if (error) {
      console.error('Failed to send workspace deletion email:', error)
      throw new Error(`Email sending failed: ${error.message}`)
    }

    console.log('Workspace deletion email sent successfully:', data?.id)
  } catch (error) {
    console.error('Error sending workspace deletion email:', error)
    // Don't throw - email failure shouldn't block deletion
  }
}
