'use client'

import type { ConfidenceLevel } from '@hyvve/shared'
import { cn } from '@/lib/utils'

interface ConfidenceIndicatorProps {
  /** Confidence score from 0-100 */
  score: number
  /** Confidence level category */
  level: ConfidenceLevel
  /** Show score label (default: true) */
  showLabel?: boolean
  /** Size variant (default: md) */
  size?: 'sm' | 'md' | 'lg'
  /** Show recommendation text (default: false) */
  showRecommendation?: boolean
  /** Custom className */
  className?: string
}

/**
 * Visual confidence score indicator with color coding
 * - Green (>85%): High confidence - auto-approve
 * - Yellow (60-85%): Medium confidence - quick review
 * - Red (<60%): Low confidence - full review
 */
export function ConfidenceIndicator({
  score,
  level,
  showLabel = true,
  size = 'md',
  showRecommendation = false,
  className,
}: ConfidenceIndicatorProps) {
  // Color configuration based on confidence level
  const colorConfig = {
    high: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      progressBg: 'bg-green-500',
      border: 'border-green-500',
      recommendation: 'Auto-approved',
    },
    medium: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      progressBg: 'bg-yellow-500',
      border: 'border-yellow-500',
      recommendation: 'Quick review needed',
    },
    low: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      progressBg: 'bg-red-500',
      border: 'border-red-500',
      recommendation: 'Full review required',
    },
  }[level]

  // Size configuration
  const sizeConfig = {
    sm: {
      height: 'h-1.5',
      labelSize: 'text-xs',
      spacing: 'gap-1',
    },
    md: {
      height: 'h-2',
      labelSize: 'text-sm',
      spacing: 'gap-2',
    },
    lg: {
      height: 'h-3',
      labelSize: 'text-base',
      spacing: 'gap-3',
    },
  }[size]

  return (
    <div className={cn('flex flex-col', sizeConfig.spacing, className)}>
      {/* Progress bar with score */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className={cn('w-full rounded-full bg-gray-200', sizeConfig.height)}>
            <div
              className={cn(
                'rounded-full transition-all duration-300',
                colorConfig.progressBg,
                sizeConfig.height
              )}
              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
            />
          </div>
        </div>

        {showLabel && (
          <div
            className={cn(
              'flex items-center gap-1.5 font-semibold whitespace-nowrap',
              colorConfig.text,
              sizeConfig.labelSize
            )}
          >
            <span>{score}%</span>
            <span className="font-normal uppercase text-xs tracking-wide">
              {level}
            </span>
          </div>
        )}
      </div>

      {/* Recommendation text */}
      {showRecommendation && (
        <p className={cn('text-xs', colorConfig.text)}>
          {colorConfig.recommendation}
        </p>
      )}
    </div>
  )
}

/**
 * Compact confidence badge variant
 */
export function ConfidenceBadge({
  score,
  level,
}: {
  score: number
  level: ConfidenceLevel
}) {
  const colorConfig = {
    high: 'bg-green-100 text-green-700 border-green-500',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-500',
    low: 'bg-red-100 text-red-700 border-red-500',
  }[level]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-semibold',
        colorConfig
      )}
    >
      <span>{score}%</span>
      <span className="uppercase tracking-wide">{level}</span>
    </div>
  )
}
