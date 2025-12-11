/**
 * Chat Message Component
 *
 * Displays individual chat messages with three variants:
 * - User messages: Right-aligned with primary color background
 * - Agent messages: Left-aligned with avatar and agent color (supports markdown)
 * - System messages: Centered with muted style (for dividers)
 *
 * Security: All content is sanitized with DOMPurify to prevent XSS attacks.
 * Markdown rendering: Agent messages support GFM (GitHub Flavored Markdown).
 *
 * Story: 15.4 - Connect Chat Panel to Agno Backend
 * Updated: Added markdown rendering support for agent messages
 * Updated: Story 15-25 - Apply Agent Character Colors Throughout
 */

'use client';

import { memo } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { formatChatTime } from '@/lib/date-utils';
import { getAgentColor, getAgentIcon } from '@/config/agent-colors';
import { StreamingCursor } from './StreamingCursor';
import { Button } from '@/components/ui/button';
import { Square } from 'lucide-react';

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
  /** Whether this message is currently streaming */
  isStreaming?: boolean;
  /** Callback to stop streaming (shows stop button when provided) */
  onStopStreaming?: () => void;
}

export const ChatMessage = memo(function ChatMessage({
  type,
  content,
  timestamp,
  agentName,
  agentIcon,
  agentColor,
  isStreaming,
  onStopStreaming,
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
        {/* User Message Bubble - Style Guide: 16px radius, top-right 4px, coral bg */}
        <div
          className={cn(
            // Border radius: 16px with 4px top-right for user
            'rounded-[16px] rounded-tr-[4px]',
            // Coral gradient background for premium feel
            'bg-gradient-to-br from-[rgb(var(--color-primary-500))] to-[rgb(var(--color-primary-600))]',
            // Padding: 16px (--space-4)
            'px-4 py-4 text-white',
            // Subtle shadow for depth
            'shadow-[0_2px_8px_rgba(255,107,107,0.2)]'
          )}
        >
          <p className="text-sm font-normal leading-relaxed">{safeContent}</p>
        </div>
        {/* Timestamp right-aligned for user messages */}
        <p className="text-[11px] text-[rgb(var(--color-text-muted))] text-right">
          {formattedTime}
        </p>
      </div>
    );
  }

  // Agent message - use config helpers for fallback colors
  const resolvedColor = agentColor || getAgentColor(agentName || 'maya');
  const resolvedIcon = agentIcon || getAgentIcon(agentName || 'maya');

  return (
    <div className="flex max-w-[85%] items-start gap-2.5 self-start">
      {/* Agent Avatar - left aligned per style guide */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center',
          'rounded-full text-base'
        )}
        style={{
          backgroundColor: `${resolvedColor}20`,
          color: resolvedColor,
        }}
      >
        {resolvedIcon}
      </div>

      <div className="flex flex-col gap-1">
        {/* Agent Name */}
        <p className="text-xs font-semibold" style={{ color: resolvedColor }}>
          {agentName || 'Agent'}
        </p>

        {/* Agent Message Bubble - Style Guide: white bg, border, 16px radius, top-left 4px */}
        <div
          className={cn(
            // Border radius: 16px with 4px top-left for agent
            'rounded-[16px] rounded-tl-[4px]',
            // Background: white with subtle border
            'bg-[rgb(var(--color-bg-white))]',
            'border border-[rgb(var(--color-border-subtle))]',
            // Padding: 16px (--space-4)
            'px-4 py-4',
            'text-[rgb(var(--color-text-primary))]',
            // Subtle shadow for depth
            'shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
          )}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm font-normal leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Render inline code with styling
                code: ({ children, className }) => {
                  const isInline = !className;
                  if (isInline) {
                    return (
                      <code className="rounded bg-[rgb(var(--color-bg-secondary))] px-1.5 py-0.5 text-xs font-mono">
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code className={cn('block overflow-x-auto rounded-md bg-[rgb(var(--color-bg-secondary))] p-3 text-xs font-mono', className)}>
                      {children}
                    </code>
                  );
                },
                // Style links
                a: ({ children, href }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[rgb(var(--color-primary-500))] hover:underline"
                  >
                    {children}
                  </a>
                ),
                // Style paragraphs
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                // Style lists
                ul: ({ children }) => <ul className="mb-2 ml-4 list-disc last:mb-0">{children}</ul>,
                ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal last:mb-0">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                // Style headings
                h1: ({ children }) => <h1 className="mb-2 text-lg font-bold">{children}</h1>,
                h2: ({ children }) => <h2 className="mb-2 text-base font-bold">{children}</h2>,
                h3: ({ children }) => <h3 className="mb-1 text-sm font-bold">{children}</h3>,
                // Style blockquotes
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-[rgb(var(--color-border-default))] pl-3 italic opacity-80">
                    {children}
                  </blockquote>
                ),
                // Style tables
                table: ({ children }) => (
                  <table className="my-2 w-full border-collapse text-xs">{children}</table>
                ),
                th: ({ children }) => (
                  <th className="border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-bg-secondary))] px-2 py-1 text-left font-semibold">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-[rgb(var(--color-border-default))] px-2 py-1">
                    {children}
                  </td>
                ),
              }}
            >
              {safeContent}
            </ReactMarkdown>
            {isStreaming && <StreamingCursor />}
          </div>

          {/* Stop Generating Button */}
          {isStreaming && onStopStreaming && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onStopStreaming}
              className="mt-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Square className="h-3 w-3" />
              Stop generating
            </Button>
          )}
        </div>

        {/* Timestamp - only show when not streaming */}
        {!isStreaming && (
          <p className="text-[11px] text-[rgb(var(--color-text-muted))]">
            {formattedTime}
          </p>
        )}
      </div>
    </div>
  );
});

