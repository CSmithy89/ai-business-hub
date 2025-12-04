/**
 * Chat Message List Component
 *
 * Scrollable container for chat messages with auto-scroll behavior.
 * Displays user messages, agent messages, and typing indicator.
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
}

interface ChatMessageListProps {
  messages: Message[];
  isTyping?: boolean;
  currentAgent?: {
    name: string;
    icon?: string;
    color?: string;
  };
}

export function ChatMessageList({
  messages,
  isTyping,
  currentAgent,
}: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(messages.length);
  const prevIsTypingRef = useRef(isTyping);

  // Memoized scroll function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Optimized auto-scroll: only scroll when messages are added or typing starts
  useEffect(() => {
    const messageCountChanged = messages.length !== prevMessageCountRef.current;
    const typingStarted = isTyping && !prevIsTypingRef.current;

    // Only scroll if new messages or typing just started
    if (messageCountChanged || typingStarted) {
      scrollToBottom();
    }

    // Update refs for next comparison
    prevMessageCountRef.current = messages.length;
    prevIsTypingRef.current = isTyping;
  }, [messages.length, isTyping, scrollToBottom]);

  return (
    <div
      className={cn(
        'flex flex-1 flex-col gap-4 overflow-y-auto p-4',
        // Custom scrollbar styles
        '[&::-webkit-scrollbar]:w-[6px]',
        '[&::-webkit-scrollbar-track]:bg-transparent',
        '[&::-webkit-scrollbar-thumb]:bg-gray-300',
        '[&::-webkit-scrollbar-thumb]:rounded-[3px]',
        'dark:[&::-webkit-scrollbar-thumb]:bg-gray-600'
      )}
    >
      {messages.map((message) => (
        <ChatMessage key={message.id} {...message} />
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
