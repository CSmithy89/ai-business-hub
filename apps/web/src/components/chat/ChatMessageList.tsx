/**
 * Chat Message List Component
 *
 * Scrollable container for chat messages with auto-scroll behavior.
 * Displays user messages, agent messages, and typing indicator.
 */

'use client';

import { useEffect, useRef } from 'react';
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

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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
