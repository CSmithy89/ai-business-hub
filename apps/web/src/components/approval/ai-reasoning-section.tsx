'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, AlertCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfidenceFactorsList } from './confidence-factors-list'
import type { ConfidenceFactor } from '@hyvve/shared'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface AIReasoningSectionProps {
  /** Overall confidence score (0-100) */
  confidenceScore: number
  /** Array of confidence factors */
  factors?: ConfidenceFactor[]
  /** AI-generated reasoning text */
  aiReasoning?: string
  /** Source module for context link */
  sourceModule?: string
  /** Source entity ID for context link */
  sourceId?: string
  /** Custom className */
  className?: string
}

/**
 * Get module display name and route
 */
function getModuleInfo(module: string): { name: string; route: string } {
  const moduleMap: Record<string, { name: string; route: string }> = {
    crm: { name: 'CRM Contact', route: '/crm/contacts' },
    email: { name: 'Email', route: '/email' },
    social: { name: 'Social Post', route: '/social' },
    invoice: { name: 'Invoice', route: '/invoices' },
  }

  return moduleMap[module] || { name: module, route: `/${module}` }
}

/**
 * AIReasoningSection Component
 *
 * Displays AI reasoning and confidence factors in a collapsible section.
 * - Auto-expands for low confidence (<60%)
 * - Shows confidence factors breakdown
 * - Displays AI reasoning text
 * - Links to related entities
 */
export function AIReasoningSection({
  confidenceScore,
  factors = [],
  aiReasoning,
  sourceModule,
  sourceId,
  className,
}: AIReasoningSectionProps) {
  // Auto-expand for low confidence (<60%)
  const [isExpanded, setIsExpanded] = useState(confidenceScore < 60)

  // Don't render if no factors and no reasoning
  if (factors.length === 0 && !aiReasoning) {
    return null
  }

  // Get related entity info
  const relatedEntity = sourceModule && sourceId
    ? {
        ...getModuleInfo(sourceModule),
        url: `${getModuleInfo(sourceModule).route}/${sourceId}`,
      }
    : null

  return (
    <div className={cn('space-y-3', className)}>
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left group"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Collapse AI reasoning' : 'Expand AI reasoning'}
      >
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-gray-500" />
          AI Reasoning & Confidence Breakdown
        </h3>
        <div className="flex items-center gap-2">
          {confidenceScore < 60 && !isExpanded && (
            <span className="text-xs text-red-600 font-medium">
              Requires Review
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          )}
        </div>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="space-y-6 pt-2">
          {/* AI Reasoning Text */}
          {aiReasoning && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                AI Analysis
              </h4>
              <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">
                {aiReasoning}
              </p>
            </div>
          )}

          {/* Confidence Factors List */}
          {factors.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Confidence Factors Breakdown
              </h4>
              <ConfidenceFactorsList factors={factors} />
            </div>
          )}

          {/* Related Entity Link */}
          {relatedEntity && (
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Related Context
              </h4>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-full sm:w-auto"
              >
                <Link href={relatedEntity.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View related {relatedEntity.name}
                </Link>
              </Button>
            </div>
          )}

          {/* Low Confidence Warning */}
          {confidenceScore < 60 && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-red-900 mb-1">
                    Low Confidence - Full Review Required
                  </h4>
                  <p className="text-sm text-red-800">
                    This item requires careful review due to low confidence.
                    Please review all factors and AI reasoning before making a decision.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
