'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import type { Route } from 'next'

/**
 * Props for AuthGuard component
 */
export interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

/**
 * AuthGuard Component
 *
 * Wrapper component for protected routes that ensures users are authenticated
 * before accessing content.
 *
 * **Features:**
 * - Shows loading state while checking authentication
 * - Redirects unauthenticated users to sign-in page
 * - Renders children only when authenticated
 * - Customizable fallback and redirect URL
 *
 * **Usage:**
 * Use sparingly in pages (prefer middleware for route protection at scale).
 * Useful for component-level protection within public pages.
 *
 * @example
 * ```tsx
 * // In a protected page
 * export default function DashboardPage() {
 *   return (
 *     <AuthGuard>
 *       <DashboardContent />
 *     </AuthGuard>
 *   )
 * }
 *
 * // With custom fallback
 * <AuthGuard fallback={<CustomLoader />}>
 *   <ProtectedContent />
 * </AuthGuard>
 *
 * // With custom redirect
 * <AuthGuard redirectTo="/login">
 *   <AdminPanel />
 * </AuthGuard>
 * ```
 */
export function AuthGuard({
  children,
  fallback,
  redirectTo = '/sign-in',
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo as Route)
    }
  }, [isLoading, isAuthenticated, router, redirectTo])

  // Show loading state
  if (isLoading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF6B6B]" />
        </div>
      )
    )
  }

  // Will redirect if not authenticated
  if (!isAuthenticated) {
    return null
  }

  // Render protected content
  return <>{children}</>
}
