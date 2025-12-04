/**
 * Typing Indicator Component
 *
 * Displays animated typing indicator in agent message format.
 * Three dots with staggered bounce animation.
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
    <div className="flex max-w-[85%] items-start gap-2.5 self-start">
      {/* Agent Avatar */}
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center',
          'rounded-full text-base text-white'
        )}
        style={{ backgroundColor: agentColor || '#20B2AA' }}
      >
        {agentIcon || '🤖'}
      </div>

      <div className="flex flex-col gap-1">
        {/* Agent Name */}
        <p className="text-xs font-semibold" style={{ color: agentColor || '#20B2AA' }}>
          {agentName}
        </p>

        {/* Typing Indicator */}
        <div
          className={cn(
            'flex items-center gap-1.5 rounded-t-xl rounded-br-xl rounded-bl-sm',
            'bg-[rgb(var(--color-bg-tertiary))] px-4 py-3'
          )}
        >
          <div className="h-2 w-2 rounded-full bg-[rgb(var(--color-text-muted))] animate-[bounce_1.4s_infinite_ease-in-out]" />
          <div className="h-2 w-2 rounded-full bg-[rgb(var(--color-text-muted))] animate-[bounce_1.4s_infinite_ease-in-out_0.2s]" />
          <div className="h-2 w-2 rounded-full bg-[rgb(var(--color-text-muted))] animate-[bounce_1.4s_infinite_ease-in-out_0.4s]" />
        </div>
      </div>
    </div>
  );
}
