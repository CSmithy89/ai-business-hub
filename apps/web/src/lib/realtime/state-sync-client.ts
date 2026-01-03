/**
 * State Sync Client
 *
 * Manages WebSocket-based dashboard state synchronization between
 * browser tabs and devices. Handles tab ID management, event
 * subscription, debouncing, and reconnection recovery.
 *
 * Story: DM-11.2 - WebSocket State Synchronization
 */

import type { Socket } from 'socket.io-client';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  DashboardStateUpdatePayload,
  DashboardStateSyncPayload,
  DashboardStateFullPayload,
  DashboardStateRequestPayload,
} from './types';
import { DM_CONSTANTS } from '@/lib/dm-constants';
import { StateChange } from './state-diff';

const { WS_SYNC } = DM_CONSTANTS;

/**
 * Generate a unique tab ID
 * Uses crypto.randomUUID if available, falls back to timestamp + random
 */
function generateTabId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Get or create the tab ID from sessionStorage
 * Each browser tab gets a unique ID that persists across page navigations
 * but not across tab close/reopen
 */
export function getTabId(): string {
  if (typeof window === 'undefined') {
    return 'ssr-tab-id';
  }

  const storageKey = WS_SYNC.TAB_ID_STORAGE_KEY;
  let tabId = sessionStorage.getItem(storageKey);

  if (!tabId) {
    tabId = generateTabId();
    sessionStorage.setItem(storageKey, tabId);
  }

  return tabId;
}

/**
 * Callback type for state sync events
 */
export type StateSyncCallback = (data: DashboardStateSyncPayload) => void;

/**
 * Callback type for full state recovery events
 */
export type StateFullCallback = (data: DashboardStateFullPayload) => void;

/**
 * Error types for state sync failures
 */
export type StateSyncErrorType = 'disconnected' | 'payload_too_large' | 'emit_failed';

/**
 * Error callback for sync failures
 */
export type StateSyncErrorCallback = (
  error: StateSyncErrorType,
  details: { path?: string; pendingCount?: number; payloadSize?: number }
) => void;

/**
 * State Sync Client class
 *
 * Manages the WebSocket connection for dashboard state synchronization.
 * Features:
 * - Tab ID management for filtering self-echoed events
 * - Debounced state updates (100ms)
 * - Full state recovery on reconnection
 * - Rate limiting awareness
 */
export class StateSyncClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private tabId: string;
  private syncCallbacks: Set<StateSyncCallback> = new Set();
  private fullCallbacks: Set<StateFullCallback> = new Set();
  private errorCallbacks: Set<StateSyncErrorCallback> = new Set();
  private debounceTimeout: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pendingChanges: StateChange[] = [];
  private lastKnownVersion = 0;
  private isConnected = false;

  constructor() {
    this.tabId = getTabId();
  }

  /**
   * Get the current tab ID
   */
  getTabId(): string {
    return this.tabId;
  }

  /**
   * Connect to the WebSocket for state sync
   *
   * @param socket - Socket.io client instance
   */
  connect(socket: Socket<ServerToClientEvents, ClientToServerEvents>): void {
    if (this.socket === socket) {
      return; // Already connected to this socket
    }

    // Disconnect from previous socket if any
    this.disconnect();

    this.socket = socket;

    // Subscribe to state sync events
    socket.on('dashboard.state.sync', this.handleSync);
    socket.on('dashboard.state.full', this.handleFull);

    // Track connection state
    socket.on('connect', this.handleConnect);
    socket.on('disconnect', this.handleDisconnect);

    // If already connected, handle as connected
    if (socket.connected) {
      this.handleConnect();
    }
  }

  /**
   * Disconnect from the WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.off('dashboard.state.sync', this.handleSync);
      this.socket.off('dashboard.state.full', this.handleFull);
      this.socket.off('connect', this.handleConnect);
      this.socket.off('disconnect', this.handleDisconnect);
      this.socket = null;
    }

    // Clear pending changes and timeouts
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.pendingChanges = [];
    this.isConnected = false;
  }

  /**
   * Handle connection established
   */
  private handleConnect = (): void => {
    this.isConnected = true;

    // Clear any pending reconnect timeout from previous connection attempt
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Request full state on reconnection if configured
    if (WS_SYNC.REQUEST_FULL_STATE_ON_RECONNECT) {
      // Small delay to ensure the server has processed the connection
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectTimeout = null;
        this.requestFullState();
      }, WS_SYNC.RECONNECT_RECOVERY_DELAY_MS);
    }
  };

  /**
   * Handle disconnection
   */
  private handleDisconnect = (): void => {
    this.isConnected = false;

    // Clear reconnect timeout to prevent stale state requests
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  };

  /**
   * Handle incoming state sync event
   */
  private handleSync = (data: DashboardStateSyncPayload): void => {
    // Filter out self-echoed events
    if (data.sourceTabId === this.tabId) {
      return;
    }

    // Update known version
    if (data.version > this.lastKnownVersion) {
      this.lastKnownVersion = data.version;
    }

    // Notify all callbacks
    for (const callback of this.syncCallbacks) {
      try {
        callback(data);
      } catch (error) {
        console.error('[StateSyncClient] Error in sync callback:', error);
      }
    }
  };

  /**
   * Handle incoming full state event
   */
  private handleFull = (data: DashboardStateFullPayload): void => {
    // Update known version
    this.lastKnownVersion = data.version;

    // Notify all callbacks
    for (const callback of this.fullCallbacks) {
      try {
        callback(data);
      } catch (error) {
        console.error('[StateSyncClient] Error in full callback:', error);
      }
    }
  };

  /**
   * Subscribe to state sync events
   *
   * @param callback - Function to call when a sync event is received
   * @returns Unsubscribe function
   */
  onSync(callback: StateSyncCallback): () => void {
    this.syncCallbacks.add(callback);
    return () => {
      this.syncCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to full state recovery events
   *
   * @param callback - Function to call when full state is received
   * @returns Unsubscribe function
   */
  onFull(callback: StateFullCallback): () => void {
    this.fullCallbacks.add(callback);
    return () => {
      this.fullCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to sync error events
   *
   * Use this to handle silent data loss scenarios like:
   * - Socket disconnection causing changes to be dropped
   * - Payloads too large to send
   *
   * @param callback - Function to call when a sync error occurs
   * @returns Unsubscribe function
   */
  onError(callback: StateSyncErrorCallback): () => void {
    this.errorCallbacks.add(callback);
    return () => {
      this.errorCallbacks.delete(callback);
    };
  }

  /**
   * Notify error callbacks
   */
  private notifyError(
    error: StateSyncErrorType,
    details: { path?: string; pendingCount?: number; payloadSize?: number }
  ): void {
    for (const callback of this.errorCallbacks) {
      try {
        callback(error, details);
      } catch (err) {
        console.error('[StateSyncClient] Error in error callback:', err);
      }
    }
  }

  /**
   * Emit a state change to the server
   * Changes are debounced and batched for efficiency
   *
   * @param change - The state change to emit
   * @param version - The current state version
   */
  emitChange(change: StateChange, version: number): void {
    // Add to pending changes
    this.pendingChanges.push(change);
    this.lastKnownVersion = version;

    // Clear existing debounce timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    // Set new debounce timeout
    this.debounceTimeout = setTimeout(() => {
      this.flushChanges(version);
    }, WS_SYNC.WS_DEBOUNCE_MS);
  }

  /**
   * Flush all pending changes to the server
   */
  private flushChanges(version: number): void {
    if (this.pendingChanges.length === 0) {
      return;
    }

    // If disconnected, drop pending changes and notify error
    // Note: Changes are intentionally dropped (not preserved) because:
    // 1. Reconnection triggers full state sync from server
    // 2. Local state is the source of truth until sync completes
    // 3. Preserving stale changes could cause conflicts on reconnect
    if (!this.socket?.connected) {
      console.warn(
        '[StateSyncClient] Socket disconnected, dropping',
        this.pendingChanges.length,
        'pending changes'
      );
      this.notifyError('disconnected', { pendingCount: this.pendingChanges.length });
      this.pendingChanges = [];
      return;
    }

    // Emit each change
    // In a real production system, you might want to batch these
    for (const change of this.pendingChanges) {
      const payload: DashboardStateUpdatePayload = {
        path: change.path,
        value: change.value,
        version,
        timestamp: new Date().toISOString(),
        sourceTabId: this.tabId,
      };

      // Check payload size
      const payloadSize = JSON.stringify(payload).length;
      if (payloadSize > WS_SYNC.MAX_PAYLOAD_SIZE) {
        console.warn(
          '[StateSyncClient] Payload too large, skipping:',
          change.path,
          payloadSize
        );
        this.notifyError('payload_too_large', { path: change.path, payloadSize });
        continue;
      }

      // Emit using the socket's emit method with proper typing
      (this.socket as unknown as { emit: (event: string, data: unknown) => void }).emit(
        'dashboard.state.update',
        payload
      );
    }

    this.pendingChanges = [];
    this.debounceTimeout = null;
  }

  /**
   * Request full state from the server
   * Called on reconnection to recover any missed updates
   */
  requestFullState(): void {
    if (!this.socket?.connected) {
      return;
    }

    const payload: DashboardStateRequestPayload = {
      lastKnownVersion: this.lastKnownVersion,
    };

    (this.socket as unknown as { emit: (event: string, data: unknown) => void }).emit(
      'dashboard.state.request',
      payload
    );
  }

  /**
   * Set the last known version
   * Should be called when local state is initialized
   *
   * @param version - The version number
   */
  setLastKnownVersion(version: number): void {
    this.lastKnownVersion = version;
  }

  /**
   * Check if connected to WebSocket
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): 'connected' | 'disconnected' | 'reconnecting' {
    if (!this.socket) {
      return 'disconnected';
    }
    if (this.socket.connected) {
      return 'connected';
    }
    return 'reconnecting';
  }
}

// Singleton instance for app-wide use
let stateSyncClientInstance: StateSyncClient | null = null;

/**
 * Get the singleton StateSyncClient instance
 */
export function getStateSyncClient(): StateSyncClient {
  if (!stateSyncClientInstance) {
    stateSyncClientInstance = new StateSyncClient();
  }
  return stateSyncClientInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetStateSyncClient(): void {
  if (stateSyncClientInstance) {
    stateSyncClientInstance.disconnect();
    stateSyncClientInstance = null;
  }
}
