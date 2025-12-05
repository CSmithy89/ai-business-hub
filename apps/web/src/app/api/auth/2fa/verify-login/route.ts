/**
 * Two-Factor Authentication Verification API
 * Story 09-4: Verify TOTP/backup code during login and optionally trust device
 *
 * POST /api/auth/2fa/verify-login
 *
 * SECURITY:
 * - Rate limiting: 5 attempts per 15 minutes (Redis in production)
 * - Backup codes are hashed with bcrypt
 * - Trusted device tokens are hashed with SHA-256
 * - Device fingerprint verified on trusted device use
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { verifyTOTPCode, verifyBackupCode, decryptSecret } from '@/lib/two-factor'
import { checkTwoFactorRateLimit, resetRateLimit } from '@/lib/utils/rate-limit'
import {
  createTrustedDevice,
  setTrustedDeviceCookie,
} from '@/lib/trusted-device'

interface VerifyLoginRequest {
  userId: string
  code: string
  isBackupCode?: boolean
  trustDevice?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyLoginRequest = await request.json()
    const { userId, code, isBackupCode = false, trustDevice = false } = body

    // Validate input
    if (!userId || !code) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'User ID and code are required' } },
        { status: 400 }
      )
    }

    // Check rate limiting using unified rate limiter (Redis in production, in-memory fallback)
    const rateLimitResult = await checkTwoFactorRateLimit(userId)
    if (rateLimitResult.isRateLimited) {
      const remainingTime = Math.ceil((rateLimitResult.retryAfter || 0) / 60)
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: `Too many attempts. Try again in ${remainingTime} minutes.`,
          },
          remainingAttempts: 0,
        },
        { status: 429 }
      )
    }

    // Get user with 2FA data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    })

    if (!user || !user.twoFactorEnabled) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '2FA not enabled for this user' } },
        { status: 404 }
      )
    }

    let isValid = false

    if (isBackupCode) {
      // Verify backup code using serializable transaction to prevent race conditions
      // This ensures atomicity between verification and mark-as-used
      isValid = await prisma.$transaction(
        async (tx) => {
          // Fetch backup codes within the transaction
          const backupCodes = await tx.backupCode.findMany({
            where: {
              userId,
              used: false,
            },
          })

          for (const backupCode of backupCodes) {
            if (await verifyBackupCode(code.toUpperCase(), backupCode.code)) {
              // Atomic mark-as-used with optimistic lock check
              // Even within transaction, check used: false to handle edge cases
              const updated = await tx.backupCode.updateMany({
                where: { id: backupCode.id, used: false },
                data: {
                  used: true,
                  usedAt: new Date(),
                },
              })
              // Only valid if we successfully marked it as used
              return updated.count > 0
            }
          }
          return false
        },
        {
          // Use serializable isolation to prevent concurrent reads of same unused codes
          isolationLevel: 'Serializable',
          timeout: 10000, // 10 second timeout for bcrypt operations
        }
      )
    } else {
      // Verify TOTP code
      if (!user.twoFactorSecret) {
        return NextResponse.json(
          { error: { code: 'INVALID_SETUP', message: '2FA secret not found' } },
          { status: 400 }
        )
      }

      const masterKey = process.env.BETTER_AUTH_SECRET
      if (!masterKey) {
        return NextResponse.json(
          { error: { code: 'SERVER_ERROR', message: 'Encryption key not configured' } },
          { status: 500 }
        )
      }
      const decryptedSecret = await decryptSecret(user.twoFactorSecret, masterKey)
      isValid = verifyTOTPCode(decryptedSecret, code)
    }

    if (!isValid) {
      // Rate limit was already incremented by checkTwoFactorRateLimit above
      // Just return error with remaining attempts from the rate limit result
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_CODE',
            message: 'Invalid or expired code',
          },
          remainingAttempts: rateLimitResult.remaining,
        },
        { status: 400 }
      )
    }

    // Clear rate limit on success
    await resetRateLimit(`2fa:${userId}`)

    // Create response
    const response = NextResponse.json({ success: true })

    // Create trusted device if requested
    if (trustDevice) {
      const trustedDeviceResult = await createTrustedDevice(request, userId)

      if (trustedDeviceResult.success && trustedDeviceResult.token) {
        setTrustedDeviceCookie(response, trustedDeviceResult.token)
      }
      // If trusted device creation fails, we still return success for 2FA
      // Just without the trusted device cookie
    }

    return response
  } catch (error) {
    console.error('2FA verification error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to verify code' } },
      { status: 500 }
    )
  }
}
