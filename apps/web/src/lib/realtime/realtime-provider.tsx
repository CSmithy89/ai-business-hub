'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession, getCurrentSessionToken } from '@/lib/auth-client';
import { STORAGE_ACTIVE_WORKSPACE_ID } from '@/lib/storage-keys';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  RealtimeConnectionState,
  WS_EVENTS,
} from './types';

/**
 * Configuration for the realtime connection
 */
interface RealtimeConfig {
  /** WebSocket server URL */
  url: string;
  /** Maximum reconnection attempts */
  maxReconnectAttempts: number;
  /** Base delay for exponential backoff (ms) */
  reconnectBaseDelay: number;
  /** Maximum delay between reconnection attempts (ms) */
  reconnectMaxDelay: number;
}

const DEFAULT_CONFIG: RealtimeConfig = {
  url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  maxReconnectAttempts: 10,
  reconnectBaseDelay: 1000,
  reconnectMaxDelay: 30000,
};

/**
 * Client-side rate limiting configuration per event type
 * Limits: max emissions per window (in ms)
 */
const RATE_LIMITS: Record<string, { maxEmits: number; windowMs: number }> = {
  'typing.start': { maxEmits: 5, windowMs: 5000 },    // 5 per 5s
  'typing.stop': { maxEmits: 5, windowMs: 5000 },     // 5 per 5s
  'presence.update': { maxEmits: 3, windowMs: 10000 }, // 3 per 10s
  'room.join': { maxEmits: 5, windowMs: 60000 },       // 5 per minute
  'room.leave': { maxEmits: 5, windowMs: 60000 },      // 5 per minute
  'sync.request': { maxEmits: 3, windowMs: 30000 },    // 3 per 30s
};

/**
 * Simple sliding window rate limiter
 */
class RateLimiter {
  private windows: Map<string, number[]> = new Map();

  /**
   * Check if an event can be emitted
   * @returns true if allowed, false if rate limited
   */
  canEmit(event: string): boolean {
    const config = RATE_LIMITS[event];
    if (!config) return true; // No limit configured

    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get existing timestamps for this event
    const timestamps = this.windows.get(event) || [];

    // Filter out old timestamps
    const recentTimestamps = timestamps.filter((t) => t > windowStart);

    // Check if we're at the limit
    if (recentTimestamps.length >= config.maxEmits) {
      return false;
    }

    // Record this emission
    recentTimestamps.push(now);
    this.windows.set(event, recentTimestamps);

    return true;
  }

  /**
   * Clear all rate limit windows
   */
  clear(): void {
    this.windows.clear();
  }
}

/**
 * Realtime context value
 */
interface RealtimeContextValue {
  /** Socket connection instance */
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  /** Connection state */
  connectionState: RealtimeConnectionState;
  /** Whether connected to WebSocket */
  isConnected: boolean;
  /** Whether currently reconnecting */
  isReconnecting: boolean;
  /** Error message if connection failed */
  connectionError: string | null;
  /** Manually trigger reconnection */
  reconnect: () => void;
  /** Subscribe to an event */
  subscribe: <K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ) => () => void;
  /** Emit an event to server */
  emit: <K extends keyof ClientToServerEvents>(
    event: K,
    data: Parameters<ClientToServerEvents[K]>[0]
  ) => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

/**
 * RealtimeProvider - WebSocket Connection Provider
 *
 * Manages Socket.io connection with:
 * - JWT authentication via handshake
 * - Workspace room isolation
 * - Exponential backoff reconnection
 * - Connection state management
 * - Event subscription API
 *
 * @see Story 16-15: Implement WebSocket Real-Time Updates
 */
export function RealtimeProvider({
  children,
  config = DEFAULT_CONFIG,
}: {
  children: React.ReactNode;
  config?: Partial<RealtimeConfig>;
}) {
  const { data: session } = useSession();
  const mergedConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    [config]
  );

  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef(0);
  const rateLimiterRef = useRef<RateLimiter>(new RateLimiter());
  // Store session in ref to avoid circular dependency in callbacks
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const [connectionState, setConnectionState] = useState<RealtimeConnectionState>({
    status: 'disconnected',
    reconnectAttempt: 0,
    maxReconnectAttempts: mergedConfig.maxReconnectAttempts,
    lastConnectedAt: null,
    error: null,
  });

  /**
   * Calculate exponential backoff delay
   */
  const getReconnectDelay = useCallback(
    (attempt: number): number => {
      const delay = mergedConfig.reconnectBaseDelay * Math.pow(2, attempt);
      return Math.min(delay, mergedConfig.reconnectMaxDelay);
    },
    [mergedConfig.reconnectBaseDelay, mergedConfig.reconnectMaxDelay]
  );

  /**
   * Schedule reconnection with exponential backoff
   * Using a stable reference that doesn't change
   */
  const scheduleReconnectRef = useRef<() => void>(() => {});

  /**
   * Initialize socket connection
   * Using a stable reference that doesn't change
   */
  const initializeSocketRef = useRef<() => void>(() => {});

  // Define initializeSocket
  initializeSocketRef.current = () => {
    // Only connect on client side
    if (typeof window === 'undefined') return;

    const currentSession = sessionRef.current;

    // Don't connect if no session
    if (!currentSession?.user?.id) {
      setConnectionState((prev) => ({
        ...prev,
        status: 'disconnected',
        error: null,
      }));
      return;
    }

    // Clean up existing socket
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setConnectionState((prev) => ({
      ...prev,
      status: 'connecting',
      error: null,
    }));

    // Get workspace ID from session or local storage
    const workspaceId =
      (currentSession as { activeWorkspaceId?: string })?.activeWorkspaceId ||
      (currentSession.session as { activeWorkspaceId?: string })?.activeWorkspaceId ||
      localStorage.getItem(STORAGE_ACTIVE_WORKSPACE_ID) ||
      '';

    // Get session token for authentication
    // SECURITY: Token is validated server-side against session database
    const token = getCurrentSessionToken();
    if (!token) {
      console.warn('[Realtime] No session token available for WebSocket auth');
      setConnectionState((prev) => ({
        ...prev,
        status: 'disconnected',
        error: 'No session token',
      }));
      return;
    }

    // Create socket connection
    const socket = io(`${mergedConfig.url}/realtime`, {
      auth: {
        token, // Send token for server-side validation
        userId: currentSession.user.id,
        workspaceId,
        email: currentSession.user.email,
        sessionId: currentSession.session?.id,
      },
      transports: ['websocket', 'polling'],
      reconnection: false, // We handle reconnection manually for custom backoff
      timeout: 10000,
    }) as Socket<ServerToClientEvents, ClientToServerEvents>;

    // Connection handlers
    socket.on('connect', () => {
      reconnectAttemptRef.current = 0;
      setConnectionState({
        status: 'connected',
        reconnectAttempt: 0,
        maxReconnectAttempts: mergedConfig.maxReconnectAttempts,
        lastConnectedAt: new Date(),
        error: null,
      });
      console.log('[Realtime] Connected to WebSocket');
    });

    socket.on('disconnect', (reason) => {
      console.log('[Realtime] Disconnected:', reason);

      // Don't reconnect if manually disconnected
      if (reason === 'io client disconnect') {
        setConnectionState((prev) => ({
          ...prev,
          status: 'disconnected',
        }));
        return;
      }

      // Start reconnection
      scheduleReconnectRef.current();
    });

    socket.on('connect_error', (error) => {
      console.error('[Realtime] Connection error:', error.message);
      setConnectionState((prev) => ({
        ...prev,
        status: 'error',
        error: error.message,
      }));

      // Start reconnection
      scheduleReconnectRef.current();
    });

    // Handle connection status from server
    socket.on(
      WS_EVENTS.CONNECTION_STATUS as keyof ServerToClientEvents,
      (data: { status: string }) => {
        if (data.status === 'connected') {
          setConnectionState((prev) => ({
            ...prev,
            status: 'connected',
            error: null,
          }));
        }
      }
    );

    socketRef.current = socket;
  };

  // Define scheduleReconnect
  scheduleReconnectRef.current = () => {
    if (reconnectAttemptRef.current >= mergedConfig.maxReconnectAttempts) {
      setConnectionState((prev) => ({
        ...prev,
        status: 'error',
        error: 'Maximum reconnection attempts reached',
        reconnectAttempt: reconnectAttemptRef.current,
      }));
      return;
    }

    const delay = getReconnectDelay(reconnectAttemptRef.current);
    reconnectAttemptRef.current++;

    setConnectionState((prev) => ({
      ...prev,
      status: 'reconnecting',
      reconnectAttempt: reconnectAttemptRef.current,
      error: null,
    }));

    console.log(
      `[Realtime] Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current}/${mergedConfig.maxReconnectAttempts})`
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      initializeSocketRef.current();
    }, delay);
  };

  /**
   * Manual reconnection trigger
   */
  const reconnect = useCallback(() => {
    reconnectAttemptRef.current = 0;
    initializeSocketRef.current();
  }, []);

  /**
   * Subscribe to an event
   */
  const subscribe = useCallback(
    <K extends keyof ServerToClientEvents>(
      event: K,
      handler: ServerToClientEvents[K]
    ): (() => void) => {
      const socket = socketRef.current;
      if (!socket) {
        console.warn('[Realtime] Cannot subscribe - socket not connected');
        return () => {};
      }

      socket.on(event, handler as never);

      return () => {
        socket.off(event, handler as never);
      };
    },
    []
  );

  /**
   * Emit an event to server with client-side rate limiting
   */
  const emit = useCallback(
    <K extends keyof ClientToServerEvents>(
      event: K,
      data: Parameters<ClientToServerEvents[K]>[0]
    ) => {
      const socket = socketRef.current;
      if (!socket?.connected) {
        console.warn('[Realtime] Cannot emit - socket not connected');
        return;
      }

      // Check rate limit before emitting
      if (!rateLimiterRef.current.canEmit(event as string)) {
        console.warn(`[Realtime] Rate limited: ${event as string}`);
        return;
      }

      // Use type assertion to handle Socket.io typing complexity
      (socket as unknown as { emit: (event: string, data: unknown) => void }).emit(
        event as string,
        data
      );
    },
    []
  );

  // Initialize socket when session changes
  useEffect(() => {
    initializeSocketRef.current();

    // Capture ref values for cleanup
    const rateLimiter = rateLimiterRef.current;

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        // Remove all listeners before disconnect to prevent memory leaks
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      // Clear rate limiter on cleanup
      rateLimiter.clear();
    };
  }, [session?.user?.id]); // Only reinitialize when user ID changes

  // Memoize context value
  const contextValue = useMemo<RealtimeContextValue>(
    () => ({
      socket: socketRef.current,
      connectionState,
      isConnected: connectionState.status === 'connected',
      isReconnecting: connectionState.status === 'reconnecting',
      connectionError: connectionState.error,
      reconnect,
      subscribe,
      emit,
    }),
    [connectionState, reconnect, subscribe, emit]
  );

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
}

/**
 * Hook to access realtime context
 */
export function useRealtime(): RealtimeContextValue {
  const context = useContext(RealtimeContext);

  if (!context) {
    // Return a safe default for SSR or when provider is not mounted
    return {
      socket: null,
      connectionState: {
        status: 'disconnected',
        reconnectAttempt: 0,
        maxReconnectAttempts: 10,
        lastConnectedAt: null,
        error: null,
      },
      isConnected: false,
      isReconnecting: false,
      connectionError: null,
      reconnect: () => {},
      subscribe: () => () => {},
      emit: () => {},
    };
  }

  return context;
}

/**
 * Hook to check if realtime is available
 * Returns false during SSR or when provider is not mounted
 */
export function useRealtimeAvailable(): boolean {
  const context = useContext(RealtimeContext);
  return context !== null;
}
