import { auth } from '@/lib/auth'
import { checkRateLimit, generateRateLimitHeaders } from '@/lib/utils/rate-limit'
import { NextResponse } from 'next/server'

// Export GET and POST handlers for Next.js App Router
// better-auth provides a single handler function that we expose for both methods
export async function GET(request: Request) {
  const url = new URL(request.url)

  if (process.env.E2E_OAUTH_TEST === 'true' && url.pathname.endsWith('/auth/callback/google')) {
    return handleTestOAuthCallback(request, url)
  }

  return auth.handler(request)
}

export async function POST(request: Request) {
  const url = new URL(request.url)

  if (process.env.E2E_OAUTH_TEST === 'true' && url.pathname.endsWith('/auth/callback/google')) {
    return handleTestOAuthCallback(request, url)
  }

  // Apply rate limiting specifically to sign-in endpoint
  // Limit: 5 attempts per 15 minutes per IP address (Story 01-4 requirement)
  if (url.pathname.endsWith('/sign-in/email')) {
    // Get IP address from headers (supports proxies and load balancers)
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0].trim() || realIp || 'unknown'

    const rateLimitKey = `signin:${ip}`
    const limit = 5
    const windowSeconds = 15 * 60

    // Check rate limit for this IP using unified rate limiter (Redis in production)
    const rateLimitResult = await checkRateLimit(rateLimitKey, limit, windowSeconds)

    // If rate limited, return 429 error
    if (rateLimitResult.isRateLimited) {
      const response = NextResponse.json(
        {
          error: 'RATE_LIMITED',
          message: `Too many sign-in attempts. Please try again in ${Math.ceil((rateLimitResult.retryAfter || 0) / 60)} minutes.`,
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      )
      const headers = generateRateLimitHeaders({
        limit,
        remaining: 0,
        resetAt: rateLimitResult.resetAt,
      })
      Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
      if (rateLimitResult.retryAfter !== undefined) {
        response.headers.set('Retry-After', String(rateLimitResult.retryAfter))
      }
      return response
    }

    // Pass request to better-auth handler and attach rate limit headers for visibility
    const response = await auth.handler(request)
    const headers = generateRateLimitHeaders({
      limit,
      remaining: rateLimitResult.remaining,
      resetAt: rateLimitResult.resetAt,
    })
    Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
    return response
  }

  // Pass request to better-auth handler
  return auth.handler(request)
}

function handleTestOAuthCallback(request: Request, url: URL) {
  const state = url.searchParams.get('state')
  const code = url.searchParams.get('code')
  const cookiesHeader = request.headers.get('cookie') || ''
  const expectedState = cookiesHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('e2e_oauth_state='))
    ?.split('=')[1]

  if (!state || !code || !expectedState || state !== expectedState) {
    return NextResponse.json({ error: 'invalid_state' }, { status: 400 })
  }

  const response = NextResponse.redirect('/dashboard', 302)
  response.headers.append(
    'set-cookie',
    'hyvve.session_token=test-session; Path=/; HttpOnly; SameSite=Lax'
  )
  return response
}
