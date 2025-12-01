'use client'

import { useSession, signOut as authSignOut } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

/**
 * User interface from better-auth session
 */
export interface User {
  id: string
  email: string
  name: string | null
  image?: string | null
  emailVerified: boolean
}

/**
 * Session interface from better-auth
 */
export interface SessionData {
  user: User
  session: {
    id: string
    expiresAt: Date
    ipAddress?: string | null
    userAgent?: string | null
  }
}

/**
 * Return type for useAuth hook
 */
export interface UseAuthReturn {
  user: User | null
  session: SessionData | null
  isLoading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
}

/**
 * Custom hook for accessing authentication state
 *
 * Wraps better-auth's useSession hook and provides:
 * - user: Current user data or null
 * - session: Full session data or null
 * - isLoading: Loading state during session fetch
 * - isAuthenticated: Boolean for easy auth checks
 * - signOut: Function to sign out and redirect
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isLoading, isAuthenticated, signOut } = useAuth()
 *
 *   if (isLoading) return <LoadingSpinner />
 *   if (!isAuthenticated) return <SignInPrompt />
 *
 *   return (
 *     <div>
 *       <p>Welcome, {user.name}!</p>
 *       <button onClick={signOut}>Sign Out</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  const signOut = async () => {
    await authSignOut()
    router.push('/sign-in')
  }

  return {
    user: session?.user ?? null,
    session: session ?? null,
    isLoading: isPending,
    isAuthenticated: !!session?.user,
    signOut,
  }
}
