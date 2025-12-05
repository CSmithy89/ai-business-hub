import { auth } from '@/lib/auth'
import { checkRateLimit } from '@/lib/utils/rate-limit'
import { NextResponse } from 'next/server'

// Export GET and POST handlers for Next.js App Router
// better-auth provides a single handler function that we expose for both methods
export async function GET(request: Request) {
  return auth.handler(request)
}

export async function POST(request: Request) {
  const url = new URL(request.url)

  // Apply rate limiting specifically to sign-in endpoint
  // Limit: 5 attempts per 15 minutes per IP address (Story 01-4 requirement)
  if (url.pathname.endsWith('/sign-in/email')) {
    // Get IP address from headers (supports proxies and load balancers)
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0].trim() || realIp || 'unknown'

    // Check rate limit for this IP using unified rate limiter (Redis in production)
    const { isRateLimited, retryAfter } = await checkRateLimit(
      `signin:${ip}`,
      5,        // 5 attempts
      15 * 60   // 15 minutes in seconds
    )

    // If rate limited, return 429 error
    if (isRateLimited) {
      return NextResponse.json(
        {
          error: 'RATE_LIMITED',
          message: `Too many sign-in attempts. Please try again in ${Math.ceil(retryAfter! / 60)} minutes.`,
          retryAfter
        },
        { status: 429 }
      )
    }
  }

  // Pass request to better-auth handler
  return auth.handler(request)
}
