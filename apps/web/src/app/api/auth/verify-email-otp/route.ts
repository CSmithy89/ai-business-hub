import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { verifyOTP } from '@/lib/otp'
import {
  checkRateLimit,
  resetRateLimit,
  DEFAULT_RATE_LIMIT_MAX_ATTEMPTS,
  generateRateLimitHeaders,
} from '@/lib/utils/rate-limit'

interface VerifyEmailOtpRequest {
  email: string
  code: string
}

/**
 * POST /api/auth/verify-email-otp
 *
 * Verify email using OTP code instead of token link.
 * Rate limited to 5 attempts per 15 minutes per email.
 * Uses unified rate limiter (Redis in production, in-memory fallback).
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
    const rateLimitKey = `email-otp:${normalizedEmail}`

    // Check rate limiting using unified rate limiter
    const rateLimitResult = await checkRateLimit(rateLimitKey, DEFAULT_RATE_LIMIT_MAX_ATTEMPTS, 900)

    if (rateLimitResult.isRateLimited) {
      const remainingTime = Math.ceil((rateLimitResult.retryAfter || 0) / 60)
      const response = NextResponse.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: `Too many attempts. Try again in ${remainingTime} minutes.`,
          },
          remainingAttempts: 0,
        },
        { status: 429 }
      )
      const headers = generateRateLimitHeaders({
        limit: DEFAULT_RATE_LIMIT_MAX_ATTEMPTS,
        remaining: 0,
        resetAt: rateLimitResult.resetAt,
      })
      Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
      return response
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
      // Rate limit already incremented by checkRateLimit above
      const response = NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'No account found with this email address',
          },
        },
        { status: 404 }
      )
      const headers = generateRateLimitHeaders({
        limit: DEFAULT_RATE_LIMIT_MAX_ATTEMPTS,
        remaining: rateLimitResult.remaining,
        resetAt: rateLimitResult.resetAt,
      })
      Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
      return response
    }

    // Check if email is already verified
    if (user.emailVerified) {
      const response = NextResponse.json(
        {
          error: {
            code: 'ALREADY_VERIFIED',
            message: 'Email is already verified',
          },
        },
        { status: 400 }
      )
      const headers = generateRateLimitHeaders({
        limit: DEFAULT_RATE_LIMIT_MAX_ATTEMPTS,
        remaining: rateLimitResult.remaining,
        resetAt: rateLimitResult.resetAt,
      })
      Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
      return response
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
      // Rate limit already incremented by checkRateLimit above
      const response = NextResponse.json(
        {
          error: {
            code: 'EXPIRED_TOKEN',
            message: 'Verification code expired. Please request a new one.',
          },
        },
        { status: 400 }
      )
      const headers = generateRateLimitHeaders({
        limit: DEFAULT_RATE_LIMIT_MAX_ATTEMPTS,
        remaining: rateLimitResult.remaining,
        resetAt: rateLimitResult.resetAt,
      })
      Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
      return response
    }

    // Verify OTP against the token
    const isValidOtp = verifyOTP(code, verificationRecord.token)

    if (!isValidOtp) {
      // Rate limit already incremented by checkRateLimit above
      const response = NextResponse.json(
        {
          error: {
            code: 'INVALID_CODE',
            message: 'Invalid verification code',
          },
          remainingAttempts: rateLimitResult.remaining,
        },
        { status: 400 }
      )
      const headers = generateRateLimitHeaders({
        limit: DEFAULT_RATE_LIMIT_MAX_ATTEMPTS,
        remaining: rateLimitResult.remaining,
        resetAt: rateLimitResult.resetAt,
      })
      Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
      return response
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
    await resetRateLimit(rateLimitKey)

    // Log success (audit trail)
    console.log(`Email verified via OTP for user: ${user.id} (${user.email})`)

    const response = NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    })
    const headers = generateRateLimitHeaders({
      limit: DEFAULT_RATE_LIMIT_MAX_ATTEMPTS,
      remaining: rateLimitResult.remaining,
      resetAt: rateLimitResult.resetAt,
    })
    Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
    return response
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
