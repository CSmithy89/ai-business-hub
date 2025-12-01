import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@hyvve/db'
import { checkRateLimit } from '@/lib/utils/rate-limit'
import { sendVerificationEmail } from '@/lib/email'
import { randomBytes } from 'crypto'

/**
 * Request body schema
 */
const resendSchema = z.object({
  email: z.string().email('Invalid email address'),
})

/**
 * POST /api/auth/resend-verification
 *
 * Resend verification email to user
 *
 * Rate limit: 3 attempts per hour per email
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const result = resendSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_EMAIL',
          message: 'Invalid email address',
        },
        { status: 400 }
      )
    }

    const { email } = result.data

    // Check rate limit (3 attempts per hour)
    const rateLimitKey = `resend-verification:${email.toLowerCase()}`
    const rateLimit = checkRateLimit(rateLimitKey, 3, 60 * 60) // 3 attempts, 1 hour window

    if (rateLimit.isRateLimited) {
      return NextResponse.json(
        {
          success: false,
          error: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
          retryAfter: rateLimit.retryAfter,
        },
        { status: 429 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        name: true,
      },
    })

    // Don't reveal if user exists or is already verified (security best practice)
    // Always return success to prevent user enumeration
    if (!user || user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'If an unverified account exists, a verification email has been sent.',
        expiresIn: 24 * 60 * 60, // 24 hours in seconds
      })
    }

    // Generate new verification token
    const token = randomBytes(32).toString('base64url')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Delete existing verification tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { identifier: user.email },
    })

    // Create new verification token
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        type: 'email_verification',
        expiresAt,
      },
    })

    // Send verification email
    await sendVerificationEmail(user.email, token, user.name || undefined)

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully.',
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
    })
  } catch (error) {
    console.error('Error resending verification email:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while processing your request.',
      },
      { status: 500 }
    )
  }
}
