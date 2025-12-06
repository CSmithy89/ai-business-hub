'use client'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import { useConfidenceBreakdown } from '@/hooks/use-confidence-breakdown'
import { ConfidenceFactorBar } from './ConfidenceFactorBar'
import { AIReasoning, type ReasonItem } from './AIReasoning'
import { SuggestedActions } from './SuggestedActions'
import { AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface ConfidenceBreakdownProps {
  approvalId: string
  initialConfidence?: number
  className?: string
}

/**
 * ConfidenceBreakdown Component
 *
 * Main orchestration component that displays complete confidence breakdown:
 * - Overall confidence score
 * - Individual factor bars (4 factors)
 * - AI reasoning (for low confidence <60%)
 * - Suggested actions
 * - Collapsible for high confidence (>85%)
 */
export function ConfidenceBreakdown({
  approvalId,
  initialConfidence,
  className,
}: ConfidenceBreakdownProps) {
  const { data, isLoading, error } = useConfidenceBreakdown(approvalId)

  // Determine if should default to collapsed (high confidence)
  const shouldDefaultCollapse = (initialConfidence ?? data?.overallScore ?? 0) > 85

  if (isLoading) {
    return <ConfidenceBreakdownSkeleton />
  }

  if (error) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span>Failed to load confidence breakdown</span>
        </div>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  const { overallScore, factors, suggestedActions } = data

  // Determine overall confidence status
  const getConfidenceStatus = (score: number) => {
    if (score > 85) {
      return {
        label: 'High Confidence',
        icon: <TrendingUp className="h-5 w-5 text-green-500 dark:text-green-400" />,
        color: 'text-green-700 dark:text-green-100',
      }
    }
    if (score >= 60) {
      return {
        label: 'Medium Confidence',
        icon: <Minus className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />,
        color: 'text-yellow-700 dark:text-yellow-100',
      }
    }
    return {
      label: 'Low Confidence',
      icon: <TrendingDown className="h-5 w-5 text-red-500 dark:text-red-400" />,
      color: 'text-red-700 dark:text-red-100',
    }
  }

  const status = getConfidenceStatus(overallScore)

  // Generate reasoning items for low confidence
  const reasoningItems: ReasonItem[] =
    overallScore < 60
      ? factors
          .filter((f) => f.score < 70)
          .map((f) => ({
            text: `${f.factor}: ${f.explanation}`,
            severity: f.score < 50 ? 'high' : f.score < 60 ? 'medium' : ('low' as const),
            details: `This factor scored ${f.score}% and has a weight of ${Math.round(f.weight * 100)}% in the overall calculation.`,
          }))
      : []

  return (
    <Card className={cn('overflow-hidden', className)}>
      <Accordion
        type="single"
        collapsible
        defaultValue={shouldDefaultCollapse ? undefined : 'breakdown'}
      >
        <AccordionItem value="breakdown" className="border-none">
          <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800">
            <div className="flex items-center gap-3">
              {status.icon}
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Confidence Breakdown
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {status.label} - {overallScore}%
                </div>
              </div>
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-4 pb-4">
            <div className="space-y-6 pt-2">
              {/* Overall Score Display */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Overall Confidence
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Weighted average of all factors
                  </div>
                </div>
                <div className={cn('text-3xl font-bold', status.color)}>
                  {overallScore}%
                </div>
              </div>

              {/* Factor Bars */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Confidence Factors
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  {factors.map((factor, index) => (
                    <ConfidenceFactorBar key={index} factor={factor} />
                  ))}
                </div>
              </div>

              {/* AI Reasoning (for low confidence) */}
              {overallScore < 60 && reasoningItems.length > 0 && (
                <AIReasoning reasons={reasoningItems} />
              )}

              {/* Suggested Actions */}
              {suggestedActions.length > 0 && (
                <SuggestedActions
                  actions={suggestedActions}
                  onActionClick={(action) => {
                    console.log('Action clicked:', action)
                    // TODO: Implement action handlers
                  }}
                  onDismiss={(actionId) => {
                    console.log('Action dismissed:', actionId)
                    // TODO: Implement dismiss handler
                  }}
                />
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  )
}

/**
 * Loading skeleton for ConfidenceBreakdown
 */
function ConfidenceBreakdownSkeleton() {
  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </Card>
  )
}
