/**
 * Dashboard Sync Hook
 *
 * Manages dashboard state synchronization with the server.
 * Handles auth-based restore, debounced sync on significant changes,
 * and WebSocket-based real-time synchronization across tabs/devices.
 *
 * Features:
 * - Restore state from server on authentication
 * - Debounced sync on significant state changes
 * - WebSocket state sync between browser tabs (DM-11.2)
 * - Reconnection recovery with full state request
 * - Graceful error handling
 *
 * Story: DM-11.1 - Redis State Persistence
 * Story: DM-11.2 - WebSocket State Synchronization
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSession } from '@/lib/auth-client';
import { useDashboardStateStore } from '@/stores/dashboard-state-store';
import { DM_CONSTANTS } from '@/lib/dm-constants';
import { useRealtime } from '@/lib/realtime/realtime-provider';
import {
  getStateSyncClient,
  type StateSyncCallback,
  type StateFullCallback,
} from '@/lib/realtime/state-sync-client';
import { createChange } from '@/lib/realtime/state-diff';

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
  /** Whether WebSocket is connected (DM-11.2) */
  wsConnected: boolean;
  /** Current state version (DM-11.2) */
  stateVersion: number;
}

/**
 * Dashboard Sync Hook
 *
 * Manages sync lifecycle:
 * - Restores from server on authentication
 * - Subscribes to significant state changes
 * - Debounces sync operations
 * - WebSocket state sync between tabs/devices (DM-11.2)
 *
 * @returns Sync state and manual control functions
 */
export function useDashboardSync(): UseDashboardSyncReturn {
  const { data: session, isPending } = useSession();
  const isAuthenticated = !isPending && !!session;
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousTimestampRef = useRef<number>(0);
  const hasRestoredRef = useRef<boolean>(false);

  // Realtime context for WebSocket (DM-11.2)
  const { socket, isConnected } = useRealtime();

  // Store selectors
  const isSyncing = useDashboardStateStore((state) => state.isSyncing);
  const lastSyncedAt = useDashboardStateStore((state) => state.lastSyncedAt);
  const syncError = useDashboardStateStore((state) => state.syncError);
  const syncToServer = useDashboardStateStore((state) => state.syncToServer);
  const restoreFromServer = useDashboardStateStore(
    (state) => state.restoreFromServer
  );
  const clearSyncError = useDashboardStateStore((state) => state.clearSyncError);

  // WebSocket sync selectors (DM-11.2)
  const wsConnected = useDashboardStateStore((state) => state.wsConnected);
  const stateVersion = useDashboardStateStore((state) => state.stateVersion);
  const setWsConnected = useDashboardStateStore((state) => state.setWsConnected);
  const applyRemoteUpdate = useDashboardStateStore(
    (state) => state.applyRemoteUpdate
  );
  const applyFullState = useDashboardStateStore((state) => state.applyFullState);
  // Note: incrementVersion is available for future use when local state changes need versioning
  // Currently, version changes are implicit in store updates

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

  // =========================================================================
  // WebSocket State Sync (DM-11.2)
  // =========================================================================

  // Connect to WebSocket state sync client
  // Note: stateVersion intentionally excluded from deps to prevent reconnection loops
  useEffect(() => {
    if (!isAuthenticated || !socket) {
      return;
    }

    const stateSyncClient = getStateSyncClient();

    // Connect to the socket (socket is non-null here after the check above)
    stateSyncClient.connect(socket);

    // Set initial version from current store state
    const currentVersion = useDashboardStateStore.getState().stateVersion;
    stateSyncClient.setLastKnownVersion(currentVersion);

    // Subscribe to sync events
    const handleSync: StateSyncCallback = (data) => {
      applyRemoteUpdate(data.path, data.value, data.version);
    };

    const handleFull: StateFullCallback = (data) => {
      applyFullState(data.state, data.version);
    };

    const unsubscribeSync = stateSyncClient.onSync(handleSync);
    const unsubscribeFull = stateSyncClient.onFull(handleFull);

    return () => {
      unsubscribeSync();
      unsubscribeFull();
      stateSyncClient.disconnect();
    };
  // Note: stateVersion intentionally excluded to prevent reconnection loops
  }, [isAuthenticated, socket, applyRemoteUpdate, applyFullState]);

  // Track WebSocket connection status
  useEffect(() => {
    setWsConnected(isConnected);
  }, [isConnected, setWsConnected]);

  // Emit local state changes via WebSocket
  // Depends on wsConnected state to properly re-subscribe when connection changes
  useEffect(() => {
    if (!isAuthenticated || !wsConnected) {
      return;
    }

    const stateSyncClient = getStateSyncClient();

    // Subscribe to local state changes and emit them
    const unsubscribe = useDashboardStateStore.subscribe(
      (state) => ({
        widgets: state.widgets,
        activeProject: state.activeProject,
        activeTasks: state.activeTasks,
        stateVersion: state.stateVersion,
      }),
      (current, previous) => {
        // Don't emit if version hasn't changed (means it's a remote update)
        if (current.stateVersion === previous.stateVersion) {
          return;
        }

        // Determine what changed
        if (current.widgets !== previous.widgets) {
          const change = createChange('widgets', current.widgets);
          stateSyncClient.emitChange(change, current.stateVersion);
        }
        if (current.activeProject !== previous.activeProject) {
          const change = createChange('activeProject', current.activeProject);
          stateSyncClient.emitChange(change, current.stateVersion);
        }
        if (current.activeTasks !== previous.activeTasks) {
          const change = createChange('activeTasks', current.activeTasks);
          stateSyncClient.emitChange(change, current.stateVersion);
        }
      },
      { equalityFn: Object.is }
    );

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, wsConnected]);

  return {
    isSyncing,
    lastSyncedAt,
    syncError,
    syncNow,
    restoreNow,
    clearError: clearSyncError,
    wsConnected,
    stateVersion,
  };
}

export default useDashboardSync;
