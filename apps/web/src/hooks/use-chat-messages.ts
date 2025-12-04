/**
 * Chat Messages Hook
 *
 * Mock hook for chat functionality with sample data.
 * Simulates agent typing and responses for demo purposes.
 *
 * TODO: Replace with real WebSocket connection in future story
 */

'use client';

import { useState } from 'react';

interface Message {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  agentName?: string;
  agentIcon?: string;
  agentColor?: string;
}

export function useChatMessages() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: 'Today',
      timestamp: new Date(),
    },
    {
      id: '2',
      type: 'user',
      content: 'Create a follow-up email for the Johnson deal with a friendly tone.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
    },
    {
      id: '3',
      type: 'agent',
      content:
        "Of course. Here is a draft based on our last conversation. I've included a friendly opening and a clear call to action.",
      timestamp: new Date(Date.now() - 4 * 60 * 1000),
      agentName: 'Hub',
      agentIcon: '🎯',
      agentColor: '#FF6B6B',
    },
    {
      id: '4',
      type: 'agent',
      content: 'Let me know if you\'d like any changes before sending.',
      timestamp: new Date(Date.now() - 3 * 60 * 1000),
      agentName: 'Hub',
      agentIcon: '🎯',
      agentColor: '#FF6B6B',
    },
  ]);

  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Simulate agent typing
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);

      // Add agent response
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: `I received your message: "${content}". This is a mock response for demonstration purposes.`,
        timestamp: new Date(),
        agentName: 'Hub',
        agentIcon: '🎯',
        agentColor: '#FF6B6B',
      };

      setMessages((prev) => [...prev, agentMessage]);
    }, 2000);
  };

  return {
    messages,
    isTyping,
    sendMessage,
  };
}
