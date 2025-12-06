'use client'

import { Info, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SecurityNoticeBannerProps {
  /** Custom message to display */
  message?: string
  /** Whether to show the shield icon instead of info */
  variant?: 'info' | 'security'
  /** Custom className */
  className?: string
}

/**
 * Security Notice Banner Component
 *
 * A blue informational banner used to display security-related notices,
 * particularly on sensitive settings pages like API Keys.
 */
export function SecurityNoticeBanner({
  message = 'API keys are sensitive. Never share them publicly.',
  variant = 'info',
  className,
}: SecurityNoticeBannerProps) {
  const Icon = variant === 'security' ? Shield : Info

  return (
    <div
      className={cn(
        'bg-blue-50 border border-blue-200 rounded-lg p-4',
        'flex items-start gap-3',
        className
      )}
      role="status"
      aria-label="Security notice"
    >
      <Icon
        className="h-5 w-5 text-blue-600 shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <p className="text-sm text-blue-900">{message}</p>
    </div>
  )
}
