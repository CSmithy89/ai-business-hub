/**
 * Chat Messages Hook
 *
 * Hook for chat functionality with API integration.
 * Handles message sending, receiving, streaming, and state management.
 *
 * Story: 15.4 - Connect Chat Panel to Agno Backend
 * Story: 16.6 - Implement Optimistic UI Updates
 *
 * Features:
 * - Optimistic message sending (shows message immediately)
 * - Streaming responses with live updates
 * - Automatic retry on error
 * - Rollback with error indication
 * - Persistent chat history in localStorage
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

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
  isStreaming?: boolean;
}

interface ChatAgent {
  id: string;
  name: string;
  icon: string;
  color: string;
  greeting?: string;
}

const STORAGE_KEY = 'hyvve-chat-history';

/** Maximum number of messages to store in localStorage */
const MAX_STORED_MESSAGES = 100;

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
        isStreaming: false, // Never load as streaming
      }));
    }
  } catch (error) {
    console.error('Failed to load chat history:', error);
    toast.error('Failed to load chat history', {
      description: 'Your previous messages could not be loaded.',
    });
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
    // Keep only last N messages, exclude streaming messages from save
    const toSave = messages
      .filter((m) => !m.isStreaming)
      .slice(-MAX_STORED_MESSAGES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.error('Failed to save chat history:', error);
    toast.error('Failed to save chat history', {
      description: 'Your messages may not be saved.',
    });
  }
}

export function useChatMessages(currentAgent: ChatAgent = DEFAULT_AGENT) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load messages on mount
  useEffect(() => {
    setMessages(loadMessages());
  }, []);

  // Save messages when they change (but not while streaming)
  useEffect(() => {
    if (messages.length > 0 && !isStreaming) {
      saveMessages(messages);
    }
  }, [messages, isStreaming]);

  // Cleanup abort controller on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  /**
   * Stop the current streaming response
   */
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setIsTyping(false);

    // Mark the last message as no longer streaming
    setMessages((prev) => {
      const updated = [...prev];
      const lastIdx = updated.length - 1;
      if (lastIdx >= 0 && updated[lastIdx].isStreaming) {
        updated[lastIdx] = { ...updated[lastIdx], isStreaming: false };
      }
      return updated;
    });
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      setError(null);

      // OPTIMISTIC UPDATE: Add user message immediately
      // This provides instant feedback to the user
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        type: 'user',
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Show typing indicator
      setIsTyping(true);

      // Abort any existing request before starting a new one
      // This prevents concurrent request leaks and race conditions
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        // Send to API with streaming
        const response = await fetch(`/api/agents/${currentAgent.id}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
          },
          body: JSON.stringify({ content, stream: true }),
          signal: abortControllerRef.current.signal,
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

        // Check if response is streaming (SSE)
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('text/event-stream') && response.body) {
          // Handle streaming response
          setIsTyping(false);
          setIsStreaming(true);

          // OPTIMISTIC UPDATE: Create placeholder message for streaming
          // Shows loading indicator until first chunk arrives
          const streamingMessage: Message = {
            id: `agent-${Date.now()}`,
            type: 'agent',
            content: '',
            timestamp: new Date(),
            agentId: currentAgent.id,
            agentName: currentAgent.name,
            agentIcon: currentAgent.icon,
            agentColor: currentAgent.color,
            isStreaming: true,
          };

          setMessages((prev) => [...prev, streamingMessage]);

          // Stream the response
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });

              // Process SSE events
              const lines = buffer.split('\n');
              buffer = lines.pop() || ''; // Keep incomplete line in buffer

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);

                  if (data === '[DONE]') {
                    // Stream complete
                    setMessages((prev) => {
                      const updated = [...prev];
                      const lastIdx = updated.length - 1;
                      if (lastIdx >= 0) {
                        updated[lastIdx] = { ...updated[lastIdx], isStreaming: false };
                      }
                      return updated;
                    });
                    continue;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    const chunk = parsed.content || parsed.text || parsed.delta || '';

                    if (chunk) {
                      setMessages((prev) => {
                        const updated = [...prev];
                        const lastIdx = updated.length - 1;
                        if (lastIdx >= 0 && updated[lastIdx].isStreaming) {
                          updated[lastIdx] = {
                            ...updated[lastIdx],
                            content: updated[lastIdx].content + chunk,
                          };
                        }
                        return updated;
                      });
                    }
                  } catch {
                    // If not JSON, treat as plain text chunk
                    if (data.trim()) {
                      setMessages((prev) => {
                        const updated = [...prev];
                        const lastIdx = updated.length - 1;
                        if (lastIdx >= 0 && updated[lastIdx].isStreaming) {
                          updated[lastIdx] = {
                            ...updated[lastIdx],
                            content: updated[lastIdx].content + data,
                          };
                        }
                        return updated;
                      });
                    }
                  }
                }
              }
            }
          } finally {
            // Ensure streaming state is cleared
            setIsStreaming(false);
            setMessages((prev) => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (lastIdx >= 0 && updated[lastIdx].isStreaming) {
                updated[lastIdx] = { ...updated[lastIdx], isStreaming: false };
              }
              return updated;
            });
          }
        } else {
          // Handle non-streaming response (fallback)
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
          setIsTyping(false);
        }
      } catch (err) {
        // Handle abort
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);

        // ROLLBACK: Add error message to chat
        // User can retry using retryLastMessage function
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
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [currentAgent]
  );

  const clearHistory = useCallback(() => {
    const welcomeMessages = loadMessages().slice(0, 2); // Keep welcome + greeting
    setMessages(welcomeMessages);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  /**
   * RETRY MECHANISM: Retry the last failed message
   * Aborts any in-flight request, removes error messages, and resends the last user message
   */
  const retryLastMessage = useCallback(() => {
    // Abort any existing request to prevent race conditions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Find the last user message
    const lastUserMessage = [...messages].reverse().find((m) => m.type === 'user');
    if (lastUserMessage) {
      // Remove only the last error message (not all errors) to preserve history
      setMessages((prev) => {
        const lastErrorIndex = prev.findLastIndex((m) => m.error);
        if (lastErrorIndex !== -1) {
          return [...prev.slice(0, lastErrorIndex), ...prev.slice(lastErrorIndex + 1)];
        }
        return prev;
      });
      sendMessage(lastUserMessage.content);
    }
  }, [messages, sendMessage]);

  /**
   * Add a greeting message when switching to a new agent
   */
  const addAgentGreeting = useCallback(
    (agent: ChatAgent) => {
      if (!agent.greeting) return;

      const greetingMessage: Message = {
        id: `greeting-${agent.id}-${Date.now()}`,
        type: 'agent',
        content: agent.greeting,
        timestamp: new Date(),
        agentId: agent.id,
        agentName: agent.name,
        agentIcon: agent.icon,
        agentColor: agent.color,
      };

      setMessages((prev) => [...prev, greetingMessage]);
    },
    []
  );

  return {
    messages,
    isTyping,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearHistory,
    retryLastMessage,
    addAgentGreeting,
  };
}
