/**
 * Two-Factor Authentication Setup API
 * Story 09-3: Generate TOTP secret and QR code
 *
 * SECURITY: Secret is stored server-side only. Client receives QR code and manual entry code.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateTOTPSecret, generateQRCode, formatManualEntryCode, createTOTPUri } from '@/lib/two-factor'
import { createSetupSession } from '@/lib/two-factor-session'
import { createAuditLog, getClientIp, getUserAgent } from '@/lib/audit-log'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Parse request body to check for password verification
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Current password is required to enable 2FA' } },
        { status: 400 }
      )
    }

    // Verify password before allowing 2FA setup
    // Using better-auth's password verification
    try {
      // Get user from database with password
      const { prisma } = await import('@hyvve/db')
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { accounts: true },
      })

      if (!user) {
        return NextResponse.json(
          { error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
          { status: 404 }
        )
      }

      // Check if user has a password (not OAuth-only)
      const passwordAccount = user.accounts.find(acc => acc.provider === 'credential')
      if (!passwordAccount || !passwordAccount.accessToken) {
        return NextResponse.json(
          { error: { code: 'NO_PASSWORD', message: 'Password verification not available for OAuth-only accounts' } },
          { status: 400 }
        )
      }

      // Verify the password using better-auth
      // Note: better-auth stores the password hash in accessToken for credential provider
      const bcrypt = await import('bcrypt')
      const isValidPassword = await bcrypt.compare(password, passwordAccount.accessToken || '')

      if (!isValidPassword) {
        await createAuditLog({
          userId: session.user.id,
          eventType: '2fa.setup.failed',
          ipAddress: getClientIp(request.headers),
          userAgent: getUserAgent(request.headers),
          metadata: { reason: 'invalid_password' },
        })

        return NextResponse.json(
          { error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect' } },
          { status: 401 }
        )
      }
    } catch (error) {
      console.error('Password verification error:', error)
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to verify password' } },
        { status: 500 }
      )
    }

    // Generate TOTP secret
    const secret = generateTOTPSecret()

    // Create TOTP URI for QR code
    const totpUri = createTOTPUri(secret, session.user.email)

    // Generate QR code (as data URI)
    const qrCode = await generateQRCode(totpUri)

    // Format manual entry code (with spaces)
    const manualEntryCode = formatManualEntryCode(secret)

    // Store secret in secure server-side session
    const setupSessionId = createSetupSession(session.user.id, secret)

    // Store session ID in HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set('2fa-setup-session', setupSessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/api/auth/2fa',
    })

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      eventType: '2fa.setup.started',
      ipAddress: getClientIp(request.headers),
      userAgent: getUserAgent(request.headers),
    })

    // Return QR code and manual entry code ONLY (secret stays server-side)
    return NextResponse.json({
      qrCode,
      manualEntryCode,
    })
  } catch (error) {
    console.error('2FA setup error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to generate 2FA secret' } },
      { status: 500 }
    )
  }
}
