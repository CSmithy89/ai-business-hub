/**
 * HITL (Human-in-the-Loop) Zustand Store
 *
 * Zustand store for tracking pending HITL requests and their status.
 * Uses subscribeWithSelector middleware for efficient re-renders.
 *
 * This store manages:
 * - Pending HITL requests awaiting user approval
 * - Request status tracking (pending, approved, rejected)
 * - Active request selection for UI focus
 *
 * @see docs/modules/bm-dm/stories/dm-05-2-frontend-hitl-handlers.md
 * Epic: DM-05 | Story: DM-05.2
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  HITLPendingRequest,
  HITLRequestStatus,
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
      });
    },

    reset: () => {
      set(createInitialState());
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
