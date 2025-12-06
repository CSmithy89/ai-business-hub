'use client'

import { AlertTriangle, RotateCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ChatErrorMessageProps {
  /** Error title (bold heading) */
  title: string
  /** Error message (description) */
  message: string
  /** Callback when retry button is clicked */
  onRetry?: () => void
  /** Callback when cancel button is clicked */
  onCancel?: () => void
  /** Custom className */
  className?: string
}

/**
 * Chat Error Message Component
 *
 * Displays error messages in the chat with a distinctive red left border,
 * warning icon, and optional Retry/Cancel action buttons.
 *
 * @example
 * <ChatErrorMessage
 *   title="Failed to send message"
 *   message="There was a network error. Please try again."
 *   onRetry={() => resendMessage()}
 *   onCancel={() => dismissError()}
 * />
 */
export function ChatErrorMessage({
  title,
  message,
  onRetry,
  onCancel,
  className,
}: ChatErrorMessageProps) {
  return (
    <div className={cn('flex max-w-[85%] self-start', className)}>
      <div className="border-l-4 border-red-500 bg-red-50 rounded-lg p-4 w-full">
        <div className="flex items-start gap-3">
          <AlertTriangle
            className="h-5 w-5 text-red-600 shrink-0 mt-0.5"
            aria-hidden="true"
          />

          <div className="flex-1">
            <h4 className="font-semibold text-red-900 mb-1">{title}</h4>
            <p className="text-sm text-red-700">{message}</p>

            {(onRetry || onCancel) && (
              <div className="flex gap-2 mt-3">
                {onRetry && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onRetry}
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    <RotateCw className="h-3 w-3 mr-1.5" />
                    Retry
                  </Button>
                )}
                {onCancel && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={onCancel}
                    className="text-red-700 hover:bg-red-100"
                  >
                    <X className="h-3 w-3 mr-1.5" />
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
