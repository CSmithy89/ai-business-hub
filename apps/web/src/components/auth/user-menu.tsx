'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserAvatar } from './user-avatar'
import { useAuth } from '@/hooks/use-auth'
import { ChevronDown, Settings, Shield, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Props for UserMenu component
 */
export interface UserMenuProps {
  user: {
    name?: string | null
    email: string
    image?: string | null
  }
}

/**
 * UserMenu Component
 *
 * Dropdown menu in header showing user info, navigation links, and sign-out action.
 *
 * **Features:**
 * - User info section with avatar, name, and email
 * - Navigation to Settings and Security & Sessions
 * - Sign out action with confirmation
 * - Responsive and keyboard accessible
 *
 * **Menu Structure:**
 * ```
 * ┌─────────────────────────────┐
 * │ [Avatar] John Smith         │
 * │          john@example.com   │
 * ├─────────────────────────────┤
 * │ ⚙️  Settings                │
 * │ 🔐 Security & Sessions      │
 * ├─────────────────────────────┤
 * │ 🚪 Sign Out                 │
 * └─────────────────────────────┘
 * ```
 *
 * @example
 * ```tsx
 * // In a header component
 * function Header() {
 *   const { data: session } = useSession()
 *
 *   return (
 *     <header>
 *       {session?.user && (
 *         <UserMenu user={session.user} />
 *       )}
 *     </header>
 *   )
 * }
 * ```
 */
export function UserMenu({ user }: UserMenuProps) {
  const { signOut } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut()
      // signOut from useAuth handles redirect to /sign-in
    } catch (error) {
      console.error('Sign out error:', error)
      setIsSigningOut(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-stone-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:ring-offset-2">
        <UserAvatar user={user} size="sm" />
        <div className="hidden md:flex flex-col items-start">
          <span className="text-sm font-medium text-gray-900">
            {user.name || 'User'}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-600" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        {/* User Info Section */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3">
            <UserAvatar user={user} size="sm" />
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.name || 'User'}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Navigation Links */}
        <DropdownMenuItem asChild>
          <Link
            href="/settings"
            className="flex items-center gap-2 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href="/settings/sessions"
            className="flex items-center gap-2 cursor-pointer"
          >
            <Shield className="w-4 h-4" />
            <span>Security & Sessions</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Sign Out */}
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isSigningOut}
          className={cn(
            'flex items-center gap-2 cursor-pointer',
            'text-red-600 focus:text-red-700 focus:bg-red-50'
          )}
        >
          <LogOut className="w-4 h-4" />
          <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
