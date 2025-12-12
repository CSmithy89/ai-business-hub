'use client';

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtime, WS_EVENTS, ChatMessagePayload } from '@/lib/realtime';

/**
 * useRealtimeChat - Real-time chat message updates hook
 *
 * Subscribes to WebSocket chat events and integrates with React Query cache.
 * New messages appear in real-time without polling.
 *
 * @param chatId - Optional chat ID to filter messages
 *
 * @see Story 16-15: Implement WebSocket Real-Time Updates
 */
export function useRealtimeChat(chatId?: string) {
  const { subscribe, emit, isConnected } = useRealtime();
  const queryClient = useQueryClient();

  /**
   * Handle new chat message
   */
  const handleChatMessage = useCallback(
    (message: ChatMessagePayload) => {
      // Skip if filtering by chatId and message is for different chat
      if (chatId && message.chatId !== chatId) {
        return;
      }

      console.log('[Realtime] New chat message:', message.id, 'in chat:', message.chatId);

      // Add message to chat messages cache
      queryClient.setQueriesData(
        { queryKey: ['chat-messages', message.chatId] },
        (old: unknown) => {
          if (!old || typeof old !== 'object') return old;
          const data = old as { messages?: Array<{ id: string }> };
          if (!data.messages) return old;

          // Check if message already exists (avoid duplicates from optimistic updates)
          const exists = data.messages.some((m) => m.id === message.id);
          if (exists) return old;

          return {
            ...data,
            messages: [...data.messages, message],
          };
        }
      );

      // Invalidate chat list to update last message
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
    [chatId, queryClient]
  );

  /**
   * Send typing indicator start
   */
  const startTyping = useCallback(() => {
    if (chatId && isConnected) {
      emit('typing.start', { chatId });
    }
  }, [chatId, isConnected, emit]);

  /**
   * Send typing indicator stop
   */
  const stopTyping = useCallback(() => {
    if (chatId && isConnected) {
      emit('typing.stop', { chatId });
    }
  }, [chatId, isConnected, emit]);

  // Subscribe to chat events
  useEffect(() => {
    if (!isConnected) return;

    const unsub = subscribe(WS_EVENTS.CHAT_MESSAGE, handleChatMessage);

    return () => {
      unsub();
    };
  }, [isConnected, subscribe, handleChatMessage]);

  return {
    isConnected,
    startTyping,
    stopTyping,
  };
}
