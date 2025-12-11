/**
 * Typing Indicator Component
 *
 * Story 15-22: Chat Panel Styling Per Style Guide
 *
 * Displays animated typing indicator in agent message bubble style.
 * Three dots with smooth pulse animation.
 */

'use client';

import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  agentName: string;
  agentIcon?: string;
  agentColor?: string;
}

export function TypingIndicator({
  agentName,
  agentIcon,
  agentColor,
}: TypingIndicatorProps) {
  return (
    <div
      className="flex max-w-[85%] items-start gap-2.5 self-start"
      role="status"
      aria-live="polite"
      aria-label={`${agentName} is typing`}
    >
      {/* Agent Avatar - matches agent message style */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center',
          'rounded-full text-base'
        )}
        style={{
          backgroundColor: `${agentColor || '#20B2AA'}20`,
          color: agentColor || '#20B2AA',
        }}
      >
        {agentIcon || '🤖'}
      </div>

      <div className="flex flex-col gap-1">
        {/* Agent Name */}
        <p className="text-xs font-semibold" style={{ color: agentColor || '#20B2AA' }}>
          {agentName}
        </p>

        {/* Typing Indicator - matches agent bubble style */}
        <div
          className={cn(
            // Border radius: 16px with 4px top-left for agent
            'rounded-[16px] rounded-tl-[4px]',
            // Background: white with subtle border (agent bubble style)
            'bg-[rgb(var(--color-bg-white))]',
            'border border-[rgb(var(--color-border-subtle))]',
            'px-4 py-4',
            'shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
            'flex items-center gap-2'
          )}
        >
          {/* Three-dot pulse animation */}
          <div
            className="h-2 w-2 rounded-full animate-[typing-pulse_1.4s_infinite_ease-in-out]"
            style={{ backgroundColor: agentColor || '#20B2AA', opacity: 0.7 }}
          />
          <div
            className="h-2 w-2 rounded-full animate-[typing-pulse_1.4s_infinite_ease-in-out_0.2s]"
            style={{ backgroundColor: agentColor || '#20B2AA', opacity: 0.7 }}
          />
          <div
            className="h-2 w-2 rounded-full animate-[typing-pulse_1.4s_infinite_ease-in-out_0.4s]"
            style={{ backgroundColor: agentColor || '#20B2AA', opacity: 0.7 }}
          />
        </div>
      </div>
    </div>
  );
}
