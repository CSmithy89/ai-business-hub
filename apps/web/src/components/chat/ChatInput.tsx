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

import { useState, useRef, KeyboardEvent, useCallback, ChangeEvent } from 'react';
import { AtSign, Paperclip, ArrowUp, X, FileText, Image as ImageIcon, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MentionPopup, getFilteredAgents } from './MentionPopup';
import type { ChatAgent } from './AgentSelector';

interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'document' | 'other';
}

interface ChatInputProps {
  onSend: (message: string, attachments?: File[]) => void;
  agentName: string;
  disabled?: boolean;
  /** Optional callback when an agent is mentioned */
  onMention?: (agent: ChatAgent) => void;
  /** Maximum file size in MB */
  maxFileSizeMB?: number;
  /** Allowed file types */
  acceptedFileTypes?: string;
}

export function ChatInput({
  onSend,
  agentName,
  disabled,
  onMention,
  maxFileSizeMB = 10,
  acceptedFileTypes = 'image/*,.pdf,.doc,.docx,.txt,.md,.csv,.json',
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    const hasContent = message.trim() || attachedFiles.length > 0;
    if (hasContent && !disabled) {
      const files = attachedFiles.map((af) => af.file);
      onSend(message.trim(), files.length > 0 ? files : undefined);
      setMessage('');
      // Prevent memory leaks from image previews
      attachedFiles.forEach((file) => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
      setAttachedFiles([]);
      setShowMentionPopup(false);
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // File handling functions
  const getFileType = (file: File): AttachedFile['type'] => {
    if (file.type.startsWith('image/')) return 'image';
    if (
      file.type === 'application/pdf' ||
      file.type.includes('document') ||
      file.type.includes('text')
    ) {
      return 'document';
    }
    return 'other';
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxSizeBytes = maxFileSizeMB * 1024 * 1024;
    const newFiles: AttachedFile[] = [];

    Array.from(files).forEach((file) => {
      if (file.size > maxSizeBytes) {
        console.warn(`File ${file.name} exceeds ${maxFileSizeMB}MB limit`);
        return;
      }

      const attachedFile: AttachedFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        type: getFileType(file),
      };

      // Create preview for images
      if (attachedFile.type === 'image') {
        attachedFile.preview = URL.createObjectURL(file);
      }

      newFiles.push(attachedFile);
    });

    setAttachedFiles((prev) => [...prev, ...newFiles]);

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    setAttachedFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
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

  // Helper to render file icon based on type
  const FileTypeIcon = ({ type }: { type: AttachedFile['type'] }) => {
    if (type === 'image') return <ImageIcon className="h-4 w-4" />;
    if (type === 'document') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const hasContent = message.trim() || attachedFiles.length > 0;

  return (
    <footer
      ref={containerRef}
      className={cn(
        'relative shrink-0 border-t border-[rgb(var(--color-border-default))]',
        'bg-[rgb(var(--color-bg-surface))] p-3 px-4'
      )}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedFileTypes}
        onChange={handleFileSelect}
        className="hidden"
        aria-hidden="true"
      />

      {/* Mention Popup - positioned above the input */}
      <MentionPopup
        isOpen={showMentionPopup}
        filter={mentionFilter}
        position={{ bottom: attachedFiles.length > 0 ? 120 : 60, left: 12 }}
        highlightedIndex={highlightedIndex}
        onSelect={handleMentionSelect}
        onClose={() => setShowMentionPopup(false)}
      />

      {/* Attached files preview */}
      {attachedFiles.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachedFiles.map((file) => (
            <div
              key={file.id}
              className={cn(
                'relative flex items-center gap-2 rounded-lg px-3 py-2',
                'bg-[rgb(var(--color-bg-tertiary))]',
                'border border-[rgb(var(--color-border-default))]'
              )}
            >
              {file.preview ? (
                <img
                  src={file.preview}
                  alt={file.file.name}
                  className="h-8 w-8 rounded object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded bg-[rgb(var(--color-bg-secondary))]">
                  <FileTypeIcon type={file.type} />
                </div>
              )}
              <span className="max-w-[120px] truncate text-xs text-[rgb(var(--color-text-secondary))]">
                {file.file.name}
              </span>
              <button
                type="button"
                onClick={() => removeFile(file.id)}
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full',
                  'bg-[rgb(var(--color-bg-secondary))] text-[rgb(var(--color-text-muted))]',
                  'hover:bg-[rgb(var(--color-error-500))] hover:text-white',
                  'transition-colors duration-150'
                )}
                aria-label={`Remove ${file.file.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input container with rounded corners */}
      <div
        className={cn(
          'flex min-h-[44px] items-end gap-2 rounded-2xl',
          'bg-[rgb(var(--color-bg-tertiary))] py-2 px-3'
        )}
      >
        {/* Left action buttons */}
        <div className="flex shrink-0 items-center gap-1 self-end pb-0.5">
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
            aria-label="Mention agent (@)"
            onClick={handleAtButtonClick}
          >
            <AtSign className="h-5 w-5" />
          </button>

          {/* Attachment button */}
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md',
              'text-[rgb(var(--color-text-muted))] transition-colors duration-150',
              'hover:bg-[rgb(var(--color-border-default))]',
              'hover:text-[rgb(var(--color-text-secondary))]',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent',
              attachedFiles.length > 0 && 'text-[rgb(var(--color-primary-500))]'
            )}
            aria-label="Attach file"
            onClick={handleAttachClick}
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
            'flex-1 max-h-36 min-h-[24px] resize-none self-center',
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
          disabled={!hasContent || disabled}
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center self-end',
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
