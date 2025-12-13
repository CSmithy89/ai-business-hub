/**
 * Notification Item Component
 *
 * Individual notification display with type icon, read/unread indicator,
 * and action link.
 */

'use client';

import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, Info, AtSign, RefreshCw, ArrowRight, type LucideIcon } from 'lucide-react';
import type { Notification, NotificationType } from '@/hooks/use-notifications';

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

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

// Icon mapping for notification types
const NOTIFICATION_ICONS: Record<NotificationType, LucideIcon> = {
  approval: CheckCircle,
  system: Info,
  mention: AtSign,
  update: RefreshCw,
};

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const router = useRouter();

  // Check if action URL is valid (prevents open redirect attacks)
  const hasValidAction = notification.actionUrl && isValidActionUrl(notification.actionUrl);

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }

    // Navigate to action URL if provided and valid
    if (hasValidAction) {
      router.push(notification.actionUrl as never);
    }
  };

  const Icon = NOTIFICATION_ICONS[notification.type];
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
        <Icon className="h-5 w-5" />
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

      {/* Action indicator - only show if URL is valid */}
      {hasValidAction && (
        <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
          <ArrowRight className="h-4 w-4 text-[rgb(var(--color-text-muted))]" />
        </div>
      )}
    </button>
  );
}
