/**
 * Chat Input Component
 *
 * Input area for sending messages with:
 * - Auto-expanding textarea (1-6 lines)
 * - @mention support (inserts @ symbol)
 * - Attachment button (placeholder)
 * - Send button
 * - Enter to send, Shift+Enter for newline
 */

'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  agentName: string;
  disabled?: boolean;
}

export function ChatInput({ onSend, agentName, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-expand textarea (max 6 lines = 144px)
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 144)}px`;
  };

  return (
    <footer
      className={cn(
        'shrink-0 border-t border-[rgb(var(--color-border-default))]',
        'bg-[rgb(var(--color-bg-surface))] p-3 px-4'
      )}
    >
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
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md',
              'text-[rgb(var(--color-text-muted))] transition-colors duration-150',
              'hover:bg-[rgb(var(--color-border-default))]',
              'hover:text-[rgb(var(--color-text-secondary))]'
            )}
            aria-label="Mention agent"
            onClick={() => {
              // Basic @mention support - insert @ symbol
              setMessage((prev) => prev + '@');
              textareaRef.current?.focus();
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '20px' }}
            >
              alternate_email
            </span>
          </button>

          {/* Attachment button (placeholder) */}
          <button
            type="button"
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md',
              'text-[rgb(var(--color-text-muted))] transition-colors duration-150',
              'hover:bg-[rgb(var(--color-border-default))]',
              'hover:text-[rgb(var(--color-text-secondary))]'
            )}
            aria-label="Attach file"
            onClick={() => {
              // TODO: Implement file attachment
              console.log('Attachment clicked');
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '20px' }}
            >
              attachment
            </span>
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
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            arrow_upward
          </span>
        </button>
      </div>
    </footer>
  );
}
