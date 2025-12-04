import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { verifyOTP } from '@/lib/otp'

// Rate limiting storage (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS = 5

interface VerifyEmailOtpRequest {
  email: string
  code: string
}

/**
 * POST /api/auth/verify-email-otp
 *
 * Verify email using OTP code instead of token link.
 * Rate limited to 5 attempts per 15 minutes per email.
 *
 * Story: 09.8 - Implement OTP Code Verification
 */
export async function POST(request: NextRequest) {
  try {
    const body: VerifyEmailOtpRequest = await request.json()
    const { email, code } = body

    // Validate input
    if (!email || !code) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'Email and code are required',
          },
        },
        { status: 400 }
      )
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim()

    // Check rate limiting
    const now = Date.now()
    const rateLimit = rateLimitMap.get(normalizedEmail)

    if (rateLimit) {
      if (now > rateLimit.resetAt) {
        rateLimitMap.delete(normalizedEmail)
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

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        emailVerified: true,
      },
    })

    if (!user) {
      // Increment rate limit even for non-existent users (prevent enumeration)
      const currentLimit = rateLimitMap.get(normalizedEmail) || {
        count: 0,
        resetAt: now + RATE_LIMIT_WINDOW,
      }
      currentLimit.count++
      rateLimitMap.set(normalizedEmail, currentLimit)

      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'No account found with this email address',
          },
        },
        { status: 404 }
      )
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        {
          error: {
            code: 'ALREADY_VERIFIED',
            message: 'Email is already verified',
          },
        },
        { status: 400 }
      )
    }

    // Find active verification token for this user
    // better-auth stores verification tokens in the 'verificationToken' table
    const verificationRecord = await prisma.verificationToken.findFirst({
      where: {
        identifier: normalizedEmail,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!verificationRecord) {
      // Increment rate limit
      const currentLimit = rateLimitMap.get(normalizedEmail) || {
        count: 0,
        resetAt: now + RATE_LIMIT_WINDOW,
      }
      currentLimit.count++
      rateLimitMap.set(normalizedEmail, currentLimit)

      return NextResponse.json(
        {
          error: {
            code: 'EXPIRED_TOKEN',
            message: 'Verification code expired. Please request a new one.',
          },
        },
        { status: 400 }
      )
    }

    // Verify OTP against the token
    const isValidOtp = verifyOTP(code, verificationRecord.token)

    if (!isValidOtp) {
      // Increment rate limit on failed verification
      const currentLimit = rateLimitMap.get(normalizedEmail) || {
        count: 0,
        resetAt: now + RATE_LIMIT_WINDOW,
      }
      currentLimit.count++
      rateLimitMap.set(normalizedEmail, currentLimit)

      const remainingAttempts = MAX_ATTEMPTS - currentLimit.count

      return NextResponse.json(
        {
          error: {
            code: 'INVALID_CODE',
            message: 'Invalid verification code',
          },
          remainingAttempts,
        },
        { status: 400 }
      )
    }

    // Valid OTP - mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
      },
    })

    // Delete the verification record (one-time use)
    await prisma.verificationToken.delete({
      where: { id: verificationRecord.id },
    })

    // Clear rate limit on success
    rateLimitMap.delete(normalizedEmail)

    // Log success (audit trail)
    console.log(`Email verified via OTP for user: ${user.id} (${user.email})`)

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    })
  } catch (error) {
    console.error('OTP verification error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to verify code',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * Clean up expired rate limits (call periodically)
 */
function cleanupRateLimits() {
  const now = Date.now()
  for (const [email, limit] of rateLimitMap.entries()) {
    if (now > limit.resetAt) {
      rateLimitMap.delete(email)
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000)
