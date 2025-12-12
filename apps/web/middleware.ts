import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware for authentication and authorization
 *
 * Features:
 * - Redirects authenticated users away from auth pages (/sign-in, /sign-up)
 * - Intelligent post-auth redirect based on onboarding state
 * - Protected route enforcement
 *
 * Story: 15.15 - Update Sign-In Flow Redirect Logic
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if user has a session cookie
  // Note: auth.ts configures cookiePrefix: 'hyvve', so cookie name is 'hyvve.session_token'
  // Use .value to get the actual token string, not the cookie object
  const sessionToken = request.cookies.get('hyvve.session_token')?.value

  // Auth pages - redirect authenticated users to appropriate destination
  if (sessionToken && (pathname === '/sign-in' || pathname === '/sign-up')) {
    // Check for intended destination from query params (deep link support)
    const intendedDestination = request.nextUrl.searchParams.get('redirect')
    if (intendedDestination && isAllowedRedirect(intendedDestination)) {
      return NextResponse.redirect(new URL(intendedDestination, request.url))
    }

    // Default: redirect to businesses page (the redirect-destination API will be called client-side)
    return NextResponse.redirect(new URL('/businesses', request.url))
  }

  // Protected routes: require authentication
  // Use exact match or path boundary to avoid matching unintended routes like /settings-legacy
  const protectedPaths = ['/settings', '/dashboard', '/businesses', '/approvals', '/ai-team', '/onboarding']
  const isProtectedPath = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )

  if (!sessionToken && isProtectedPath) {
    // Store intended destination for post-auth redirect (preserve query string)
    const signInUrl = new URL('/sign-in', request.url)
    if (pathname !== '/sign-in') {
      // Preserve both pathname and query string for complete deep-link support
      const fullPath = request.nextUrl.search
        ? `${pathname}${request.nextUrl.search}`
        : pathname
      signInUrl.searchParams.set('redirect', fullPath)
    }
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

/**
 * Validate redirect URL to prevent open redirect vulnerabilities
 * Only checks the URL scheme/protocol, not content within query params
 */
function isAllowedRedirect(url: string): boolean {
  // Only allow relative paths starting with /
  if (!url.startsWith('/')) return false

  // Block protocol-relative URLs (//evil.com)
  if (url.startsWith('//')) return false

  // Extract pathname (before query string) to check for dangerous schemes
  const questionIndex = url.indexOf('?')
  const pathname = questionIndex > -1 ? url.slice(0, questionIndex) : url

  // Only block javascript:/data: if they appear as the URL scheme (at start of path)
  // This allows safe URLs like /search?q=javascript:alert(1) to pass through
  const lowerPath = pathname.toLowerCase()
  if (lowerPath.startsWith('/javascript:') || lowerPath.startsWith('/data:')) {
    return false
  }

  return true
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
}
