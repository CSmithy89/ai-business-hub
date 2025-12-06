'use client'

import { cn } from '@/lib/utils'
import type { ConfidenceFactor } from '@hyvve/shared'

interface ConfidenceFactorBarProps {
  factor: ConfidenceFactor
  className?: string
}

/**
 * ConfidenceFactorBar Component
 *
 * Displays a single confidence factor with:
 * - Color-coded progress bar (green >80%, yellow 60-80%, red <60%)
 * - Factor name, score percentage, and weight
 * - Explanation text
 */
export function ConfidenceFactorBar({ factor, className }: ConfidenceFactorBarProps) {
  // Determine color based on score
  const getColorClasses = (score: number) => {
    if (score > 80) {
      return {
        bg: 'bg-green-500 dark:bg-green-600',
        text: 'text-green-700 dark:text-green-100',
        border: 'border-green-200 dark:border-green-800',
      }
    }
    if (score >= 60) {
      return {
        bg: 'bg-yellow-500 dark:bg-yellow-600',
        text: 'text-yellow-700 dark:text-yellow-100',
        border: 'border-yellow-200 dark:border-yellow-800',
      }
    }
    return {
      bg: 'bg-red-500 dark:bg-red-600',
      text: 'text-red-700 dark:text-red-100',
      border: 'border-red-200 dark:border-red-800',
    }
  }

  const colors = getColorClasses(factor.score)

  return (
    <div className={cn('space-y-2', className)}>
      {/* Factor name and score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {factor.factor}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            (weight: {Math.round(factor.weight * 100)}%)
          </span>
        </div>
        <span className={cn('text-sm font-semibold', colors.text)}>
          {factor.score}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              colors.bg
            )}
            style={{ width: `${factor.score}%` }}
          />
        </div>
      </div>

      {/* Explanation */}
      <p className="text-xs text-gray-600 dark:text-gray-400">
        {factor.explanation}
      </p>
    </div>
  )
}
