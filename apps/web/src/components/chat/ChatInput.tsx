/**
 * Chat Input Component
 *
 * Input area for sending messages with:
 * - Auto-expanding textarea (1-6 lines)
 * - @mention support with agent popup
 * - Attachment button (placeholder)
 * - Send button
 * - Enter to send, Shift+Enter for newline
 *
 * Updated: Story 15.4 - Added @mentions popup for agent routing
 */

'use client';

import { useState, useRef, KeyboardEvent, useCallback } from 'react';
import { AtSign, Paperclip, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MentionPopup, getFilteredAgents } from './MentionPopup';
import type { ChatAgent } from './AgentSelector';

interface ChatInputProps {
  onSend: (message: string) => void;
  agentName: string;
  disabled?: boolean;
  /** Optional callback when an agent is mentioned */
  onMention?: (agent: ChatAgent) => void;
}

export function ChatInput({ onSend, agentName, disabled, onMention }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      setShowMentionPopup(false);
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle mention popup navigation
    if (showMentionPopup) {
      const filteredAgents = getFilteredAgents(mentionFilter);

      // Guard against empty agent list to prevent NaN from modulo with 0
      if (filteredAgents.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setHighlightedIndex((prev) => (prev + 1) % filteredAgents.length);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setHighlightedIndex((prev) => (prev - 1 + filteredAgents.length) % filteredAgents.length);
          return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          // Only intercept when there's a valid selection
          if (filteredAgents[highlightedIndex]) {
            e.preventDefault();
            handleMentionSelect(filteredAgents[highlightedIndex]);
            return;
          }
          // Otherwise, let Enter fall through to send message
        }
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionPopup(false);
        return;
      }
    }

    // Normal enter to send
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMentionSelect = useCallback(
    (agent: ChatAgent) => {
      // Replace @filter with @agentId
      const beforeMention = message.slice(0, mentionStartIndex);
      const afterMention = message.slice(
        mentionStartIndex + mentionFilter.length + 1 // +1 for the @ symbol
      );
      const newMessage = `${beforeMention}@${agent.id} ${afterMention}`;

      setMessage(newMessage);
      setShowMentionPopup(false);
      setMentionFilter('');
      setMentionStartIndex(-1);
      setHighlightedIndex(0);

      // Call onMention callback if provided
      onMention?.(agent);

      // Focus back on textarea
      textareaRef.current?.focus();
    },
    [message, mentionStartIndex, mentionFilter, onMention]
  );

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    setMessage(value);

    // Auto-expand textarea (max 6 lines = 144px)
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 144)}px`;

    // Check for @ mention trigger
    const textBeforeCursor = value.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Only show popup if @ is at start or after a space, and no space after @
      const charBeforeAt = lastAtIndex > 0 ? value[lastAtIndex - 1] : ' ';
      const isValidMentionStart = charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtIndex === 0;

      if (isValidMentionStart && !textAfterAt.includes(' ')) {
        setShowMentionPopup(true);
        setMentionFilter(textAfterAt);
        setMentionStartIndex(lastAtIndex);
        setHighlightedIndex(0);
        return;
      }
    }

    // Close popup if conditions not met
    setShowMentionPopup(false);
    setMentionFilter('');
  };

  const handleAtButtonClick = () => {
    // Insert @ at cursor position
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = message.slice(0, start) + '@' + message.slice(end);
      setMessage(newValue);

      // Show mention popup
      setShowMentionPopup(true);
      setMentionFilter('');
      setMentionStartIndex(start);
      setHighlightedIndex(0);

      // Set cursor position after @
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 1, start + 1);
      }, 0);
    }
  };

  return (
    <footer
      ref={containerRef}
      className={cn(
        'relative shrink-0 border-t border-[rgb(var(--color-border-default))]',
        'bg-[rgb(var(--color-bg-surface))] p-3 px-4'
      )}
    >
      {/* Mention Popup - positioned above the input */}
      <MentionPopup
        isOpen={showMentionPopup}
        filter={mentionFilter}
        position={{ bottom: 60, left: 12 }}
        highlightedIndex={highlightedIndex}
        onSelect={handleMentionSelect}
        onClose={() => setShowMentionPopup(false)}
      />

      <div
        className={cn(
          'relative flex min-h-[44px] items-end gap-2',
          'rounded-full bg-[rgb(var(--color-bg-tertiary))] py-2 pl-11 pr-2'
        )}
      >
        {/* Left Icons */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1">
          {/* @mention button */}
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md',
              'text-[rgb(var(--color-text-muted))] transition-colors duration-150',
              'hover:bg-[rgb(var(--color-border-default))]',
              'hover:text-[rgb(var(--color-text-secondary))]',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent',
              showMentionPopup && 'bg-[rgb(var(--color-border-default))] text-[rgb(var(--color-text-secondary))]'
            )}
            aria-label="Mention agent"
            onClick={handleAtButtonClick}
          >
            <AtSign className="h-5 w-5" />
          </button>

          {/* Attachment button (placeholder) */}
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md',
              'text-[rgb(var(--color-text-muted))] transition-colors duration-150',
              'hover:bg-[rgb(var(--color-border-default))]',
              'hover:text-[rgb(var(--color-text-secondary))]',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent'
            )}
            aria-label="Attach file"
            onClick={() => {
              // TODO: Implement file attachment
              // Placeholder - will trigger file picker when implemented
            }}
          >
            <Paperclip className="h-5 w-5" />
          </button>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${agentName}...`}
          disabled={disabled}
          className={cn(
            'w-full max-h-36 min-h-[24px] resize-none self-center',
            'border-none bg-transparent text-sm',
            'text-[rgb(var(--color-text-primary))]',
            'placeholder:text-[rgb(var(--color-text-muted))]',
            'focus:outline-none focus:ring-0 disabled:cursor-not-allowed'
          )}
          rows={1}
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center',
            'rounded-full bg-[rgb(var(--color-primary-500))] text-white',
            'transition-all duration-150 hover:scale-105 active:scale-95',
            'disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-600'
          )}
          aria-label="Send message"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      </div>
    </footer>
  );
}
