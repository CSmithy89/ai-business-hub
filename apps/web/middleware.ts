import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware for authentication and authorization
 *
 * Features:
 * - Redirects authenticated users away from auth pages (/sign-in, /sign-up)
 * - Can be extended for protected routes in future stories
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if user has a session cookie
  // Note: auth.ts configures cookiePrefix: 'hyvve', so cookie name is 'hyvve.session_token'
  const sessionToken = request.cookies.get('hyvve.session_token')

  // If authenticated and trying to access auth pages, redirect to dashboard
  if (sessionToken && (pathname === '/sign-in' || pathname === '/sign-up')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protected routes: require authentication
  if (!sessionToken && (pathname.startsWith('/settings') || pathname.startsWith('/dashboard'))) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  return NextResponse.next()
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
