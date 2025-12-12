'use client';

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useRealtime,
  WS_EVENTS,
  AgentStatusPayload,
  AgentRunPayload,
  AgentRunFailedPayload,
} from '@/lib/realtime';

/**
 * useRealtimeAgents - Real-time agent updates hook
 *
 * Subscribes to WebSocket agent events and integrates with React Query cache.
 * Updates agent status and activity in real-time.
 *
 * @see Story 16-15: Implement WebSocket Real-Time Updates
 */
export function useRealtimeAgents() {
  const { subscribe, isConnected } = useRealtime();
  const queryClient = useQueryClient();

  /**
   * Handle agent status changed
   */
  const handleAgentStatusChanged = useCallback(
    (status: AgentStatusPayload) => {
      console.log('[Realtime] Agent status changed:', status.agentId, status.status);

      // Update agent in agents list cache
      queryClient.setQueriesData(
        { queryKey: ['agents'] },
        (old: unknown) => {
          if (!old || typeof old !== 'object') return old;
          const data = old as { data?: Array<{ id: string; status?: string }> };
          if (!data.data) return old;

          return {
            ...data,
            data: data.data.map((agent) =>
              agent.id === status.agentId
                ? {
                    ...agent,
                    status: status.status,
                    lastActiveAt: status.lastActiveAt,
                    currentTask: status.currentTask,
                  }
                : agent
            ),
          };
        }
      );

      // Update individual agent query if cached
      queryClient.setQueriesData(
        { queryKey: ['agent', status.agentId] },
        (old: unknown) => {
          if (!old) return old;
          return {
            ...old,
            status: status.status,
            lastActiveAt: status.lastActiveAt,
            currentTask: status.currentTask,
          };
        }
      );
    },
    [queryClient]
  );

  /**
   * Handle agent run started
   */
  const handleAgentRunStarted = useCallback(
    (run: AgentRunPayload) => {
      console.log('[Realtime] Agent run started:', run.agentId, run.runId);

      // Invalidate activity feed to show new run
      queryClient.invalidateQueries({ queryKey: ['agent-activity'] });
      queryClient.invalidateQueries({ queryKey: ['agent-runs', run.agentId] });
    },
    [queryClient]
  );

  /**
   * Handle agent run completed
   */
  const handleAgentRunCompleted = useCallback(
    (run: AgentRunPayload) => {
      console.log('[Realtime] Agent run completed:', run.agentId, run.runId);

      // Invalidate activity feed and runs
      queryClient.invalidateQueries({ queryKey: ['agent-activity'] });
      queryClient.invalidateQueries({ queryKey: ['agent-runs', run.agentId] });

      // Update specific run if cached
      queryClient.setQueriesData(
        { queryKey: ['agent-run', run.runId] },
        (old: unknown) => {
          if (!old) return old;
          return {
            ...old,
            status: 'completed',
            output: run.output,
            durationMs: run.durationMs,
            tokensUsed: run.tokensUsed,
          };
        }
      );
    },
    [queryClient]
  );

  /**
   * Handle agent run failed
   */
  const handleAgentRunFailed = useCallback(
    (run: AgentRunFailedPayload) => {
      console.log('[Realtime] Agent run failed:', run.agentId, run.runId, run.error);

      // Invalidate activity feed and runs
      queryClient.invalidateQueries({ queryKey: ['agent-activity'] });
      queryClient.invalidateQueries({ queryKey: ['agent-runs', run.agentId] });

      // Update specific run if cached
      queryClient.setQueriesData(
        { queryKey: ['agent-run', run.runId] },
        (old: unknown) => {
          if (!old) return old;
          return {
            ...old,
            status: 'failed',
            error: run.error,
            errorCode: run.errorCode,
            durationMs: run.durationMs,
          };
        }
      );
    },
    [queryClient]
  );

  // Subscribe to agent events
  useEffect(() => {
    if (!isConnected) return;

    const unsubStatus = subscribe(WS_EVENTS.AGENT_STATUS_CHANGED, handleAgentStatusChanged);
    const unsubStarted = subscribe(WS_EVENTS.AGENT_RUN_STARTED, handleAgentRunStarted);
    const unsubCompleted = subscribe(WS_EVENTS.AGENT_RUN_COMPLETED, handleAgentRunCompleted);
    const unsubFailed = subscribe(WS_EVENTS.AGENT_RUN_FAILED, handleAgentRunFailed);

    return () => {
      unsubStatus();
      unsubStarted();
      unsubCompleted();
      unsubFailed();
    };
  }, [
    isConnected,
    subscribe,
    handleAgentStatusChanged,
    handleAgentRunStarted,
    handleAgentRunCompleted,
    handleAgentRunFailed,
  ]);

  return {
    isConnected,
  };
}
