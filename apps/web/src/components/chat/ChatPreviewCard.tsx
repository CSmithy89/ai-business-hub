'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, Mail, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ChatPreviewCardProps {
  /** Type of content being previewed */
  type: 'email' | 'document'
  /** Title of the preview */
  title: string
  /** Short snippet of the content */
  snippet: string
  /** Full content (shown when expanded) */
  fullContent?: string
  /** Custom icon to display */
  icon?: ReactNode
  /** Custom className */
  className?: string
}

/**
 * Chat Preview Card Component
 *
 * Displays a preview of email drafts or document content in the chat.
 * Features a blue left border, icon, and expandable content.
 *
 * @example
 * // Email preview
 * <ChatPreviewCard
 *   type="email"
 *   title="Meeting Follow-up"
 *   snippet="Thank you for attending today's meeting..."
 *   fullContent="Thank you for attending today's meeting. As discussed, here are the next steps..."
 * />
 *
 * @example
 * // Document preview
 * <ChatPreviewCard
 *   type="document"
 *   title="Q4 Report Draft"
 *   snippet="This quarter we achieved a 15% increase in..."
 * />
 */
export function ChatPreviewCard({
  type,
  title,
  snippet,
  fullContent,
  icon,
  className,
}: ChatPreviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const defaultIcon = type === 'email' ? (
    <Mail className="h-5 w-5" />
  ) : (
    <FileText className="h-5 w-5" />
  )

  const typeLabel = type === 'email' ? 'Email Draft' : 'Document Preview'
  const hasExpandableContent = fullContent && fullContent !== snippet

  return (
    <Card className={cn('max-w-[85%] self-start overflow-hidden', className)}>
      <div className="p-4 bg-gray-50 border-l-4 border-blue-500">
        {/* Header */}
        <div className="flex items-start gap-3 mb-2">
          <div className="text-blue-600 shrink-0" aria-hidden="true">
            {icon || defaultIcon}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{title}</h4>
            <p className="text-xs text-gray-500 mt-0.5">{typeLabel}</p>
          </div>
        </div>

        {/* Content */}
        <div className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">
          {isExpanded && fullContent ? fullContent : snippet}
        </div>

        {/* Expand Toggle */}
        {hasExpandableContent && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-3 focus:outline-none focus:underline"
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
                Show full content
              </>
            )}
          </button>
        )}
      </div>
    </Card>
  )
}
