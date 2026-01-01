/**
 * State Persistence Hook
 *
 * Persists dashboard state to browser localStorage for session continuity.
 * Provides state restoration on page refresh, stale state detection,
 * and cross-tab synchronization via BroadcastChannel API.
 *
 * Features:
 * - Debounced localStorage saves (1 second default)
 * - State restoration on mount
 * - Stale state detection (>24 hours TTL)
 * - Cross-tab sync via BroadcastChannel
 * - SSR-safe (typeof window checks)
 * - Selective persistence (excludes loading/error states)
 * - State validation using Zod schemas from DM-04.1
 *
 * @see docs/modules/bm-dm/epics/epic-dm-04-tech-spec.md
 * Epic: DM-04 | Story: DM-04.5
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useDashboardStateStore } from '@/stores/dashboard-state-store';
import {
  validateDashboardState,
  STATE_VERSION,
  type DashboardState,
} from '@/lib/schemas/dashboard-state';
import {
  STORAGE_DASHBOARD_STATE,
  STORAGE_DASHBOARD_STATE_VERSION,
  STORAGE_DASHBOARD_STATE_COMPRESSED,
} from '@/lib/storage-keys';
import {
  compressIfNeeded,
  decompressIfNeeded,
  CompressionError,
} from '@/lib/storage/compression';
import { useAgentStateSync } from './use-agent-state-sync';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Default debounce interval for saving state (ms) */
export const PERSISTENCE_DEBOUNCE_MS = 1000;

/** State TTL in milliseconds (24 hours) */
export const STATE_TTL_MS = 24 * 60 * 60 * 1000;

/** BroadcastChannel name for cross-tab sync */
export const BROADCAST_CHANNEL_NAME = 'hyvve-dashboard-state-sync';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Options for the useStatePersistence hook
 */
export interface UseStatePersistenceOptions {
  /** Enable persistence (default: true) */
  enabled?: boolean;
  /** Storage key override (default: STORAGE_DASHBOARD_STATE) */
  storageKey?: string;
  /** Debounce interval in milliseconds (default: 1000) */
  debounceMs?: number;
  /** Enable cross-tab sync via BroadcastChannel (default: true) */
  enableCrossTabSync?: boolean;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

/**
 * Return type for useStatePersistence hook
 */
export interface UseStatePersistenceResult {
  /** Whether persistence is enabled and initialized */
  isInitialized: boolean;
  /** Clear all persisted state */
  clearPersistedState: () => void;
  /** Force save current state immediately */
  forceSave: () => void;
}

/**
 * Message structure for cross-tab sync
 */
interface CrossTabMessage {
  type: 'state_update' | 'state_cleared';
  timestamp: number;
  senderId: string;
  state?: DashboardState;
}

/** Unique ID for this tab to prevent echo loops (generated lazily for SSR safety) */
let _tabId: string | null = null;
function getTabId(): string {
  if (_tabId === null && typeof window !== 'undefined') {
    _tabId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2);
  }
  return _tabId || 'ssr-placeholder';
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * Hook to persist dashboard state to localStorage.
 *
 * Automatically saves state changes with debouncing and restores
 * state on page load if within the TTL window (24 hours).
 *
 * @example
 * ```tsx
 * function DashboardPage() {
 *   useStatePersistence();
 *   // State is now persisted to localStorage
 *   return <Dashboard />;
 * }
 *
 * // With options
 * function DashboardPageDebug() {
 *   useStatePersistence({
 *     debug: true,
 *     debounceMs: 2000,
 *   });
 *   return <Dashboard />;
 * }
 * ```
 */
export function useStatePersistence(
  options: UseStatePersistenceOptions = {}
): UseStatePersistenceResult {
  const {
    enabled = true,
    storageKey = STORAGE_DASHBOARD_STATE,
    debounceMs = PERSISTENCE_DEBOUNCE_MS,
    enableCrossTabSync = true,
    debug = false,
  } = options;

  // Store access
  const setFullState = useDashboardStateStore((s) => s.setFullState);

  // Get current state for saving
  const getCurrentState = useCallback(() => {
    const state = useDashboardStateStore.getState();
    return {
      version: state.version,
      timestamp: state.timestamp,
      activeProject: state.activeProject,
      workspaceId: state.workspaceId,
      userId: state.userId,
      widgets: state.widgets,
      loading: state.loading,
      errors: state.errors,
    } as DashboardState;
  }, []);

  // Refs for tracking state
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isInitialized = useRef(false);
  const broadcastChannel = useRef<BroadcastChannel | null>(null);
  const lastSavedTimestamp = useRef<number>(0);

  /**
   * Log helper with consistent prefix
   */
  const log = useCallback(
    (message: string, ...args: unknown[]) => {
      if (debug) {
        console.log(`[StatePersistence] ${message}`, ...args);
      }
    },
    [debug]
  );

  /**
   * Save state to localStorage with automatic compression.
   * Compression is applied when state exceeds 50KB threshold.
   */
  const saveState = useCallback(
    (state: DashboardState) => {
      if (typeof window === 'undefined') return;

      try {
        // Create state to save, excluding transient data
        const stateToSave: DashboardState = {
          version: state.version,
          timestamp: state.timestamp,
          activeProject: state.activeProject,
          workspaceId: state.workspaceId,
          userId: state.userId,
          widgets: state.widgets,
          // Reset transient state - don't persist loading/error states
          loading: { isLoading: false, loadingAgents: [] },
          errors: {},
          // Don't persist active tasks - they are transient runtime state
          activeTasks: [],
        };

        const stateJson = JSON.stringify(stateToSave);

        // Compress if needed (threshold: 50KB)
        const { data: dataToStore, compressed, metrics } = compressIfNeeded(stateJson);

        localStorage.setItem(storageKey, dataToStore);
        localStorage.setItem(STORAGE_DASHBOARD_STATE_VERSION, String(STATE_VERSION));

        // Store compression marker for decompression on load
        if (compressed) {
          localStorage.setItem(STORAGE_DASHBOARD_STATE_COMPRESSED, 'true');
          log('State saved (compressed):', {
            originalSize: `${(metrics.originalSize / 1024).toFixed(2)} KB`,
            compressedSize: `${(metrics.compressedSize / 1024).toFixed(2)} KB`,
            ratio: metrics.compressionRatio.toFixed(2),
          });
        } else {
          localStorage.removeItem(STORAGE_DASHBOARD_STATE_COMPRESSED);
          log('State saved:', new Date(state.timestamp).toISOString());
        }

        lastSavedTimestamp.current = state.timestamp;

        // Notify other tabs if cross-tab sync is enabled
        if (enableCrossTabSync && broadcastChannel.current) {
          const message: CrossTabMessage = {
            type: 'state_update',
            timestamp: state.timestamp,
            senderId: getTabId(),
            state: stateToSave,
          };
          broadcastChannel.current.postMessage(message);
          log('Cross-tab sync: broadcasted update');
        }
      } catch (e) {
        console.warn('[StatePersistence] Failed to save state:', e);
        // Handle quota exceeded error gracefully
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          console.warn('[StatePersistence] localStorage quota exceeded, clearing old state');
          try {
            localStorage.removeItem(storageKey);
            localStorage.removeItem(STORAGE_DASHBOARD_STATE_COMPRESSED);
          } catch {
            // Ignore cleanup errors
          }
        }
      }
    },
    [storageKey, enableCrossTabSync, log]
  );

  /**
   * Force save current state immediately (bypass debounce)
   */
  const forceSave = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    const state = getCurrentState();
    saveState(state);
  }, [getCurrentState, saveState]);

  /**
   * Clear persisted state from localStorage
   */
  const clearPersistedState = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(STORAGE_DASHBOARD_STATE_VERSION);
      localStorage.removeItem(STORAGE_DASHBOARD_STATE_COMPRESSED);
      log('Persisted state cleared');

      // Notify other tabs
      if (enableCrossTabSync && broadcastChannel.current) {
        const message: CrossTabMessage = {
          type: 'state_cleared',
          timestamp: Date.now(),
          senderId: getTabId(),
        };
        broadcastChannel.current.postMessage(message);
      }
    } catch (e) {
      console.warn('[StatePersistence] Failed to clear state:', e);
    }
  }, [storageKey, enableCrossTabSync, log]);

  /**
   * Load state from localStorage with automatic decompression.
   */
  const loadState = useCallback((): DashboardState | null => {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) {
        log('No persisted state found');
        return null;
      }

      // Check if data was compressed and decompress if needed
      const isCompressed = localStorage.getItem(STORAGE_DASHBOARD_STATE_COMPRESSED) === 'true';
      let jsonString: string;

      try {
        jsonString = decompressIfNeeded(stored, isCompressed);
        if (isCompressed) {
          log('State decompressed successfully');
        }
      } catch (decompressError) {
        // Handle compression error - data may be corrupted
        if (decompressError instanceof CompressionError) {
          console.error('[StatePersistence] Corrupted compressed data, clearing state');
          localStorage.removeItem(storageKey);
          localStorage.removeItem(STORAGE_DASHBOARD_STATE_VERSION);
          localStorage.removeItem(STORAGE_DASHBOARD_STATE_COMPRESSED);
          return null;
        }
        throw decompressError;
      }

      const parsed = JSON.parse(jsonString);
      const validated = validateDashboardState(parsed);

      if (!validated) {
        log('Invalid persisted state, removing');
        localStorage.removeItem(storageKey);
        localStorage.removeItem(STORAGE_DASHBOARD_STATE_COMPRESSED);
        return null;
      }

      // Check for stale state (older than TTL)
      const age = Date.now() - validated.timestamp;
      if (age > STATE_TTL_MS) {
        log('Stale state detected (age:', Math.floor(age / 1000 / 60), 'minutes), removing');
        localStorage.removeItem(storageKey);
        localStorage.removeItem(STORAGE_DASHBOARD_STATE_COMPRESSED);
        return null;
      }

      // Check for version mismatch
      const storedVersion = localStorage.getItem(STORAGE_DASHBOARD_STATE_VERSION);
      if (storedVersion && parseInt(storedVersion, 10) !== STATE_VERSION) {
        log('State version mismatch, removing (stored:', storedVersion, ', current:', STATE_VERSION, ')');
        localStorage.removeItem(storageKey);
        localStorage.removeItem(STORAGE_DASHBOARD_STATE_VERSION);
        localStorage.removeItem(STORAGE_DASHBOARD_STATE_COMPRESSED);
        return null;
      }

      log('Restored state from localStorage (age:', Math.floor(age / 1000), 'seconds)');
      return validated;
    } catch (e) {
      console.warn('[StatePersistence] Failed to load state:', e);
      try {
        localStorage.removeItem(storageKey);
        localStorage.removeItem(STORAGE_DASHBOARD_STATE_COMPRESSED);
      } catch {
        // Ignore cleanup errors
      }
      return null;
    }
  }, [storageKey, log]);

  /**
   * Handle cross-tab messages
   */
  const handleCrossTabMessage = useCallback(
    (event: MessageEvent<CrossTabMessage>) => {
      const { type, timestamp, senderId, state } = event.data;

      // Ignore messages from our own tab (prevent echo loops)
      if (senderId === getTabId()) {
        return;
      }

      if (type === 'state_update' && state) {
        // Only apply if newer than our last saved state
        if (timestamp > lastSavedTimestamp.current) {
          log('Cross-tab sync: received update from other tab');
          const validated = validateDashboardState(state);
          if (validated) {
            setFullState(validated);
            lastSavedTimestamp.current = timestamp;
          }
        } else {
          log('Cross-tab sync: ignoring stale update');
        }
      } else if (type === 'state_cleared') {
        log('Cross-tab sync: state cleared in other tab');
        // Don't clear local store, just acknowledge
      }
    },
    [setFullState, log]
  );

  // Initialize persistence on mount
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Load persisted state on mount
    const restoredState = loadState();
    if (restoredState) {
      setFullState(restoredState);
      lastSavedTimestamp.current = restoredState.timestamp;
    }

    // Setup cross-tab sync via BroadcastChannel
    if (enableCrossTabSync && typeof BroadcastChannel !== 'undefined') {
      try {
        broadcastChannel.current = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        broadcastChannel.current.addEventListener('message', handleCrossTabMessage);
        log('Cross-tab sync enabled via BroadcastChannel');
      } catch (e) {
        console.warn('[StatePersistence] BroadcastChannel not supported:', e);
      }
    }

    isInitialized.current = true;
    log('Initialized');

    // Cleanup
    return () => {
      if (broadcastChannel.current) {
        broadcastChannel.current.removeEventListener('message', handleCrossTabMessage);
        broadcastChannel.current.close();
        broadcastChannel.current = null;
      }
    };
  }, [enabled, enableCrossTabSync, loadState, setFullState, handleCrossTabMessage, log]);

  // Subscribe to state changes and save with debouncing
  useEffect(() => {
    if (!enabled || !isInitialized.current || typeof window === 'undefined') {
      return;
    }

    // Subscribe to store changes
    const unsubscribe = useDashboardStateStore.subscribe(
      (state) => ({
        timestamp: state.timestamp,
        widgets: state.widgets,
        activeProject: state.activeProject,
      }),
      (newSlice) => {
        // Skip if we just restored state (avoid saving immediately after restore)
        if (newSlice.timestamp === lastSavedTimestamp.current) {
          return;
        }

        // Clear existing debounce timer
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }

        // Schedule debounced save
        debounceTimer.current = setTimeout(() => {
          const currentState = getCurrentState();
          saveState(currentState);
        }, debounceMs);
      }
    );

    // Cleanup
    return () => {
      unsubscribe();
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    };
  }, [enabled, debounceMs, getCurrentState, saveState]);

  return {
    isInitialized: isInitialized.current,
    clearPersistedState,
    forceSave,
  };
}

// =============================================================================
// STANDALONE UTILITIES
// =============================================================================

/**
 * Clear persisted dashboard state from localStorage.
 *
 * Useful for logout flows or manual cleanup.
 *
 * @param storageKey - Optional storage key override
 *
 * @example
 * ```tsx
 * // In logout handler
 * async function handleLogout() {
 *   clearPersistedDashboardState();
 *   await signOut();
 * }
 * ```
 */
export function clearPersistedDashboardState(
  storageKey: string = STORAGE_DASHBOARD_STATE
): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(STORAGE_DASHBOARD_STATE_VERSION);
    localStorage.removeItem(STORAGE_DASHBOARD_STATE_COMPRESSED);

    // Notify other tabs
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      const message: CrossTabMessage = {
        type: 'state_cleared',
        timestamp: Date.now(),
        senderId: getTabId(),
      };
      channel.postMessage(message);
      channel.close();
    }
  } catch (e) {
    console.warn('[StatePersistence] Failed to clear state:', e);
  }
}

/**
 * Check if persisted dashboard state exists and is valid.
 *
 * @param storageKey - Optional storage key override
 * @returns True if valid state exists within TTL
 *
 * @example
 * ```tsx
 * if (hasPersistedDashboardState()) {
 *   console.log('Will restore previous session');
 * }
 * ```
 */
export function hasPersistedDashboardState(
  storageKey: string = STORAGE_DASHBOARD_STATE
): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return false;

    const parsed = JSON.parse(stored);
    const validated = validateDashboardState(parsed);
    if (!validated) return false;

    // Check TTL
    const age = Date.now() - validated.timestamp;
    return age <= STATE_TTL_MS;
  } catch {
    return false;
  }
}

// =============================================================================
// COMBINED HOOK (Integration with Agent State Sync)
// =============================================================================

/**
 * Combined hook that integrates state persistence with agent state sync.
 *
 * Use this hook in the dashboard to get both:
 * 1. Agent state synchronization (from DM-04.2)
 * 2. State persistence for session continuity (DM-04.5)
 *
 * Load order:
 * 1. localStorage first (immediate restore)
 * 2. Then agent state updates override as they arrive
 *
 * @example
 * ```tsx
 * function DashboardPage() {
 *   useDashboardStateWithPersistence();
 *   return <Dashboard />;
 * }
 * ```
 */
export function useDashboardStateWithPersistence(
  options: UseStatePersistenceOptions = {}
) {
  // Initialize persistence first (restores from localStorage)
  const persistence = useStatePersistence(options);

  // Then enable agent state sync (will override with fresh data)
  useAgentStateSync({
    debug: options.debug,
  });

  return persistence;
}
