/**
 * useApprovalEvents Hook
 *
 * React hook for subscribing to WebSocket approval events.
 * Updates the HITL store when approvals are resolved (approved/rejected).
 *
 * This hook:
 * - Subscribes to approval.updated events via WebSocket
 * - Filters for HITL-sourced approvals (sourceModule === 'hitl')
 * - Updates the HITL store when approvals are resolved
 * - Handles reconnection automatically
 *
 * @see docs/modules/bm-dm/stories/dm-05-3-approval-workflow-integration.md
 * Epic: DM-05 | Story: DM-05.3
 */
'use client';

import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useHITLStore } from '@/stores/hitl-store';
import { useRealtime, WS_EVENTS, ApprovalUpdatePayload } from '@/lib/realtime';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Return type for useApprovalEvents hook.
 */
export interface UseApprovalEventsReturn {
  /** Whether WebSocket is connected */
  isConnected: boolean;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * Hook to subscribe to WebSocket approval events.
 *
 * Listens for approval resolution events and updates the HITL store
 * when queued approvals are approved or rejected.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isConnected } = useApprovalEvents();
 *
 *   return (
 *     <div>
 *       {isConnected ? 'Connected' : 'Disconnected'}
 *     </div>
 *   );
 * }
 * ```
 */
export function useApprovalEvents(): UseApprovalEventsReturn {
  const { subscribe, isConnected } = useRealtime();
  const updateQueuedApproval = useHITLStore((s) => s.updateQueuedApproval);
  const getQueuedApproval = useHITLStore((s) => s.getQueuedApproval);

  /**
   * Handle approval updated events.
   *
   * Filters for HITL-sourced approvals and updates the store
   * when they are resolved.
   */
  const handleApprovalUpdated = useCallback(
    (update: ApprovalUpdatePayload) => {
      // Check if this is a resolution event (approved or rejected)
      const decision = update.decision;
      if (!decision || (decision !== 'approved' && decision !== 'rejected')) {
        return;
      }

      // Check if this approval is tracked in our store
      const queuedApproval = getQueuedApproval(update.id);
      if (!queuedApproval) {
        // Not a HITL queued approval, ignore
        return;
      }

      // Update the store with resolution
      updateQueuedApproval(update.id, {
        status: decision,
        resolvedAt: Date.now(),
        resolution: {
          action: decision,
          reason: update.decisionNotes,
          decidedById: update.decidedById,
        },
      });

      // Show toast notification
      if (decision === 'approved') {
        toast.success('Action approved', {
          description: `The "${queuedApproval.toolName.replace(/_/g, ' ')}" action has been approved.`,
        });
      } else {
        toast.info('Action rejected', {
          description: update.decisionNotes
            ? `Reason: ${update.decisionNotes}`
            : `The "${queuedApproval.toolName.replace(/_/g, ' ')}" action was rejected.`,
        });
      }
    },
    [getQueuedApproval, updateQueuedApproval]
  );

  // Subscribe to approval events
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    // Subscribe to approval updated events
    const unsubscribe = subscribe(WS_EVENTS.APPROVAL_UPDATED, handleApprovalUpdated);

    return () => {
      unsubscribe();
    };
  }, [isConnected, subscribe, handleApprovalUpdated]);

  return {
    isConnected,
  };
}

export default useApprovalEvents;
