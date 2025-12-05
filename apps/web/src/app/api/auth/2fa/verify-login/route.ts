import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { verifyTOTPCode, verifyBackupCode, decryptSecret } from '@/lib/two-factor'
import crypto from 'crypto'
import { createDeviceFingerprint } from '@/lib/trusted-device'

// Rate limiting storage (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS = 5

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

    // Check rate limiting
    const now = Date.now()
    const rateLimit = rateLimitMap.get(userId)

    if (rateLimit) {
      if (now > rateLimit.resetAt) {
        rateLimitMap.delete(userId)
      } else if (rateLimit.count >= MAX_ATTEMPTS) {
        const remainingTime = Math.ceil((rateLimit.resetAt - now) / 60000)
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
      // Verify backup code
      const backupCodes = await prisma.backupCode.findMany({
        where: {
          userId,
          used: false,
        },
      })

      for (const backupCode of backupCodes) {
        if (await verifyBackupCode(code.toUpperCase(), backupCode.code)) {
          // Attempt atomic mark-as-used; updateMany returns count to guard against races
          const updated = await prisma.backupCode.updateMany({
            where: { id: backupCode.id, used: false },
            data: {
              used: true,
              usedAt: new Date(),
            },
          })
          if (updated.count > 0) {
            isValid = true
          }
          break
        }
      }
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
      // Update rate limit
      const currentLimit = rateLimitMap.get(userId) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW }
      currentLimit.count++
      rateLimitMap.set(userId, currentLimit)

      const remainingAttempts = MAX_ATTEMPTS - currentLimit.count

      return NextResponse.json(
        {
          error: {
            code: 'INVALID_CODE',
            message: 'Invalid or expired code',
          },
          remainingAttempts,
        },
        { status: 400 }
      )
    }

    // Clear rate limit on success
    rateLimitMap.delete(userId)

    // Create response
    let response: NextResponse

    // Create trusted device token if requested
    if (trustDevice) {
      // Create device fingerprint for future validation
      // In production, store this in database with the trusted device token
      const deviceFingerprint = createDeviceFingerprint(request)
      void deviceFingerprint // Reserved for future use in database storage
      const trustedDeviceToken = crypto.randomBytes(32).toString('hex')

      response = NextResponse.json({ success: true })
      response.cookies.set('hyvve_trusted_device', trustedDeviceToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      })
    } else {
      response = NextResponse.json({ success: true })
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

/**
 * Clean up expired rate limits (call periodically)
 */
function cleanupRateLimits() {
  const now = Date.now()
  for (const [userId, limit] of rateLimitMap.entries()) {
    if (now > limit.resetAt) {
      rateLimitMap.delete(userId)
    }
  }
}

// Run cleanup once on module initialization (avoid setInterval in serverless/edge)
cleanupRateLimits()
