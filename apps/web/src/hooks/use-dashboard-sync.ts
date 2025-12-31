/**
 * Dashboard Sync Hook
 *
 * Manages dashboard state synchronization with the server.
 * Handles auth-based restore and debounced sync on significant changes.
 *
 * Features:
 * - Restore state from server on authentication
 * - Debounced sync on significant state changes
 * - Graceful error handling
 *
 * Story: DM-11.1 - Redis State Persistence
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSession } from '@/lib/auth-client';
import { useDashboardStateStore } from '@/stores/dashboard-state-store';
import { DM_CONSTANTS } from '@/lib/dm-constants';

const { SYNC_DEBOUNCE_MS, RESTORE_ON_AUTH, SIGNIFICANT_CHANGE_PATHS } =
  DM_CONSTANTS.STATE_SYNC;

/**
 * Hook return type
 */
export interface UseDashboardSyncReturn {
  /** Whether sync is in progress */
  isSyncing: boolean;
  /** Timestamp of last successful sync */
  lastSyncedAt: number | null;
  /** Error from last sync attempt */
  syncError: string | null;
  /** Manually trigger sync to server */
  syncNow: () => Promise<void>;
  /** Manually restore from server */
  restoreNow: () => Promise<boolean>;
  /** Clear sync error */
  clearError: () => void;
}

/**
 * Dashboard Sync Hook
 *
 * Manages sync lifecycle:
 * - Restores from server on authentication
 * - Subscribes to significant state changes
 * - Debounces sync operations
 *
 * @returns Sync state and manual control functions
 */
export function useDashboardSync(): UseDashboardSyncReturn {
  const { data: session, isPending } = useSession();
  const isAuthenticated = !isPending && !!session;
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousTimestampRef = useRef<number>(0);
  const hasRestoredRef = useRef<boolean>(false);

  // Store selectors
  const isSyncing = useDashboardStateStore((state) => state.isSyncing);
  const lastSyncedAt = useDashboardStateStore((state) => state.lastSyncedAt);
  const syncError = useDashboardStateStore((state) => state.syncError);
  const syncToServer = useDashboardStateStore((state) => state.syncToServer);
  const restoreFromServer = useDashboardStateStore(
    (state) => state.restoreFromServer
  );
  const clearSyncError = useDashboardStateStore((state) => state.clearSyncError);

  // Manual sync function
  const syncNow = useCallback(async () => {
    // Clear any pending debounced sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    await syncToServer();
  }, [syncToServer]);

  // Manual restore function
  const restoreNow = useCallback(async () => {
    return restoreFromServer();
  }, [restoreFromServer]);

  // Restore from server on authentication
  useEffect(() => {
    if (!RESTORE_ON_AUTH) {
      return;
    }

    if (isAuthenticated && !hasRestoredRef.current) {
      hasRestoredRef.current = true;
      restoreFromServer().then((success) => {
        if (success) {
          console.debug('[useDashboardSync] Restored state from server');
        }
      });
    }

    // Reset restore flag on logout
    if (!isAuthenticated && !isPending) {
      hasRestoredRef.current = false;
    }
  }, [isAuthenticated, isPending, restoreFromServer]);

  // Subscribe to state changes and debounce sync
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Subscribe to state changes
    const unsubscribe = useDashboardStateStore.subscribe(
      (state) => ({
        timestamp: state.timestamp,
        widgets: state.widgets,
        activeProject: state.activeProject,
        activeTasks: state.activeTasks,
      }),
      (current, previous) => {
        // Skip if this is the first render or no significant change
        if (previousTimestampRef.current === 0) {
          previousTimestampRef.current = current.timestamp;
          return;
        }

        // Check if this is a significant change
        const isSignificant = SIGNIFICANT_CHANGE_PATHS.some((path) => {
          const currentValue = current[path as keyof typeof current];
          const previousValue = previous[path as keyof typeof previous];
          return currentValue !== previousValue;
        });

        if (!isSignificant) {
          return;
        }

        // Clear any existing timeout
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }

        // Debounce the sync
        syncTimeoutRef.current = setTimeout(() => {
          syncToServer();
          syncTimeoutRef.current = null;
        }, SYNC_DEBOUNCE_MS);
      },
      { equalityFn: Object.is }
    );

    // Cleanup
    return () => {
      unsubscribe();
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
    };
  }, [isAuthenticated, syncToServer]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    isSyncing,
    lastSyncedAt,
    syncError,
    syncNow,
    restoreNow,
    clearError: clearSyncError,
  };
}

export default useDashboardSync;
