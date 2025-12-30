/**
 * HITL (Human-in-the-Loop) Zustand Store
 *
 * Zustand store for tracking pending HITL requests and their status.
 * Uses subscribeWithSelector middleware for efficient re-renders.
 *
 * This store manages:
 * - Pending HITL requests awaiting user approval (inline)
 * - Request status tracking (pending, approved, rejected)
 * - Active request selection for UI focus
 * - Queued approvals in Foundation approval queue (DM-05.3)
 *
 * @see docs/modules/bm-dm/stories/dm-05-2-frontend-hitl-handlers.md
 * @see docs/modules/bm-dm/stories/dm-05-3-approval-workflow-integration.md
 * Epic: DM-05 | Stories: DM-05.2, DM-05.3
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  HITLPendingRequest,
  HITLRequestStatus,
  QueuedApproval,
} from '@/lib/hitl/types';

// =============================================================================
// STORE INTERFACE
// =============================================================================

/**
 * HITL Store State
 */
export interface HITLState {
  /** Map of pending HITL requests by request ID */
  pendingRequests: Map<string, HITLPendingRequest>;
  /** Currently active/focused request ID (if any) */
  activeRequestId: string | null;
  /** Timestamp of last state update */
  timestamp: number;
  /** Map of approvals queued to Foundation approval queue (DM-05.3) */
  queuedApprovals: Map<string, QueuedApproval>;
}

/**
 * HITL Store Actions
 */
export interface HITLActions {
  /**
   * Add a new pending HITL request.
   * @param request - The request to add
   */
  addPendingRequest: (request: HITLPendingRequest) => void;

  /**
   * Remove a pending request by ID.
   * @param requestId - The request ID to remove
   */
  removePendingRequest: (requestId: string) => void;

  /**
   * Update the status of a pending request.
   * @param requestId - The request ID to update
   * @param status - The new status
   */
  updateRequestStatus: (requestId: string, status: HITLRequestStatus) => void;

  /**
   * Set the currently active/focused request.
   * @param requestId - The request ID to set as active, or null to clear
   */
  setActiveRequest: (requestId: string | null) => void;

  /**
   * Get a specific pending request by ID.
   * @param requestId - The request ID
   * @returns The request or undefined
   */
  getRequest: (requestId: string) => HITLPendingRequest | undefined;

  /**
   * Get count of pending requests.
   * @returns Number of pending requests
   */
  getPendingCount: () => number;

  /**
   * Get all pending requests as an array.
   * @returns Array of pending requests
   */
  getPendingArray: () => HITLPendingRequest[];

  /**
   * Clear all pending requests.
   */
  clearAll: () => void;

  /**
   * Reset store to initial state.
   */
  reset: () => void;

  // =========================================================================
  // QUEUED APPROVALS ACTIONS (DM-05.3)
  // =========================================================================

  /**
   * Add a new queued approval (sent to Foundation approval queue).
   * @param approval - The queued approval to add
   */
  addQueuedApproval: (approval: QueuedApproval) => void;

  /**
   * Update a queued approval (e.g., when resolved).
   * @param approvalId - The approval ID to update
   * @param update - Partial update to apply
   */
  updateQueuedApproval: (
    approvalId: string,
    update: Partial<QueuedApproval>
  ) => void;

  /**
   * Remove a queued approval by ID.
   * @param approvalId - The approval ID to remove
   */
  removeQueuedApproval: (approvalId: string) => void;

  /**
   * Get a specific queued approval by ID.
   * @param approvalId - The approval ID
   * @returns The approval or undefined
   */
  getQueuedApproval: (approvalId: string) => QueuedApproval | undefined;

  /**
   * Get all queued approvals as an array.
   * @returns Array of queued approvals
   */
  getQueuedApprovalsArray: () => QueuedApproval[];

  /**
   * Get count of pending queued approvals.
   * @returns Number of pending queued approvals
   */
  getQueuedPendingCount: () => number;
}

/**
 * Complete HITL Store Interface
 */
export interface HITLStore extends HITLState, HITLActions {}

// =============================================================================
// INITIAL STATE
// =============================================================================

/**
 * Create initial HITL state.
 */
function createInitialState(): HITLState {
  return {
    pendingRequests: new Map(),
    activeRequestId: null,
    timestamp: Date.now(),
    queuedApprovals: new Map(),
  };
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

/**
 * HITL Store
 *
 * Uses subscribeWithSelector middleware for efficient re-renders.
 * Components can subscribe to specific state slices.
 */
export const useHITLStore = create<HITLStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    ...createInitialState(),

    // =========================================================================
    // ACTIONS
    // =========================================================================

    addPendingRequest: (request: HITLPendingRequest) => {
      set((state) => {
        const newRequests = new Map(state.pendingRequests);
        newRequests.set(request.requestId, request);
        return {
          pendingRequests: newRequests,
          timestamp: Date.now(),
        };
      });
    },

    removePendingRequest: (requestId: string) => {
      set((state) => {
        const newRequests = new Map(state.pendingRequests);
        newRequests.delete(requestId);
        return {
          pendingRequests: newRequests,
          // Clear active if this was the active request
          activeRequestId:
            state.activeRequestId === requestId ? null : state.activeRequestId,
          timestamp: Date.now(),
        };
      });
    },

    updateRequestStatus: (requestId: string, status: HITLRequestStatus) => {
      set((state) => {
        const request = state.pendingRequests.get(requestId);
        if (!request) {
          return state;
        }

        const newRequests = new Map(state.pendingRequests);
        newRequests.set(requestId, { ...request, status });

        return {
          pendingRequests: newRequests,
          timestamp: Date.now(),
        };
      });
    },

    setActiveRequest: (requestId: string | null) => {
      set({
        activeRequestId: requestId,
        timestamp: Date.now(),
      });
    },

    getRequest: (requestId: string) => {
      return get().pendingRequests.get(requestId);
    },

    getPendingCount: () => {
      const requests = get().pendingRequests;
      let count = 0;
      requests.forEach((req) => {
        if (req.status === 'pending') {
          count++;
        }
      });
      return count;
    },

    getPendingArray: () => {
      return Array.from(get().pendingRequests.values());
    },

    clearAll: () => {
      set({
        pendingRequests: new Map(),
        activeRequestId: null,
        timestamp: Date.now(),
        queuedApprovals: new Map(),
      });
    },

    reset: () => {
      set(createInitialState());
    },

    // =========================================================================
    // QUEUED APPROVALS ACTIONS (DM-05.3)
    // =========================================================================

    addQueuedApproval: (approval: QueuedApproval) => {
      set((state) => {
        const newApprovals = new Map(state.queuedApprovals);
        newApprovals.set(approval.approvalId, approval);
        return {
          queuedApprovals: newApprovals,
          timestamp: Date.now(),
        };
      });
    },

    updateQueuedApproval: (approvalId: string, update: Partial<QueuedApproval>) => {
      set((state) => {
        const approval = state.queuedApprovals.get(approvalId);
        if (!approval) {
          return state;
        }

        const newApprovals = new Map(state.queuedApprovals);
        newApprovals.set(approvalId, { ...approval, ...update });

        return {
          queuedApprovals: newApprovals,
          timestamp: Date.now(),
        };
      });
    },

    removeQueuedApproval: (approvalId: string) => {
      set((state) => {
        const newApprovals = new Map(state.queuedApprovals);
        newApprovals.delete(approvalId);
        return {
          queuedApprovals: newApprovals,
          timestamp: Date.now(),
        };
      });
    },

    getQueuedApproval: (approvalId: string) => {
      return get().queuedApprovals.get(approvalId);
    },

    getQueuedApprovalsArray: () => {
      return Array.from(get().queuedApprovals.values());
    },

    getQueuedPendingCount: () => {
      const approvals = get().queuedApprovals;
      let count = 0;
      approvals.forEach((approval) => {
        if (approval.status === 'pending') {
          count++;
        }
      });
      return count;
    },
  }))
);

// =============================================================================
// SELECTORS (for use outside of components)
// =============================================================================

/**
 * Get all pending requests as an array.
 */
export const selectPendingRequests = (state: HITLStore): HITLPendingRequest[] =>
  Array.from(state.pendingRequests.values());

/**
 * Get only requests with 'pending' status.
 */
export const selectOnlyPending = (state: HITLStore): HITLPendingRequest[] =>
  Array.from(state.pendingRequests.values()).filter((r) => r.status === 'pending');

/**
 * Get count of pending requests.
 */
export const selectPendingCount = (state: HITLStore): number =>
  Array.from(state.pendingRequests.values()).filter((r) => r.status === 'pending')
    .length;

/**
 * Get the currently active request.
 */
export const selectActiveRequest = (
  state: HITLStore
): HITLPendingRequest | undefined =>
  state.activeRequestId
    ? state.pendingRequests.get(state.activeRequestId)
    : undefined;

/**
 * Check if there are any pending requests.
 */
export const selectHasPending = (state: HITLStore): boolean =>
  Array.from(state.pendingRequests.values()).some((r) => r.status === 'pending');

// =============================================================================
// HOOKS FOR COMMON SELECTORS
// =============================================================================

/**
 * Hook to get all pending requests.
 */
export function usePendingRequests(): HITLPendingRequest[] {
  return useHITLStore(selectPendingRequests);
}

/**
 * Hook to get only requests with 'pending' status.
 */
export function useOnlyPending(): HITLPendingRequest[] {
  return useHITLStore(selectOnlyPending);
}

/**
 * Hook to get count of pending requests.
 */
export function usePendingCount(): number {
  return useHITLStore(selectPendingCount);
}

/**
 * Hook to get the currently active request.
 */
export function useActiveRequest(): HITLPendingRequest | undefined {
  return useHITLStore(selectActiveRequest);
}

/**
 * Hook to check if there are any pending requests.
 */
export function useHasPending(): boolean {
  return useHITLStore(selectHasPending);
}

/**
 * Hook to get HITL store actions.
 */
export function useHITLActions(): Pick<
  HITLStore,
  | 'addPendingRequest'
  | 'removePendingRequest'
  | 'updateRequestStatus'
  | 'setActiveRequest'
  | 'clearAll'
> {
  return useHITLStore((state) => ({
    addPendingRequest: state.addPendingRequest,
    removePendingRequest: state.removePendingRequest,
    updateRequestStatus: state.updateRequestStatus,
    setActiveRequest: state.setActiveRequest,
    clearAll: state.clearAll,
  }));
}

// =============================================================================
// QUEUED APPROVALS SELECTORS (DM-05.3)
// =============================================================================

/**
 * Get all queued approvals as an array.
 */
export const selectQueuedApprovals = (state: HITLStore): QueuedApproval[] =>
  Array.from(state.queuedApprovals.values());

/**
 * Get only approvals with 'pending' status.
 */
export const selectOnlyPendingQueued = (state: HITLStore): QueuedApproval[] =>
  Array.from(state.queuedApprovals.values()).filter((a) => a.status === 'pending');

/**
 * Get count of pending queued approvals.
 */
export const selectQueuedPendingCount = (state: HITLStore): number =>
  Array.from(state.queuedApprovals.values()).filter((a) => a.status === 'pending')
    .length;

/**
 * Check if there are any pending queued approvals.
 */
export const selectHasQueuedPending = (state: HITLStore): boolean =>
  Array.from(state.queuedApprovals.values()).some((a) => a.status === 'pending');

// =============================================================================
// QUEUED APPROVALS HOOKS (DM-05.3)
// =============================================================================

/**
 * Hook to get all queued approvals.
 */
export function useQueuedApprovals(): QueuedApproval[] {
  return useHITLStore(selectQueuedApprovals);
}

/**
 * Hook to get only pending queued approvals.
 */
export function useOnlyPendingQueued(): QueuedApproval[] {
  return useHITLStore(selectOnlyPendingQueued);
}

/**
 * Hook to get count of pending queued approvals.
 */
export function useQueuedPendingCount(): number {
  return useHITLStore(selectQueuedPendingCount);
}

/**
 * Hook to check if there are any pending queued approvals.
 */
export function useHasQueuedPending(): boolean {
  return useHITLStore(selectHasQueuedPending);
}

/**
 * Hook to get queued approval actions.
 */
export function useQueuedApprovalActions(): Pick<
  HITLStore,
  | 'addQueuedApproval'
  | 'updateQueuedApproval'
  | 'removeQueuedApproval'
> {
  return useHITLStore((state) => ({
    addQueuedApproval: state.addQueuedApproval,
    updateQueuedApproval: state.updateQueuedApproval,
    removeQueuedApproval: state.removeQueuedApproval,
  }));
}
