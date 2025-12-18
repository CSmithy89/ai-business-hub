/**
 * Filter Chip Component
 *
 * Story: PM-03.7 - Advanced Filters
 *
 * Displays an active filter as a removable chip/badge.
 */

'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface FilterChipProps {
  /** Display label for the filter */
  label: string
  /** Callback when chip is removed */
  onRemove: () => void
  /** Optional icon component */
  icon?: React.ReactNode
  /** Optional className for styling */
  className?: string
}

/**
 * FilterChip Component
 *
 * Renders a badge showing an active filter with a remove button.
 */
export function FilterChip({ label, onRemove, icon, className }: FilterChipProps) {
  return (
    <Badge
      variant="secondary"
      className={cn('gap-1.5 pr-1 text-xs font-normal', className)}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{label}</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-4 w-4 p-0 hover:bg-transparent"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" />
      </Button>
    </Badge>
  )
}
