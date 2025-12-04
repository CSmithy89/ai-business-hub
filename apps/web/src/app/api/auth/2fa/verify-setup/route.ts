/**
 * Two-Factor Authentication Verification API
 * Story 09-3: Verify 6-digit code and enable 2FA
 *
 * SECURITY:
 * - Rate limiting: Max 5 attempts per 15 minutes
 * - Secret retrieved from server-side session
 * - Audit logging for all attempts
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { verifyTOTPCode, generateBackupCodes, hashBackupCode, encryptSecret } from '@/lib/two-factor'
import { getSetupSession, deleteSetupSession, recordVerificationAttempt } from '@/lib/two-factor-session'
import { createAuditLog, getClientIp, getUserAgent } from '@/lib/audit-log'
import { prisma } from '@hyvve/db'
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

    // Get setup session ID from cookie
    const cookieStore = await cookies()
    const setupSessionId = cookieStore.get('2fa-setup-session')?.value

    if (!setupSessionId) {
      return NextResponse.json(
        { error: { code: 'INVALID_SESSION', message: 'Setup session expired or not found' } },
        { status: 400 }
      )
    }

    // Get setup session (contains the secret)
    const setupSession = getSetupSession(setupSessionId)

    if (!setupSession) {
      return NextResponse.json(
        { error: { code: 'INVALID_SESSION', message: 'Setup session expired or not found' } },
        { status: 400 }
      )
    }

    // Verify user owns this session
    if (setupSession.userId !== session.user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Invalid session' } },
        { status: 403 }
      )
    }

    // Check rate limiting
    const rateLimitResult = recordVerificationAttempt(setupSessionId)
    if (!rateLimitResult.allowed) {
      await createAuditLog({
        userId: session.user.id,
        eventType: '2fa.verification.failed',
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
        metadata: { reason: 'rate_limit_exceeded' },
      })

      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many verification attempts. Please try again in 15 minutes.',
          },
        },
        { status: 429 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Verification code is required' } },
        { status: 400 }
      )
    }

    // Verify the TOTP code using server-side secret
    const isValid = verifyTOTPCode(setupSession.secret, code)

    if (!isValid) {
      await createAuditLog({
        userId: session.user.id,
        eventType: '2fa.verification.failed',
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
        metadata: { remainingAttempts: rateLimitResult.remainingAttempts },
      })

      return NextResponse.json(
        {
          error: {
            code: 'INVALID_CODE',
            message: 'Invalid verification code',
          },
          remainingAttempts: rateLimitResult.remainingAttempts,
        },
        { status: 400 }
      )
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes(10)

    // Hash backup codes for storage using bcrypt
    const hashedCodes = await Promise.all(
      backupCodes.map(async (code) => ({
        code: await hashBackupCode(code),
        userId: session.user.id,
      }))
    )

    // Encrypt the TOTP secret
    const masterKey = process.env.BETTER_AUTH_SECRET!
    const encryptedSecret = await encryptSecret(setupSession.secret, masterKey)

    // Update user and store backup codes in database
    await prisma.$transaction([
      // Update user with encrypted secret and enable 2FA
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: encryptedSecret,
        },
      }),
      // Store hashed backup codes
      prisma.backupCode.createMany({
        data: hashedCodes,
      }),
    ])

    // Clean up setup session
    deleteSetupSession(setupSessionId)
    cookieStore.delete('2fa-setup-session')

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      eventType: '2fa.enabled',
      ipAddress: getClientIp(request.headers),
      userAgent: getUserAgent(request.headers),
    })

    // Return plaintext backup codes to user (ONLY time they see them)
    return NextResponse.json({
      success: true,
      backupCodes,
    })
  } catch (error) {
    console.error('2FA verification error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to verify 2FA setup' } },
      { status: 500 }
    )
  }
}
