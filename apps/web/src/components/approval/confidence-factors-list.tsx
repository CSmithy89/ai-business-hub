'use client'

import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import type { ConfidenceFactor } from '@hyvve/shared'
import { cn } from '@/lib/utils'

interface ConfidenceFactorsListProps {
  /** Array of confidence factors to display */
  factors: ConfidenceFactor[]
  /** Custom className */
  className?: string
}

/**
 * Format factor name from snake_case to Title Case
 * @example formatFactorName('historical_accuracy') => 'Historical Accuracy'
 */
function formatFactorName(name: string): string {
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Get color class based on score
 */
function getScoreColor(score: number): string {
  if (score >= 85) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * Get progress bar color based on score
 */
function getProgressColor(score: number): string {
  if (score >= 85) return 'bg-green-500'
  if (score >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

/**
 * ConfidenceFactorsList Component
 *
 * Displays a breakdown of confidence factors with scores, weights, and explanations.
 * Concerning factors are highlighted with red border.
 * Factors are sorted by score (lowest first) to prioritize concerns.
 */
export function ConfidenceFactorsList({ factors, className }: ConfidenceFactorsListProps) {
  // Sort factors by score (lowest first to show concerns)
  const sortedFactors = [...factors].sort((a, b) => a.score - b.score)

  if (sortedFactors.length === 0) {
    return (
      <div className={cn('text-sm text-gray-500 italic', className)}>
        No confidence factors available
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {sortedFactors.map((factor, index) => {
        const scoreColor = getScoreColor(factor.score)
        const progressColor = getProgressColor(factor.score)
        const weightPercentage = Math.round(factor.weight * 100)

        return (
          <div
            key={`${factor.factor}-${index}`}
            className={cn(
              'rounded-lg border bg-white p-4 transition-shadow hover:shadow-sm',
              factor.concerning && 'border-l-4 border-l-red-500 bg-red-50'
            )}
          >
            {/* Factor Header */}
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">
                  {formatFactorName(factor.factor)}
                </h4>
                {factor.concerning && (
                  <Badge variant="destructive" className="mt-1 text-xs">
                    Concerning
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <div className={cn('text-2xl font-bold', scoreColor)}>
                  {factor.score}
                </div>
                <div className="text-xs text-gray-500">
                  {weightPercentage}% weight
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <Progress
                value={factor.score}
                className="h-2"
                indicatorClassName={progressColor}
              />
            </div>

            {/* Explanation */}
            <p className="text-sm text-gray-700 leading-relaxed">
              {factor.explanation}
            </p>

            {/* Contribution Calculation */}
            <div className="mt-2 text-xs text-gray-500">
              Contribution to overall score: {Math.round(factor.score * factor.weight)}
            </div>
          </div>
        )
      })}

      {/* Summary Footer */}
      <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
        <div className="flex justify-between items-center">
          <span>Total Factors:</span>
          <span className="font-semibold">{sortedFactors.length}</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span>Concerning Factors:</span>
          <span className={cn(
            'font-semibold',
            sortedFactors.filter(f => f.concerning).length > 0 && 'text-red-600'
          )}>
            {sortedFactors.filter(f => f.concerning).length}
          </span>
        </div>
      </div>
    </div>
  )
}
