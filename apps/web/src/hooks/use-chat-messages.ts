/**
 * Chat Messages Hook
 *
 * Hook for chat functionality with API integration.
 * Handles message sending, receiving, and state management.
 *
 * Story: 15.4 - Connect Chat Panel to Agno Backend
 */

'use client';

import { useState, useCallback, useEffect } from 'react';

export interface Message {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  agentId?: string;
  agentName?: string;
  agentIcon?: string;
  agentColor?: string;
  error?: boolean;
}

interface ChatAgent {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const STORAGE_KEY = 'hyvve-chat-history';

// Default agent for responses
const DEFAULT_AGENT: ChatAgent = {
  id: 'hub',
  name: 'Hub',
  icon: '🎯',
  color: '#FF6B6B',
};

/**
 * Load messages from localStorage
 */
function loadMessages(): Message[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((msg: Message) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    }
  } catch {
    console.warn('Failed to load chat history');
  }

  // Return welcome message if no history
  return [
    {
      id: 'welcome',
      type: 'system',
      content: 'Today',
      timestamp: new Date(),
    },
    {
      id: 'greeting',
      type: 'agent',
      content:
        "Hello! I'm Hub, your AI orchestrator. I can help coordinate tasks, answer questions, and connect you with specialized agents. How can I assist you today?",
      timestamp: new Date(),
      agentId: 'hub',
      agentName: 'Hub',
      agentIcon: '🎯',
      agentColor: '#FF6B6B',
    },
  ];
}

/**
 * Save messages to localStorage
 */
function saveMessages(messages: Message[]): void {
  if (typeof window === 'undefined') return;

  try {
    // Keep only last 100 messages
    const toSave = messages.slice(-100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    console.warn('Failed to save chat history');
  }
}

export function useChatMessages(currentAgent: ChatAgent = DEFAULT_AGENT) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load messages on mount
  useEffect(() => {
    setMessages(loadMessages());
  }, []);

  // Save messages when they change
  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(messages);
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      setError(null);

      // Add user message
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        type: 'user',
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Show typing indicator
      setIsTyping(true);

      try {
        // Send to API
        const response = await fetch(`/api/agents/${currentAgent.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          // Handle specific error types
          if (response.status === 401) {
            throw new Error('Please sign in to chat with agents.');
          } else if (response.status === 429) {
            throw new Error('Please wait a moment before sending another message.');
          } else if (response.status >= 500) {
            throw new Error('Unable to reach agent. Please try again.');
          } else {
            throw new Error(errorData.error || 'Failed to send message');
          }
        }

        const data = await response.json();

        // Add agent response
        const agentMessage: Message = {
          id: data.id || `agent-${Date.now()}`,
          type: 'agent',
          content: data.content,
          timestamp: new Date(data.timestamp || Date.now()),
          agentId: currentAgent.id,
          agentName: currentAgent.name,
          agentIcon: currentAgent.icon,
          agentColor: currentAgent.color,
        };

        setMessages((prev) => [...prev, agentMessage]);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);

        // Add error message to chat
        const errorMsg: Message = {
          id: `error-${Date.now()}`,
          type: 'agent',
          content: errorMessage,
          timestamp: new Date(),
          agentId: currentAgent.id,
          agentName: currentAgent.name,
          agentIcon: currentAgent.icon,
          agentColor: currentAgent.color,
          error: true,
        };

        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsTyping(false);
      }
    },
    [currentAgent]
  );

  const clearHistory = useCallback(() => {
    const welcomeMessages = loadMessages().slice(0, 2); // Keep welcome + greeting
    setMessages(welcomeMessages);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const retryLastMessage = useCallback(() => {
    // Find the last user message
    const lastUserMessage = [...messages].reverse().find((m) => m.type === 'user');
    if (lastUserMessage) {
      // Remove error message if present
      setMessages((prev) => prev.filter((m) => !m.error));
      sendMessage(lastUserMessage.content);
    }
  }, [messages, sendMessage]);

  return {
    messages,
    isTyping,
    error,
    sendMessage,
    clearHistory,
    retryLastMessage,
  };
}
