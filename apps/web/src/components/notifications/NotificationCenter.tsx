/**
 * Notification Center Component
 *
 * Main notification dropdown component with popover.
 * Shows notification bell with badge count and dropdown list with infinite scroll.
 *
 * @see Story PM-06.5: In-App Notifications
 */

'use client';

import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotificationsInfinite, useUnreadCount, useMarkAllAsRead } from '@/hooks/use-notifications-api';
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications';
import { NotificationList } from './NotificationList';

export function NotificationCenter() {
  // Note: workspaceId is optional - when undefined, API returns all user notifications
  const workspaceId = undefined;

  // Real-time subscription
  useRealtimeNotifications();

  // Fetch notifications with infinite scroll
  const { data: notificationsData } = useNotificationsInfinite(workspaceId);

  // Fetch unread count
  const { data: unreadCountData } = useUnreadCount(workspaceId);

  // Mark all as read mutation
  const { mutate: markAllAsRead, isPending: isMarkingAllAsRead } = useMarkAllAsRead(workspaceId);

  // Flatten paginated notifications
  const notifications = notificationsData?.pages.flatMap((page) => page.data) ?? [];

  // Get unread count
  const unreadCount = unreadCountData?.count ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[rgb(var(--color-text-secondary))] transition-colors hover:bg-[rgb(var(--color-bg-hover))] hover:text-[rgb(var(--color-text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-500))] focus:ring-offset-2"
        >
          <Bell className="h-5 w-5" />

          {/* Badge count */}
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[rgb(var(--color-primary-500))] px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-bg-primary))] p-0"
        style={{
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgb(var(--color-border-default))] px-4 py-3">
          <h3 className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">
            Notifications
          </h3>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead()}
              disabled={isMarkingAllAsRead}
              className="text-xs font-medium text-[rgb(var(--color-primary-500))] transition-colors hover:text-[rgb(var(--color-primary-600))] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMarkingAllAsRead ? 'Marking...' : 'Mark all as read'}
            </button>
          )}
        </div>

        {/* Notification List */}
        <NotificationList notifications={notifications} workspaceId={workspaceId} />

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-[rgb(var(--color-border-default))] px-4 py-3">
            <button
              type="button"
              className="w-full text-center text-xs font-medium text-[rgb(var(--color-text-secondary))] transition-colors hover:text-[rgb(var(--color-text-primary))]"
            >
              View all notifications
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
