'use client';

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRealtime, WS_EVENTS, NotificationPayload } from '@/lib/realtime';

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
   */
  const handleNewNotification = useCallback(
    (notification: NotificationPayload) => {
      console.log('[Realtime] New notification:', notification.id, notification.type);

      // Add to notifications cache
      queryClient.setQueriesData(
        { queryKey: ['notifications'] },
        (old: unknown) => {
          if (!old || typeof old !== 'object') return old;
          const data = old as { data?: Array<{ id: string }> };
          if (!data.data) return old;

          // Add new notification at the beginning
          return {
            ...data,
            data: [notification, ...data.data],
          };
        }
      );

      // Update unread count
      queryClient.setQueriesData(
        { queryKey: ['notifications', 'unread-count'] },
        (old: unknown) => {
          if (typeof old === 'number') {
            return old + 1;
          }
          return old;
        }
      );

      // Show toast notification based on severity
      const toastConfig = {
        description: notification.message,
        action: notification.actionUrl
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
 */
export function useNotificationBadge() {
  const queryClient = useQueryClient();
  const { isConnected } = useRealtime();

  // Get current count from cache (or return 0 if not available)
  const getUnreadCount = useCallback(() => {
    const data = queryClient.getQueryData<number>(['notifications', 'unread-count']);
    return data ?? 0;
  }, [queryClient]);

  return {
    unreadCount: getUnreadCount(),
    isConnected,
  };
}
