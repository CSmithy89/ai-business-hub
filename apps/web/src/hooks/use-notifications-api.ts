/**
 * Notification API Hook
 *
 * React Query hooks for notification center API.
 * Provides infinite scroll, unread count, and mutation operations.
 *
 * @see Story PM-06.5: In-App Notifications
 */

'use client';

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  NotificationListResponse,
  UnreadCountResponse,
  MarkReadResponse,
  BulkOperationResponse,
  NotificationDto,
} from '@hyvve/shared';

const API_BASE = '/api/pm/notifications';

// ============================================
// API Functions
// ============================================

async function fetchNotifications(
  page: number,
  workspaceId?: string,
): Promise<NotificationListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: '20',
  });

  if (workspaceId) {
    params.append('workspaceId', workspaceId);
  }

  const response = await fetch(`${API_BASE}?${params.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }

  return response.json();
}

async function fetchUnreadCount(workspaceId?: string): Promise<UnreadCountResponse> {
  const params = new URLSearchParams();
  if (workspaceId) {
    params.append('workspaceId', workspaceId);
  }

  const url = params.toString()
    ? `${API_BASE}/unread-count?${params.toString()}`
    : `${API_BASE}/unread-count`;

  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch unread count');
  }

  return response.json();
}

async function markAsRead(notificationId: string): Promise<MarkReadResponse> {
  const response = await fetch(`${API_BASE}/${notificationId}/read`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to mark notification as read');
  }

  return response.json();
}

async function markAllAsRead(workspaceId?: string): Promise<BulkOperationResponse> {
  const params = new URLSearchParams();
  if (workspaceId) {
    params.append('workspaceId', workspaceId);
  }

  const url = params.toString()
    ? `${API_BASE}/read-all?${params.toString()}`
    : `${API_BASE}/read-all`;

  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to mark all as read');
  }

  return response.json();
}

async function deleteNotification(notificationId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/${notificationId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to delete notification');
  }

  return response.json();
}

// ============================================
// React Query Hooks
// ============================================

/**
 * Infinite query hook for notifications list
 * Supports pagination with automatic next page loading
 */
export function useNotificationsInfinite(workspaceId?: string) {
  return useInfiniteQuery({
    queryKey: ['notifications', workspaceId],
    queryFn: ({ pageParam }) => fetchNotifications(pageParam, workspaceId),
    getNextPageParam: (lastPage) => {
      return lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Query hook for unread notification count
 * Automatically refetches every 60 seconds as fallback if WebSocket drops
 */
export function useUnreadCount(workspaceId?: string) {
  return useQuery({
    queryKey: ['notifications', workspaceId, 'unread-count'],
    queryFn: () => fetchUnreadCount(workspaceId),
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchInterval: 60000, // Refetch every 60 seconds (fallback for WebSocket)
    refetchOnWindowFocus: true,
  });
}

/**
 * Mutation hook to mark a single notification as read
 * Includes optimistic updates for instant feedback
 */
export function useMarkAsRead(workspaceId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsRead,

    // Optimistic update
    onMutate: async (notificationId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['notifications', workspaceId] });

      // Snapshot previous value
      const previous = queryClient.getQueryData(['notifications', workspaceId]);

      // Optimistically update notification list
      queryClient.setQueryData(['notifications', workspaceId], (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        const data = old as {
          pages?: Array<{ data: NotificationDto[]; meta: unknown }>;
          pageParams?: unknown[];
        };

        if (!data.pages) return old;

        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            data: page.data.map((n) =>
              n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n,
            ),
          })),
        };
      });

      return { previous };
    },

    // Rollback on error
    onError: (_err, _notificationId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications', workspaceId], context.previous);
      }
    },

    // Refetch on success
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', workspaceId, 'unread-count'] });
    },
  });
}

/**
 * Mutation hook to mark all notifications as read
 */
export function useMarkAllAsRead(workspaceId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllAsRead(workspaceId),

    onSuccess: () => {
      // Invalidate both notification list and unread count
      queryClient.invalidateQueries({ queryKey: ['notifications', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', workspaceId, 'unread-count'] });
    },
  });
}

/**
 * Mutation hook to delete a notification
 */
export function useDeleteNotification(workspaceId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,

    // Optimistic update
    onMutate: async (notificationId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['notifications', workspaceId] });

      // Snapshot previous value
      const previous = queryClient.getQueryData(['notifications', workspaceId]);

      // Optimistically remove notification from list
      queryClient.setQueryData(['notifications', workspaceId], (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        const data = old as {
          pages?: Array<{ data: NotificationDto[]; meta: unknown }>;
          pageParams?: unknown[];
        };

        if (!data.pages) return old;

        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            data: page.data.filter((n) => n.id !== notificationId),
          })),
        };
      });

      return { previous };
    },

    // Rollback on error
    onError: (_err, _notificationId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications', workspaceId], context.previous);
      }
    },

    // Refetch on success
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', workspaceId, 'unread-count'] });
    },
  });
}
