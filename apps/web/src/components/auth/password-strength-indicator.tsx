'use client'

import { useMemo } from 'react'
import { calculatePasswordStrength, getPasswordStrengthTextColor } from '@/lib/utils/password-strength'
import { cn } from '@/lib/utils'

interface PasswordStrengthIndicatorProps {
  password: string
  className?: string
}

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => calculatePasswordStrength(password), [password])

  // Don't show indicator if password is empty
  if (!password) {
    return null
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all duration-300', strength.color)}
            style={{ width: `${strength.percentage}%` }}
          />
        </div>
        <span className={cn('text-sm font-medium', getPasswordStrengthTextColor(strength.strength))}>
          {strength.label}
        </span>
      </div>

      {/* Criteria checklist */}
      <ul className="space-y-1 text-xs text-gray-600">
        <li className={cn('flex items-center gap-1', strength.criteria.minLength && 'text-green-600')}>
          <span className="inline-block w-4">{strength.criteria.minLength ? '✓' : '○'}</span>
          At least 8 characters
        </li>
        <li className={cn('flex items-center gap-1', strength.criteria.hasUppercase && 'text-green-600')}>
          <span className="inline-block w-4">{strength.criteria.hasUppercase ? '✓' : '○'}</span>
          Contains uppercase letter
        </li>
        <li className={cn('flex items-center gap-1', strength.criteria.hasLowercase && 'text-green-600')}>
          <span className="inline-block w-4">{strength.criteria.hasLowercase ? '✓' : '○'}</span>
          Contains lowercase letter
        </li>
        <li className={cn('flex items-center gap-1', strength.criteria.hasNumber && 'text-green-600')}>
          <span className="inline-block w-4">{strength.criteria.hasNumber ? '✓' : '○'}</span>
          Contains number
        </li>
        <li className={cn('flex items-center gap-1', strength.criteria.hasSpecialChar && 'text-green-600')}>
          <span className="inline-block w-4">{strength.criteria.hasSpecialChar ? '✓' : '○'}</span>
          Contains special character (!@#$%^&* etc.)
        </li>
      </ul>
    </div>
  )
}
