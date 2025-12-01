'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

/**
 * Props for UserAvatar component
 */
export interface UserAvatarProps {
  user: {
    name?: string | null
    email: string
    image?: string | null
  }
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Size mapping for avatar dimensions
 */
const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-base',
}

/**
 * Generate initials from name or email
 *
 * - If name provided: Use first letter of first two words (e.g., "John Smith" → "JS")
 * - If name is single word: Use first 2 characters (e.g., "John" → "JO")
 * - If no name: Use first 2 characters of email (e.g., "john@example.com" → "JO")
 *
 * @param name - User's name (optional)
 * @param email - User's email address
 * @returns Two-character initials in uppercase
 */
function getInitials(name: string | null | undefined, email: string): string {
  if (name) {
    const parts = name.split(' ').filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  // Fallback to email
  return email.slice(0, 2).toUpperCase()
}

/**
 * UserAvatar Component
 *
 * Displays user profile picture or initials fallback.
 *
 * **Features:**
 * - Shows user's profile image if available
 * - Falls back to initials from name or email
 * - Configurable sizes: sm (32px), md (48px), lg (64px)
 * - Circular shape with consistent styling
 *
 * @example
 * ```tsx
 * // With image
 * <UserAvatar user={{ name: "John Smith", email: "john@example.com", image: "/avatar.jpg" }} size="md" />
 *
 * // Without image (shows initials)
 * <UserAvatar user={{ name: "John Smith", email: "john@example.com" }} size="sm" />
 *
 * // No name (uses email initials)
 * <UserAvatar user={{ email: "john@example.com" }} />
 * ```
 */
export function UserAvatar({ user, size = 'md', className }: UserAvatarProps) {
  const initials = getInitials(user.name, user.email)

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {user.image && (
        <AvatarImage src={user.image} alt={user.name || user.email} />
      )}
      <AvatarFallback className="bg-stone-200 text-slate-800 font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
