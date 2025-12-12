/**
 * Chat Message List Component
 *
 * Scrollable container for chat messages with auto-scroll behavior.
 * Displays user messages, agent messages, typing indicator, and streaming.
 *
 * Story: 15.4 - Connect Chat Panel to Agno Backend
 * Updated: Added streaming props support
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  agentName?: string;
  agentIcon?: string;
  agentColor?: string;
  isStreaming?: boolean;
}

interface ChatMessageListProps {
  messages: Message[];
  isTyping?: boolean;
  isStreaming?: boolean;
  currentAgent?: {
    name: string;
    icon?: string;
    color?: string;
  };
  onStopStreaming?: () => void;
  /** Horizontal layout for bottom panel position */
  horizontal?: boolean;
}

export function ChatMessageList({
  messages,
  isTyping,
  isStreaming,
  currentAgent,
  onStopStreaming,
  horizontal = false,
}: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(messages.length);
  const prevIsTypingRef = useRef(isTyping);
  const prevIsStreamingRef = useRef(isStreaming);

  // Memoized scroll function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Optimized auto-scroll: scroll when messages are added, typing starts, or streaming starts
  useEffect(() => {
    const messageCountChanged = messages.length !== prevMessageCountRef.current;
    const typingStarted = isTyping && !prevIsTypingRef.current;
    const streamingStarted = isStreaming && !prevIsStreamingRef.current;

    // Only scroll if new messages, typing started, or streaming started
    if (messageCountChanged || typingStarted || streamingStarted) {
      scrollToBottom();
    }

    // Update refs for next comparison
    prevMessageCountRef.current = messages.length;
    prevIsTypingRef.current = isTyping;
    prevIsStreamingRef.current = isStreaming;
  }, [messages.length, isTyping, isStreaming, scrollToBottom]);

  // Also scroll when streaming content updates (for long responses)
  useEffect(() => {
    if (isStreaming) {
      // Scroll on each content update during streaming
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.isStreaming) {
        scrollToBottom();
      }
    }
  }, [messages, isStreaming, scrollToBottom]);

  return (
    <div
      className={cn(
        'flex flex-1 gap-4 p-4',
        horizontal ? 'flex-row overflow-x-auto' : 'flex-col overflow-y-auto',
        // Custom scrollbar styles
        '[&::-webkit-scrollbar]:w-[6px]',
        '[&::-webkit-scrollbar-track]:bg-transparent',
        '[&::-webkit-scrollbar-thumb]:bg-gray-300',
        '[&::-webkit-scrollbar-thumb]:rounded-[3px]',
        'dark:[&::-webkit-scrollbar-thumb]:bg-gray-600',
        horizontal && '[&::-webkit-scrollbar]:h-[6px]'
      )}
    >
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          {...message}
          isStreaming={message.isStreaming}
          onStopStreaming={message.isStreaming ? onStopStreaming : undefined}
        />
      ))}

      {isTyping && currentAgent && (
        <TypingIndicator
          agentName={currentAgent.name}
          agentIcon={currentAgent.icon}
          agentColor={currentAgent.color}
        />
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
