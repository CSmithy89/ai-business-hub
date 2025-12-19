'use client';

import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRealtime } from '@/lib/realtime';
import { PresenceResponse, PresencePayload } from '@hyvve/shared';

/**
 * useProjectPresence - Query and subscribe to project presence updates
 *
 * Queries for active users in a project and subscribes to real-time
 * presence updates via WebSocket.
 *
 * @see Story PM-06.2: Presence Indicators
 */

export interface UseProjectPresenceOptions {
  projectId: string;
  enabled?: boolean;
}

export function useProjectPresence({
  projectId,
  enabled = true,
}: UseProjectPresenceOptions) {
  const queryClient = useQueryClient();
  const { subscribe, isConnected } = useRealtime();

  // Query for presence data
  const query = useQuery<PresenceResponse>({
    queryKey: ['projects', projectId, 'presence'],
    queryFn: async () => {
      const response = await fetch(`/api/pm/presence/projects/${projectId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch project presence');
      }

      return response.json();
    },
    enabled: enabled && !!projectId,
    refetchInterval: 60000, // Fallback refresh every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  /**
   * Handle presence joined event
   */
  const handlePresenceJoined = useCallback(
    (data: PresencePayload) => {
      if (data.projectId !== projectId) return;

      console.log('[Presence] User joined:', data.userName);

      // Invalidate query to refetch with new user
      queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'presence'],
      });
    },
    [projectId, queryClient]
  );

  /**
   * Handle presence left event
   */
  const handlePresenceLeft = useCallback(
    (data: PresencePayload) => {
      if (data.projectId !== projectId) return;

      console.log('[Presence] User left:', data.userName);

      // Invalidate query to refetch without user
      queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'presence'],
      });
    },
    [projectId, queryClient]
  );

  /**
   * Handle presence updated event
   */
  const handlePresenceUpdated = useCallback(
    (data: PresencePayload) => {
      if (data.projectId !== projectId) return;

      // Optimistically update cache with new location
      queryClient.setQueryData<PresenceResponse>(
        ['projects', projectId, 'presence'],
        (old) => {
          if (!old) return old;

          // Find user and update location
          const userIndex = old.users.findIndex((u) => u.userId === data.userId);

          if (userIndex === -1) {
            // User not in list - they just joined, add them
            return {
              users: [
                ...old.users,
                {
                  userId: data.userId,
                  userName: data.userName,
                  userAvatar: data.userAvatar,
                  location: {
                    page: data.page,
                    taskId: data.taskId,
                  },
                  lastSeen: data.timestamp,
                },
              ],
              total: old.total + 1,
            };
          }

          // Update existing user's location
          const updatedUsers = [...old.users];
          updatedUsers[userIndex] = {
            ...updatedUsers[userIndex],
            location: {
              page: data.page,
              taskId: data.taskId,
            },
            lastSeen: data.timestamp,
          };

          return {
            users: updatedUsers,
            total: old.total,
          };
        }
      );
    },
    [projectId, queryClient]
  );

  // Subscribe to presence WebSocket events
  useEffect(() => {
    if (!isConnected || !enabled) return;

    const unsubJoined = subscribe('pm.presence.joined', handlePresenceJoined);
    const unsubLeft = subscribe('pm.presence.left', handlePresenceLeft);
    const unsubUpdated = subscribe('pm.presence.updated', handlePresenceUpdated);

    return () => {
      unsubJoined();
      unsubLeft();
      unsubUpdated();
    };
  }, [
    isConnected,
    enabled,
    subscribe,
    handlePresenceJoined,
    handlePresenceLeft,
    handlePresenceUpdated,
  ]);

  return {
    ...query,
    isConnected,
  };
}
