'use client';

/**
 * Agent State Sync Hook
 *
 * Bridges CopilotKit's useCoAgentStateRender with our Zustand store.
 * Automatically syncs agent state emissions to the dashboard state with
 * debouncing to prevent UI thrashing.
 *
 * Features:
 * - Debounced state updates (100ms default) to prevent rapid re-renders
 * - Stale state detection (compares timestamps)
 * - Loading state updates bypass debounce for immediate UI feedback
 * - State validation using Zod schemas from DM-04.1
 * - Debug logging in development mode
 *
 * @see docs/modules/bm-dm/epics/epic-dm-04-tech-spec.md
 * Epic: DM-04 | Story: DM-04.2
 */

import { useEffect, useCallback, useRef } from 'react';
import { useCoAgentStateRender } from '@copilotkit/react-core';
import { useDashboardStateStore } from '@/stores/dashboard-state-store';
import {
  validateDashboardState,
  type DashboardState,
} from '@/lib/schemas/dashboard-state';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Agent name for state subscription */
export const DASHBOARD_AGENT_NAME = 'dashboard_gateway';

/** Default debounce interval for state updates (ms) */
export const UPDATE_DEBOUNCE_MS = 100;

// =============================================================================
// TYPES
// =============================================================================

/**
 * Options for the useAgentStateSync hook
 */
export interface UseAgentStateSyncOptions {
  /** Enable debug logging (default: false) */
  debug?: boolean;
  /** Custom debounce interval in milliseconds (default: 100) */
  debounceMs?: number;
  /** Agent name to subscribe to (default: 'dashboard_gateway') */
  agentName?: string;
}

/**
 * Return type for useAgentStateSync hook
 */
export interface UseAgentStateSyncResult {
  /** Whether state sync is currently active */
  isActive: boolean;
  /** Last successful sync timestamp */
  lastSyncTimestamp: number | null;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * Hook to sync agent state with dashboard store.
 *
 * This hook subscribes to agent state updates via CopilotKit's useCoAgentStateRender
 * and bridges them to the Zustand dashboard state store with debouncing.
 *
 * @example
 * ```tsx
 * function DashboardPage() {
 *   useAgentStateSync();
 *   // Dashboard state is now automatically synced from agent
 *   return <DashboardContent />;
 * }
 *
 * // With options
 * function DashboardPageDebug() {
 *   useAgentStateSync({
 *     debug: process.env.NODE_ENV === 'development',
 *     debounceMs: 200,
 *   });
 *   return <DashboardContent />;
 * }
 * ```
 */
export function useAgentStateSync(
  options: UseAgentStateSyncOptions = {}
): UseAgentStateSyncResult {
  const {
    debug = false,
    debounceMs = UPDATE_DEBOUNCE_MS,
    agentName = DASHBOARD_AGENT_NAME,
  } = options;

  // Store actions
  const setFullState = useDashboardStateStore((s) => s.setFullState);
  const setLoading = useDashboardStateStore((s) => s.setLoading);

  // Refs for debouncing and stale state detection
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastState = useRef<DashboardState | null>(null);
  const lastSyncTimestamp = useRef<number | null>(null);
  const isActive = useRef(false);

  /**
   * State update handler with debouncing
   * Validates incoming state and schedules debounced update
   */
  const handleStateUpdate = useCallback(
    (newState: unknown) => {
      if (debug) {
        console.log('[AgentStateSync] Received state update:', newState);
      }

      // Validate incoming state using Zod schema
      const validated = validateDashboardState(newState);
      if (!validated) {
        console.warn('[AgentStateSync] Invalid state received, ignoring');
        return;
      }

      // Clear existing debounce timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Schedule debounced state update
      debounceTimer.current = setTimeout(() => {
        // Check for stale state (skip if timestamp is older or equal)
        if (
          lastState.current &&
          validated.timestamp <= lastState.current.timestamp
        ) {
          if (debug) {
            console.log(
              '[AgentStateSync] Skipping stale state update:',
              validated.timestamp,
              '<=',
              lastState.current.timestamp
            );
          }
          return;
        }

        // Update state
        lastState.current = validated;
        lastSyncTimestamp.current = Date.now();
        setFullState(validated);

        if (debug) {
          console.log(
            '[AgentStateSync] State updated:',
            validated.timestamp,
            'synced at:',
            lastSyncTimestamp.current
          );
        }
      }, debounceMs);
    },
    [setFullState, debug, debounceMs]
  );

  /**
   * Handle loading state updates (bypass debounce for immediate feedback)
   */
  const handleLoadingUpdate = useCallback(
    (isLoading: boolean, agents: string[] = []) => {
      if (debug) {
        console.log('[AgentStateSync] Loading state:', isLoading, agents);
      }
      // Loading updates bypass debounce for immediate UI feedback
      setLoading(isLoading, agents);
    },
    [setLoading, debug]
  );

  // Subscribe to agent state via CopilotKit
  useCoAgentStateRender({
    name: agentName,
    render: ({ state, status }) => {
      isActive.current = true;

      // Handle loading state immediately (no debounce)
      if (status === 'inProgress') {
        handleLoadingUpdate(true, [agentName]);
      } else if (status === 'complete' || status === 'idle') {
        handleLoadingUpdate(false);
      }

      // Handle state updates with debouncing
      if (state) {
        handleStateUpdate(state);
      }

      // This hook doesn't render anything - it just syncs state
      return null;
    },
  });

  // Cleanup refs on unmount to free memory
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      // Free memory held by refs
      lastState.current = null;
      lastSyncTimestamp.current = null;
      isActive.current = false;
    };
  }, []);

  return {
    isActive: isActive.current,
    lastSyncTimestamp: lastSyncTimestamp.current,
  };
}

/**
 * Convenience hook that combines state sync with a selector.
 *
 * Initializes state sync and returns a typed state slice.
 *
 * @example
 * ```tsx
 * function MyWidget() {
 *   const status = useAgentStateWidget((state) => state.widgets.projectStatus);
 *   return status ? <ProjectCard {...status} /> : null;
 * }
 * ```
 */
export function useAgentStateWidget<T>(
  selector: (state: DashboardState) => T
): T | null {
  // Initialize state sync
  useAgentStateSync();

  // Get the current dashboard state and select the slice
  const store = useDashboardStateStore();

  // Build a DashboardState-compatible object from the store
  const dashboardState: DashboardState = {
    version: store.version,
    timestamp: store.timestamp,
    activeProject: store.activeProject,
    workspaceId: store.workspaceId,
    userId: store.userId,
    widgets: store.widgets,
    loading: store.loading,
    errors: store.errors,
    activeTasks: store.activeTasks,
  };

  return selector(dashboardState);
}
