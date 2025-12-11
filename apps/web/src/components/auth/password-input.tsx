'use client'

import { useState, forwardRef } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: boolean
  /** Story 15-24: Accessibility - default to current-password for sign-in */
  autoComplete?: 'current-password' | 'new-password'
}

/**
 * Reusable password input component with show/hide toggle
 *
 * Story 15-24: Form Accessibility Improvements
 *
 * Features:
 * - Eye/EyeOff icon toggle for password visibility
 * - Accessible aria-label for screen readers
 * - autocomplete support for password managers
 * - Focus-visible for keyboard users
 * - Can be used in sign-up, sign-in, and password reset
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, error, autoComplete = 'current-password', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    return (
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          className={cn('pr-10', className)}
          ref={ref}
          aria-invalid={error ? 'true' : 'false'}
          autoComplete={autoComplete}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2',
            'text-gray-500 hover:text-gray-700',
            'transition-colors duration-150',
            // Focus-visible for accessibility
            'focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-[rgb(var(--color-primary-500))] focus-visible:ring-offset-2',
            'rounded'
          )}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'
