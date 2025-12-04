/**
 * Chat Message Component
 *
 * Displays individual chat messages with three variants:
 * - User messages: Right-aligned with primary color background
 * - Agent messages: Left-aligned with avatar and agent color
 * - System messages: Centered with muted style (for dividers)
 *
 * Security: All content is sanitized with DOMPurify to prevent XSS attacks.
 */

'use client';

import { memo } from 'react';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';
import { formatChatTime } from '@/lib/date-utils';

/**
 * Sanitize user-generated content to prevent XSS attacks
 * Strips all HTML tags and returns plain text
 *
 * Note: This component is 'use client' so DOMPurify is always available.
 * The import is at module level for proper Next.js 15 bundling.
 */
function sanitizeContent(content: string): string {
  return DOMPurify.sanitize(content, { ALLOWED_TAGS: [] });
}

interface ChatMessageProps {
  type: 'user' | 'agent' | 'system';
  content: string;
  /** Accepts Date objects, ISO strings, or numeric timestamps */
  timestamp: Date | string | number;
  agentName?: string;
  agentIcon?: string;
  agentColor?: string;
}

export const ChatMessage = memo(function ChatMessage({
  type,
  content,
  timestamp,
  agentName,
  agentIcon,
  agentColor,
}: ChatMessageProps) {
  // Use standardized date utility - handles Date, string, and number inputs
  const formattedTime = formatChatTime(timestamp);

  // Sanitize content to prevent XSS
  const safeContent = sanitizeContent(content);

  if (type === 'system') {
    return (
      <div className="flex justify-center my-3">
        <p className="text-xs text-[rgb(var(--color-text-muted))]">{safeContent}</p>
      </div>
    );
  }

  if (type === 'user') {
    return (
      <div className="flex max-w-[85%] flex-col items-end gap-1 self-end">
        <div
          className={cn(
            'rounded-t-xl rounded-bl-xl rounded-br-sm',
            'bg-[rgb(var(--color-primary-500))] px-4 py-3 text-white'
          )}
        >
          <p className="text-sm font-normal leading-relaxed">{safeContent}</p>
        </div>
        <p className="text-[11px] text-[rgb(var(--color-text-muted))]">
          {formattedTime}
        </p>
      </div>
    );
  }

  // Agent message
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
          {agentName || 'Agent'}
        </p>

        {/* Message Bubble */}
        <div
          className={cn(
            'rounded-t-xl rounded-br-xl rounded-bl-sm',
            'bg-[rgb(var(--color-bg-tertiary))] px-4 py-3',
            'text-[rgb(var(--color-text-primary))]'
          )}
        >
          <p className="text-sm font-normal leading-relaxed">{safeContent}</p>
        </div>

        {/* Timestamp */}
        <p className="text-[11px] text-[rgb(var(--color-text-muted))]">
          {formattedTime}
        </p>
      </div>
    </div>
  );
});

