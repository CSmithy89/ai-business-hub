/**
 * Agent Chat Hook
 *
 * Story: PM-12.1 - Agent UI Components
 *
 * React Query hook for managing chat conversations with PM agents.
 * Handles message history, sending messages, and streaming responses.
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSessionToken, useSession } from '@/lib/auth-client';
import { NESTJS_API_URL } from '@/lib/api-config';
import { safeJson } from '@/lib/utils/safe-json';

// ============================================================================
// Types
// ============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  error?: boolean;
  agentName?: string;
  metadata?: Record<string, unknown>;
}

interface ChatHistoryResponse {
  messages: ChatMessage[];
  conversationId: string;
}

interface SendMessageResponse {
  id: string;
  content: string;
  timestamp: string;
  conversationId: string;
}

// ============================================================================
// API Functions
// ============================================================================

function getBaseUrl(): string {
  if (!NESTJS_API_URL) throw new Error('NESTJS_API_URL is not configured');
  return NESTJS_API_URL.replace(/\/$/, '');
}

async function fetchChatHistory(params: {
  projectId: string;
  agentName: string;
  token?: string;
}): Promise<ChatMessage[]> {
  const url = `${getBaseUrl()}/pm/agents/${params.agentName}/chat?projectId=${params.projectId}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(params.token && { Authorization: `Bearer ${params.token}` }),
    },
  });

  if (!response.ok) {
    // Return empty array for 404 (no history yet)
    if (response.status === 404) {
      return [];
    }
    const body = await safeJson<unknown>(response);
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : `Failed to fetch chat history: ${response.statusText}`;
    throw new Error(message);
  }

  const data = await safeJson<ChatHistoryResponse | ChatMessage[]>(response);
  if (!data) return [];

  // Handle both array and object response formats
  return Array.isArray(data) ? data : data.messages || [];
}

async function sendChatMessage(params: {
  projectId: string;
  agentName: string;
  content: string;
  token?: string;
}): Promise<SendMessageResponse> {
  const url = `${getBaseUrl()}/pm/agents/${params.agentName}/chat`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(params.token && { Authorization: `Bearer ${params.token}` }),
    },
    body: JSON.stringify({
      projectId: params.projectId,
      content: params.content,
    }),
  });

  if (!response.ok) {
    const body = await safeJson<unknown>(response);
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : `Failed to send message: ${response.statusText}`;
    throw new Error(message);
  }

  const data = await safeJson<SendMessageResponse>(response);
  if (!data) throw new Error('Invalid response from server');
  return data;
}

// ============================================================================
// Chat Storage (localStorage fallback)
// ============================================================================

const CHAT_STORAGE_PREFIX = 'hyvve-pm-chat';
const MAX_STORED_MESSAGES = 50;

function getChatStorageKey(projectId: string, agentName: string): string {
  return `${CHAT_STORAGE_PREFIX}-${projectId}-${agentName}`;
}

function loadLocalMessages(projectId: string, agentName: string): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = getChatStorageKey(projectId, agentName);
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load chat history from localStorage:', error);
  }
  return [];
}

function saveLocalMessages(projectId: string, agentName: string, messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getChatStorageKey(projectId, agentName);
    const toSave = messages
      .filter((m) => !m.isStreaming)
      .slice(-MAX_STORED_MESSAGES);
    localStorage.setItem(key, JSON.stringify(toSave));
  } catch (error) {
    console.error('Failed to save chat history to localStorage:', error);
  }
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing chat conversations with PM agents.
 *
 * Provides:
 * - `messages` - Chat message history
 * - `isLoading` - Whether initial load is in progress
 * - `isStreaming` - Whether agent is currently responding
 * - `sendMessage` - Function to send a new message
 * - `stopStreaming` - Function to abort streaming response
 * - `clearHistory` - Function to clear chat history
 * - `error` - Error message if any
 *
 * @param projectId - Project ID for context
 * @param agentName - Name of the PM agent (navi, sage, chrono, etc.)
 *
 * @example
 * ```tsx
 * const { messages, sendMessage, isStreaming } = useAgentChat('proj_123', 'sage');
 *
 * // Send a message
 * sendMessage('Estimate the login feature');
 *
 * // Display messages
 * messages.map(msg => <div key={msg.id}>{msg.content}</div>)
 * ```
 */
export function useAgentChat(projectId: string, agentName: string) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const token = getSessionToken(session);

  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Query for chat history
  const {
    data: serverMessages,
    isLoading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ['pm-agent-chat', projectId, agentName],
    queryFn: () => fetchChatHistory({ projectId, agentName, token }),
    enabled: !!token && !!projectId && !!agentName,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Load local messages on mount
  useEffect(() => {
    const local = loadLocalMessages(projectId, agentName);
    setLocalMessages(local);
  }, [projectId, agentName]);

  // Merge server and local messages
  const messages = serverMessages && serverMessages.length > 0
    ? serverMessages
    : localMessages;

  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0 && !isStreaming) {
      saveLocalMessages(projectId, agentName, messages);
    }
  }, [messages, projectId, agentName, isStreaming]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      sendChatMessage({ projectId, agentName, content, token }),
    onMutate: async (content) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['pm-agent-chat', projectId, agentName]
      });

      // Optimistically add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };

      // Add placeholder for agent response
      const agentMessage: ChatMessage = {
        id: `agent-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        isStreaming: true,
        agentName,
      };

      setLocalMessages((prev) => [...prev, userMessage, agentMessage]);
      setIsStreaming(true);
      setError(null);

      return { userMessage };
    },
    onSuccess: (data) => {
      // Update the streaming message with actual response
      setLocalMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (lastIdx >= 0 && updated[lastIdx].isStreaming) {
          updated[lastIdx] = {
            ...updated[lastIdx],
            id: data.id,
            content: data.content,
            timestamp: data.timestamp,
            isStreaming: false,
          };
        }
        return updated;
      });
      setIsStreaming(false);

      // Invalidate to sync with server
      queryClient.invalidateQueries({
        queryKey: ['pm-agent-chat', projectId, agentName]
      });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      setError(message);
      setIsStreaming(false);

      // Mark the last message as error
      setLocalMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (lastIdx >= 0 && updated[lastIdx].isStreaming) {
          updated[lastIdx] = {
            ...updated[lastIdx],
            content: message,
            isStreaming: false,
            error: true,
          };
        }
        return updated;
      });

      toast.error('Failed to send message', { description: message });
    },
  });

  /**
   * Send a message to the agent
   */
  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim()) return;
      sendMutation.mutate(content);
    },
    [sendMutation]
  );

  /**
   * Stop the current streaming response
   */
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);

    // Mark the last message as stopped
    setLocalMessages((prev) => {
      const updated = [...prev];
      const lastIdx = updated.length - 1;
      if (lastIdx >= 0 && updated[lastIdx].isStreaming) {
        updated[lastIdx] = {
          ...updated[lastIdx],
          content: updated[lastIdx].content || '(Response stopped)',
          isStreaming: false,
        };
      }
      return updated;
    });
  }, []);

  /**
   * Clear chat history
   */
  const clearHistory = useCallback(() => {
    setLocalMessages([]);
    const key = getChatStorageKey(projectId, agentName);
    localStorage.removeItem(key);
    queryClient.invalidateQueries({
      queryKey: ['pm-agent-chat', projectId, agentName]
    });
    toast.success('Chat history cleared');
  }, [projectId, agentName, queryClient]);

  /**
   * Retry the last failed message
   */
  const retryLastMessage = useCallback(() => {
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === 'user');

    if (lastUserMessage) {
      // Remove error message (ES2022 compatible - find last error index manually)
      setLocalMessages((prev) => {
        let lastErrorIdx = -1;
        for (let i = prev.length - 1; i >= 0; i--) {
          if (prev[i].error) {
            lastErrorIdx = i;
            break;
          }
        }
        if (lastErrorIdx !== -1) {
          return [...prev.slice(0, lastErrorIdx), ...prev.slice(lastErrorIdx + 1)];
        }
        return prev;
      });
      sendMessage(lastUserMessage.content);
    }
  }, [messages, sendMessage]);

  return {
    messages,
    isLoading,
    isStreaming,
    isError,
    error: error || (queryError instanceof Error ? queryError.message : null),
    sendMessage,
    stopStreaming,
    clearHistory,
    retryLastMessage,
  };
}
