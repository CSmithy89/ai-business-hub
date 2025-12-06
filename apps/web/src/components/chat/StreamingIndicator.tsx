'use client'

import { cn } from '@/lib/utils'

interface StreamingIndicatorProps {
  /** Agent name to display */
  agentName?: string
  /** Agent icon/emoji */
  agentIcon?: string
  /** Agent color for avatar and name */
  agentColor?: string
  /** Optional className */
  className?: string
}

/**
 * Streaming Indicator Component
 *
 * Shows a bouncing dots animation while waiting for the first token
 * from a streaming response. Styled to match agent message layout.
 */
export function StreamingIndicator({
  agentName = 'Agent',
  agentIcon = '🤖',
  agentColor = '#20B2AA',
  className,
}: StreamingIndicatorProps) {
  return (
    <div className={cn('flex max-w-[85%] items-start gap-2.5 self-start', className)}>
      {/* Agent Avatar */}
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-base text-white"
        style={{ backgroundColor: agentColor }}
        aria-hidden="true"
      >
        {agentIcon}
      </div>

      <div className="flex flex-col gap-1">
        {/* Agent Name */}
        <p className="text-xs font-semibold" style={{ color: agentColor }}>
          {agentName}
        </p>

        {/* Shimmer/Bounce Effect */}
        <div
          className={cn(
            'rounded-t-xl rounded-br-xl rounded-bl-sm',
            'bg-[rgb(var(--color-bg-tertiary))] px-4 py-3'
          )}
        >
          <div className="flex gap-1.5" role="status" aria-label="Generating response...">
            <div
              className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
              style={{ animationDelay: '0ms', animationDuration: '0.6s' }}
            />
            <div
              className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
              style={{ animationDelay: '150ms', animationDuration: '0.6s' }}
            />
            <div
              className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
              style={{ animationDelay: '300ms', animationDuration: '0.6s' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
