'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { UserMenu } from '@/components/auth/user-menu'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

/**
 * AppHeader Component
 *
 * Main application header with logo, navigation, and user menu.
 * Shows sign-in button when not authenticated, user menu when authenticated.
 *
 * @example
 * ```tsx
 * // In a layout
 * export default function DashboardLayout({ children }) {
 *   return (
 *     <>
 *       <AppHeader />
 *       <main>{children}</main>
 *     </>
 *   )
 * }
 * ```
 */
export function AppHeader() {
  const { user, isLoading, isAuthenticated } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-[#FF6B6B]">HYVVE</span>
        </Link>

        {/* Right Side - Auth Section */}
        <div className="flex items-center gap-4">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          ) : isAuthenticated && user ? (
            <UserMenu user={user} />
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild className="bg-[#FF6B6B] hover:bg-[#FF6B6B]/90">
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
