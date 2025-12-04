/**
 * Notification Item Component
 *
 * Individual notification display with type icon, read/unread indicator,
 * and action link.
 */

'use client';

import { formatDistanceToNow } from 'date-fns';
import type { Notification, NotificationType } from '@/hooks/use-notifications';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

// Icon mapping for notification types
const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  approval: 'task_alt',
  system: 'info',
  mention: 'alternate_email',
  update: 'refresh',
};

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }

    // Navigate to action URL if provided
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const icon = NOTIFICATION_ICONS[notification.type];
  const relativeTime = formatDistanceToNow(notification.timestamp, { addSuffix: true });

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group relative flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[rgb(var(--color-bg-tertiary))]"
    >
      {/* Unread indicator - left border */}
      {!notification.read && (
        <div
          className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-[rgb(var(--color-primary-500))]"
          aria-hidden="true"
        />
      )}

      {/* Icon */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          notification.read
            ? 'bg-[rgb(var(--color-bg-tertiary))] text-[rgb(var(--color-text-muted))]'
            : 'bg-[rgb(var(--color-bg-secondary))] text-[rgb(var(--color-primary-500))]'
        }`}
      >
        <span className="material-symbols-rounded text-xl">{icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-1 overflow-hidden">
        <p
          className={`text-sm font-medium ${
            notification.read
              ? 'text-[rgb(var(--color-text-secondary))]'
              : 'text-[rgb(var(--color-text-primary))]'
          }`}
        >
          {notification.title}
        </p>
        <p className="text-xs text-[rgb(var(--color-text-secondary))] line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-[rgb(var(--color-text-muted))]">
          {relativeTime}
        </p>
      </div>

      {/* Action indicator */}
      {notification.actionUrl && (
        <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="material-symbols-rounded text-base text-[rgb(var(--color-text-muted))]">
            arrow_forward
          </span>
        </div>
      )}
    </button>
  );
}
