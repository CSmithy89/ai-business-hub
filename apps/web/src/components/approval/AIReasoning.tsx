'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react'

export interface ReasonItem {
  text: string
  severity: 'high' | 'medium' | 'low'
  details?: string
}

interface AIReasoningProps {
  reasons: ReasonItem[]
  className?: string
}

/**
 * AIReasoning Component
 *
 * Displays detailed reasoning for low-confidence items (<60%).
 * Shows bullet points with severity indicators and expandable details.
 */
export function AIReasoning({ reasons, className }: AIReasoningProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  if (!reasons || reasons.length === 0) {
    return null
  }

  const getSeverityIcon = (severity: ReasonItem['severity']) => {
    switch (severity) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
      case 'low':
        return <Info className="h-4 w-4 text-blue-500 dark:text-blue-400" />
    }
  }

  const getSeverityBadge = (severity: ReasonItem['severity']) => {
    const variants = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    }
    return (
      <Badge variant="outline" className={cn('text-xs', variants[severity])}>
        {severity}
      </Badge>
    )
  }

  return (
    <Card className={cn('p-4', className)}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            AI Reasoning
          </h3>
        </div>

        <div className="space-y-3">
          {reasons.map((reason, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-start gap-3">
                {getSeverityIcon(reason.severity)}
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {reason.text}
                    </p>
                    {getSeverityBadge(reason.severity)}
                  </div>

                  {reason.details && (
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpandedIndex(expandedIndex === index ? null : index)
                        }
                        className="h-auto p-0 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {expandedIndex === index ? (
                          <>
                            <ChevronUp className="mr-1 h-3 w-3" />
                            Hide details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="mr-1 h-3 w-3" />
                            Show details
                          </>
                        )}
                      </Button>

                      {expandedIndex === index && (
                        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          {reason.details}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {index < reasons.length - 1 && (
                <div className="border-b border-gray-200 dark:border-gray-700" />
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
