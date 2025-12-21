'use client';

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRealtime, WS_EVENTS, NotificationPayload } from '@/lib/realtime';

/**
 * Validate that a URL is safe for navigation (prevents open redirects)
 * Only allows relative paths or same-origin URLs
 */
function isValidActionUrl(url: string): boolean {
  // Allow relative paths that start with /
  if (url.startsWith('/') && !url.startsWith('//')) {
    return true;
  }

  // Validate absolute URLs are same-origin
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.origin === window.location.origin;
  } catch {
    return false;
  }
}

/**
 * useRealtimeNotifications - Real-time notification updates hook
 *
 * Subscribes to WebSocket notification events and:
 * 1. Updates React Query cache with new notifications
 * 2. Shows toast notifications for important events
 * 3. Updates notification badge count
 *
 * @see Story 16-15: Implement WebSocket Real-Time Updates
 */
export function useRealtimeNotifications() {
  const { subscribe, isConnected } = useRealtime();
  const queryClient = useQueryClient();

  /**
   * Handle new notification
   * Invalidates queries for all workspaces to ensure all notification lists update
   */
  const handleNewNotification = useCallback(
    (notification: NotificationPayload) => {
      console.log('[Realtime] New notification:', notification.id, notification.type);

      // Invalidate notification queries to trigger refetch
      // This works with the infinite query structure from use-notifications-api
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      // Show toast notification based on severity
      // Only show action button if URL is valid (prevents open redirect attacks)
      const hasValidAction = notification.actionUrl && isValidActionUrl(notification.actionUrl);

      const toastConfig = {
        description: notification.message,
        action: hasValidAction
          ? {
              label: notification.actionLabel || 'View',
              onClick: () => {
                window.location.href = notification.actionUrl!;
              },
            }
          : undefined,
      };

      switch (notification.severity) {
        case 'success':
          toast.success(notification.title, toastConfig);
          break;
        case 'warning':
          toast.warning(notification.title, toastConfig);
          break;
        case 'error':
          toast.error(notification.title, toastConfig);
          break;
        case 'info':
        default:
          toast.info(notification.title, toastConfig);
      }
    },
    [queryClient]
  );

  // Subscribe to notification events
  useEffect(() => {
    if (!isConnected) return;

    const unsub = subscribe(WS_EVENTS.NOTIFICATION_NEW, handleNewNotification);

    return () => {
      unsub();
    };
  }, [isConnected, subscribe, handleNewNotification]);

  return {
    isConnected,
  };
}

/**
 * useNotificationBadge - Hook for notification badge count
 *
 * Returns the current unread notification count, updated in real-time.
 * Note: This hook is deprecated. Use useUnreadCount from use-notifications-api instead.
 *
 * @deprecated Use useUnreadCount from use-notifications-api
 */
export function useNotificationBadge(workspaceId?: string) {
  const queryClient = useQueryClient();
  const { isConnected } = useRealtime();

  // Get current count from cache (or return 0 if not available)
  const getUnreadCount = useCallback(() => {
    const data = queryClient.getQueryData<{ count: number }>([
      'notifications',
      workspaceId,
      'unread-count',
    ]);
    return data?.count ?? 0;
  }, [queryClient, workspaceId]);

  return {
    unreadCount: getUnreadCount(),
    isConnected,
  };
}
