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
  const sessionToken = request.cookies.get('hyvve.session_token')

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
  const protectedPaths = ['/settings', '/dashboard', '/businesses', '/approvals', '/ai-team', '/onboarding']
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path))

  if (!sessionToken && isProtectedPath) {
    // Store intended destination for post-auth redirect
    const signInUrl = new URL('/sign-in', request.url)
    if (pathname !== '/sign-in') {
      signInUrl.searchParams.set('redirect', pathname)
    }
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

/**
 * Validate redirect URL to prevent open redirect vulnerabilities
 */
function isAllowedRedirect(url: string): boolean {
  // Only allow relative paths starting with /
  if (!url.startsWith('/')) return false

  // Block protocol-relative URLs
  if (url.startsWith('//')) return false

  // Block javascript: and data: URLs
  if (url.toLowerCase().includes('javascript:')) return false
  if (url.toLowerCase().includes('data:')) return false

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
