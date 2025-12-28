'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useRealtime,
  WS_EVENTS,
  PMAgentStreamStartPayload,
  PMAgentStreamChunkPayload,
  PMAgentStreamEndPayload,
  PMAgentTypingPayload,
  PMSuggestionEventPayload,
  PMSuggestionActionPayload,
  PMHealthUpdatePayload,
  PMHealthEventPayload,
} from '@/lib/realtime';

/**
 * Agent stream state for tracking active streams
 */
interface AgentStreamState {
  streamId: string;
  agentId: string;
  agentName: string;
  chatId: string;
  messageId: string;
  content: string;
  isStreaming: boolean;
  startedAt: Date;
}

/**
 * Agent typing state
 */
interface AgentTypingState {
  agentId: string;
  agentName: string;
  chatId: string;
  isTyping: boolean;
}

/**
 * useRealtimePMAgents - Real-time PM agent streaming and suggestions hook
 *
 * Subscribes to WebSocket PM agent events for:
 * - Agent response streaming (chat)
 * - Agent typing indicators
 * - Suggestion lifecycle events
 * - Health score updates
 *
 * @param projectId - The project ID to filter events
 * @see Story PM-12.6: Real-time Agent Features
 */
export function useRealtimePMAgents(projectId?: string) {
  const { subscribe, isConnected } = useRealtime();
  const queryClient = useQueryClient();

  // Track active agent streams
  const [activeStreams, setActiveStreams] = useState<Map<string, AgentStreamState>>(new Map());
  const [typingAgents, setTypingAgents] = useState<Map<string, AgentTypingState>>(new Map());

  // Refs for stream content accumulation
  const streamContentRef = useRef<Map<string, string>>(new Map());

  // ============================================
  // Agent Streaming Handlers
  // ============================================

  const handleStreamStart = useCallback(
    (payload: PMAgentStreamStartPayload) => {
      if (projectId && payload.projectId !== projectId) return;

      console.log('[Realtime] Agent stream start:', payload.agentName, payload.streamId);

      // Initialize stream state
      setActiveStreams((prev) => {
        const next = new Map(prev);
        next.set(payload.streamId, {
          streamId: payload.streamId,
          agentId: payload.agentId,
          agentName: payload.agentName,
          chatId: payload.chatId,
          messageId: payload.messageId,
          content: '',
          isStreaming: true,
          startedAt: new Date(),
        });
        return next;
      });

      // Initialize content accumulator
      streamContentRef.current.set(payload.streamId, '');
    },
    [projectId]
  );

  const handleStreamChunk = useCallback(
    (payload: PMAgentStreamChunkPayload) => {
      if (projectId && payload.projectId !== projectId) return;

      // Accumulate content
      const currentContent = streamContentRef.current.get(payload.streamId) || '';
      const newContent = currentContent + payload.content;
      streamContentRef.current.set(payload.streamId, newContent);

      // Update stream state with accumulated content
      setActiveStreams((prev) => {
        const stream = prev.get(payload.streamId);
        if (!stream) return prev;

        const next = new Map(prev);
        next.set(payload.streamId, {
          ...stream,
          content: newContent,
        });
        return next;
      });
    },
    [projectId]
  );

  const handleStreamEnd = useCallback(
    (payload: PMAgentStreamEndPayload) => {
      if (projectId && payload.projectId !== projectId) return;

      console.log('[Realtime] Agent stream end:', payload.agentName, payload.streamId, {
        durationMs: payload.durationMs,
        tokensUsed: payload.tokensUsed,
      });

      // Mark stream as completed
      setActiveStreams((prev) => {
        const next = new Map(prev);
        next.delete(payload.streamId);
        return next;
      });

      // Clean up content accumulator
      streamContentRef.current.delete(payload.streamId);

      // Invalidate chat messages to show the full message
      queryClient.invalidateQueries({ queryKey: ['pm-chat', payload.chatId] });
      queryClient.invalidateQueries({ queryKey: ['pm-agent-chat', payload.agentId] });
    },
    [projectId, queryClient]
  );

  const handleAgentTyping = useCallback(
    (payload: PMAgentTypingPayload) => {
      if (projectId && payload.projectId !== projectId) return;

      setTypingAgents((prev) => {
        const next = new Map(prev);
        if (payload.isTyping) {
          next.set(payload.agentId, {
            agentId: payload.agentId,
            agentName: payload.agentName,
            chatId: payload.chatId,
            isTyping: true,
          });
        } else {
          next.delete(payload.agentId);
        }
        return next;
      });
    },
    [projectId]
  );

  // ============================================
  // Suggestion Event Handlers
  // ============================================

  const handleSuggestionCreated = useCallback(
    (payload: PMSuggestionEventPayload) => {
      if (projectId && payload.projectId !== projectId) return;

      console.log('[Realtime] Suggestion created:', payload.id, payload.type);

      // Invalidate suggestions list
      queryClient.invalidateQueries({ queryKey: ['pm-suggestions', payload.projectId] });
      queryClient.invalidateQueries({ queryKey: ['pm-agent-suggestions', payload.agentId] });
    },
    [projectId, queryClient]
  );

  const handleSuggestionUpdated = useCallback(
    (payload: PMSuggestionEventPayload) => {
      if (projectId && payload.projectId !== projectId) return;

      console.log('[Realtime] Suggestion updated:', payload.id, payload.status);

      // Update specific suggestion in cache
      queryClient.setQueriesData(
        { queryKey: ['pm-suggestion', payload.id] },
        () => payload
      );

      // Invalidate suggestions list
      queryClient.invalidateQueries({ queryKey: ['pm-suggestions', payload.projectId] });
    },
    [projectId, queryClient]
  );

  const handleSuggestionAction = useCallback(
    (payload: PMSuggestionActionPayload) => {
      if (projectId && payload.projectId !== projectId) return;

      console.log('[Realtime] Suggestion action:', payload.id, payload.action, 'by', payload.actionBy);

      // Invalidate suggestions to reflect the action
      queryClient.invalidateQueries({ queryKey: ['pm-suggestions', payload.projectId] });
      queryClient.invalidateQueries({ queryKey: ['pm-suggestion', payload.id] });
    },
    [projectId, queryClient]
  );

  // ============================================
  // Health Event Handlers
  // ============================================

  const handleHealthUpdated = useCallback(
    (payload: PMHealthUpdatePayload) => {
      if (projectId && payload.projectId !== projectId) return;

      console.log('[Realtime] Health updated:', payload.projectName, {
        score: payload.score,
        previousScore: payload.previousScore,
        trend: payload.trend,
      });

      // Update health in cache
      queryClient.setQueriesData(
        { queryKey: ['pm-project-health', payload.projectId] },
        (old: unknown) => {
          if (!old) return old;
          return {
            ...old,
            score: payload.score,
            level: payload.level,
            trend: payload.trend,
            factors: payload.factors,
          };
        }
      );

      // Invalidate health queries
      queryClient.invalidateQueries({ queryKey: ['pm-project-health', payload.projectId] });
    },
    [projectId, queryClient]
  );

  const handleHealthAlert = useCallback(
    (payload: PMHealthEventPayload) => {
      if (projectId && payload.projectId !== projectId) return;

      console.log('[Realtime] Health alert:', payload.level, payload.projectName, payload.score);

      // Invalidate health queries
      queryClient.invalidateQueries({ queryKey: ['pm-project-health', payload.projectId] });
    },
    [projectId, queryClient]
  );

  // ============================================
  // Subscribe to Events
  // ============================================

  useEffect(() => {
    if (!isConnected) return;

    // Agent streaming events
    const unsubStreamStart = subscribe(WS_EVENTS.PM_AGENT_STREAM_START, handleStreamStart);
    const unsubStreamChunk = subscribe(WS_EVENTS.PM_AGENT_STREAM_CHUNK, handleStreamChunk);
    const unsubStreamEnd = subscribe(WS_EVENTS.PM_AGENT_STREAM_END, handleStreamEnd);
    const unsubTyping = subscribe(WS_EVENTS.PM_AGENT_TYPING, handleAgentTyping);

    // Suggestion events
    const unsubSuggestionCreated = subscribe(WS_EVENTS.PM_SUGGESTION_CREATED, handleSuggestionCreated);
    const unsubSuggestionUpdated = subscribe(WS_EVENTS.PM_SUGGESTION_UPDATED, handleSuggestionUpdated);
    const unsubSuggestionAccepted = subscribe(WS_EVENTS.PM_SUGGESTION_ACCEPTED, handleSuggestionAction);
    const unsubSuggestionRejected = subscribe(WS_EVENTS.PM_SUGGESTION_REJECTED, handleSuggestionAction);
    const unsubSuggestionSnoozed = subscribe(WS_EVENTS.PM_SUGGESTION_SNOOZED, handleSuggestionAction);

    // Health events
    const unsubHealthUpdated = subscribe(WS_EVENTS.PM_HEALTH_UPDATED, handleHealthUpdated);
    const unsubHealthCritical = subscribe(WS_EVENTS.PM_HEALTH_CRITICAL, handleHealthAlert);
    const unsubHealthWarning = subscribe(WS_EVENTS.PM_HEALTH_WARNING, handleHealthAlert);

    return () => {
      unsubStreamStart();
      unsubStreamChunk();
      unsubStreamEnd();
      unsubTyping();
      unsubSuggestionCreated();
      unsubSuggestionUpdated();
      unsubSuggestionAccepted();
      unsubSuggestionRejected();
      unsubSuggestionSnoozed();
      unsubHealthUpdated();
      unsubHealthCritical();
      unsubHealthWarning();
    };
  }, [
    isConnected,
    subscribe,
    handleStreamStart,
    handleStreamChunk,
    handleStreamEnd,
    handleAgentTyping,
    handleSuggestionCreated,
    handleSuggestionUpdated,
    handleSuggestionAction,
    handleHealthUpdated,
    handleHealthAlert,
  ]);

  // ============================================
  // Public API
  // ============================================

  /**
   * Get active stream for a specific chat
   */
  const getStreamForChat = useCallback(
    (chatId: string): AgentStreamState | undefined => {
      for (const stream of activeStreams.values()) {
        if (stream.chatId === chatId && stream.isStreaming) {
          return stream;
        }
      }
      return undefined;
    },
    [activeStreams]
  );

  /**
   * Check if any agent is typing in a chat
   */
  const isAgentTypingInChat = useCallback(
    (chatId: string): boolean => {
      for (const typing of typingAgents.values()) {
        if (typing.chatId === chatId && typing.isTyping) {
          return true;
        }
      }
      return false;
    },
    [typingAgents]
  );

  /**
   * Get typing agent info for a chat
   */
  const getTypingAgentForChat = useCallback(
    (chatId: string): AgentTypingState | undefined => {
      for (const typing of typingAgents.values()) {
        if (typing.chatId === chatId && typing.isTyping) {
          return typing;
        }
      }
      return undefined;
    },
    [typingAgents]
  );

  return {
    isConnected,
    // Streaming state
    activeStreams: Array.from(activeStreams.values()),
    typingAgents: Array.from(typingAgents.values()),
    // Helper functions
    getStreamForChat,
    isAgentTypingInChat,
    getTypingAgentForChat,
    // Stats
    hasActiveStreams: activeStreams.size > 0,
    activeStreamCount: activeStreams.size,
  };
}
