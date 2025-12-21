'use client';

import { useEffect, useRef } from 'react';
import { useRealtime } from '@/lib/realtime';

/**
 * usePresence - Track user presence in a project
 *
 * Sends presence heartbeat every 30 seconds to indicate user is active.
 * Updates location when page changes.
 * Cleans up on unmount.
 *
 * Includes reconnection protection to prevent duplicate updates during
 * rapid WebSocket reconnects (1-second debounce).
 *
 * @see Story PM-06.2: Presence Indicators
 */

export interface UsePresenceOptions {
  projectId: string;
  page: 'overview' | 'tasks' | 'settings' | 'docs';
  taskId?: string;
  enabled?: boolean; // Allow disabling presence tracking
}

// Minimum interval between presence updates (milliseconds)
const DEBOUNCE_MS = 1000;

export function usePresence({
  projectId,
  page,
  taskId,
  enabled = true,
}: UsePresenceOptions) {
  const { emit, isConnected } = useRealtime();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef({ projectId, page, taskId });
  const lastUpdateTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isConnected || !enabled) {
      return;
    }

    // Helper function to send presence update with debounce protection
    const sendPresence = (force = false) => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

      // Skip if update was sent too recently (unless forced for heartbeat)
      if (!force && timeSinceLastUpdate < DEBOUNCE_MS) {
        return;
      }

      try {
        emit('pm.presence.update', {
          projectId,
          taskId,
          page,
        });
        lastUpdateTimeRef.current = now;
      } catch (error) {
        console.error('[Presence] Failed to send presence update:', error);
      }
    };

    // Send initial presence update
    sendPresence();

    // Set up 30-second heartbeat interval (force update)
    intervalRef.current = setInterval(() => sendPresence(true), 30000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [emit, isConnected, projectId, page, taskId, enabled]);

  // Send update when location changes (page or taskId)
  useEffect(() => {
    if (!isConnected || !enabled) {
      return;
    }

    const lastLocation = lastLocationRef.current;
    const locationChanged =
      lastLocation.projectId !== projectId ||
      lastLocation.page !== page ||
      lastLocation.taskId !== taskId;

    if (locationChanged) {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

      // Check debounce (location changes should still respect debounce)
      if (timeSinceLastUpdate < DEBOUNCE_MS) {
        return;
      }

      try {
        emit('pm.presence.update', {
          projectId,
          taskId,
          page,
        });
        lastUpdateTimeRef.current = now;

        // Update last location
        lastLocationRef.current = { projectId, page, taskId };
      } catch (error) {
        console.error('[Presence] Failed to send location update:', error);
      }
    }
  }, [emit, isConnected, projectId, page, taskId, enabled]);

  return {
    isTracking: isConnected && enabled,
  };
}
