'use client';

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtime, WS_EVENTS, ApprovalEventPayload, ApprovalUpdatePayload } from '@/lib/realtime';

/**
 * useRealtimeApprovals - Real-time approval updates hook
 *
 * Subscribes to WebSocket approval events and integrates with React Query cache.
 * When approval events are received, the cache is updated to reflect changes immediately.
 *
 * @see Story 16-15: Implement WebSocket Real-Time Updates
 */
export function useRealtimeApprovals() {
  const { subscribe, isConnected } = useRealtime();
  const queryClient = useQueryClient();

  /**
   * Handle new approval created
   */
  const handleApprovalCreated = useCallback(
    (approval: ApprovalEventPayload) => {
      console.log('[Realtime] Approval created:', approval.id);

      // Invalidate approvals query to refetch with new item
      queryClient.invalidateQueries({ queryKey: ['approvals'] });

      // Optionally, we could optimistically add to cache:
      // queryClient.setQueryData(['approvals', filters], (old) => {
      //   return old ? { ...old, data: [approval, ...old.data] } : old;
      // });
    },
    [queryClient]
  );

  /**
   * Handle approval updated
   */
  const handleApprovalUpdated = useCallback(
    (update: ApprovalUpdatePayload) => {
      console.log('[Realtime] Approval updated:', update.id);

      // Update specific approval in cache
      queryClient.setQueriesData(
        { queryKey: ['approvals'] },
        (old: unknown) => {
          if (!old || typeof old !== 'object') return old;
          const data = old as { data?: Array<{ id: string }> };
          if (!data.data) return old;

          return {
            ...data,
            data: data.data.map((item) =>
              item.id === update.id ? { ...item, ...update } : item
            ),
          };
        }
      );

      // Also update individual approval query if cached
      queryClient.setQueriesData(
        { queryKey: ['approval', update.id] },
        (old: unknown) => {
          if (!old) return old;
          return { ...old, ...update };
        }
      );
    },
    [queryClient]
  );

  /**
   * Handle approval deleted
   */
  const handleApprovalDeleted = useCallback(
    (data: { id: string }) => {
      console.log('[Realtime] Approval deleted:', data.id);

      // Remove from cache
      queryClient.setQueriesData(
        { queryKey: ['approvals'] },
        (old: unknown) => {
          if (!old || typeof old !== 'object') return old;
          const approvalData = old as { data?: Array<{ id: string }> };
          if (!approvalData.data) return old;

          return {
            ...approvalData,
            data: approvalData.data.filter((item) => item.id !== data.id),
          };
        }
      );

      // Remove individual approval query
      queryClient.removeQueries({ queryKey: ['approval', data.id] });
    },
    [queryClient]
  );

  // Subscribe to approval events
  useEffect(() => {
    if (!isConnected) return;

    const unsubCreated = subscribe(WS_EVENTS.APPROVAL_CREATED, handleApprovalCreated);
    const unsubUpdated = subscribe(WS_EVENTS.APPROVAL_UPDATED, handleApprovalUpdated);
    const unsubDeleted = subscribe(WS_EVENTS.APPROVAL_DELETED, handleApprovalDeleted);

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubDeleted();
    };
  }, [isConnected, subscribe, handleApprovalCreated, handleApprovalUpdated, handleApprovalDeleted]);

  return {
    isConnected,
  };
}
