/**
 * Notification Item Component
 *
 * Individual notification display with type icon, read/unread indicator,
 * and action link. Supports PM-specific notification types.
 *
 * @see Story PM-06.5: In-App Notifications
 */

'use client';

import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  CheckCircle,
  Info,
  AtSign,
  UserPlus,
  Clock,
  AlertTriangle,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import type { NotificationDto } from '@hyvve/shared';
import { useMarkAsRead } from '@/hooks/use-notifications-api';

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
  notification: NotificationDto;
  workspaceId?: string;
}

/**
 * Get icon for notification type
 * Supports both generic and PM-specific notification types
 */
function getNotificationIcon(type: string): LucideIcon {
  // PM-specific types
  if (type === 'task.assigned') return UserPlus;
  if (type === 'task.mentioned') return AtSign;
  if (type === 'task.due_date_reminder') return Clock;
  if (type === 'agent.task_completed') return CheckCircle;
  if (type === 'project.health_alert') return AlertTriangle;

  // Generic types
  if (type.includes('approval')) return CheckCircle;
  if (type.includes('mention')) return AtSign;
  if (type.includes('alert') || type.includes('warning')) return AlertTriangle;

  // Default
  return Info;
}

export function NotificationItem({ notification, workspaceId }: NotificationItemProps) {
  const router = useRouter();
  const { mutate: markAsRead } = useMarkAsRead(workspaceId);

  // Check if action URL is valid (prevents open redirect attacks)
  const hasValidAction = notification.link && isValidActionUrl(notification.link);

  const handleClick = () => {
    // Mark as read if not already read
    if (!notification.readAt) {
      markAsRead(notification.id);
    }

    // Navigate to link if provided and valid
    if (hasValidAction) {
      router.push(notification.link!);
    }
  };

  const Icon = getNotificationIcon(notification.type);
  const relativeTime = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group relative flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[rgb(var(--color-bg-tertiary))]"
    >
      {/* Unread indicator - left border */}
      {!notification.readAt && (
        <div
          className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-[rgb(var(--color-primary-500))]"
          aria-hidden="true"
        />
      )}

      {/* Icon */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          notification.readAt
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
            notification.readAt
              ? 'text-[rgb(var(--color-text-secondary))]'
              : 'text-[rgb(var(--color-text-primary))]'
          }`}
        >
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-xs text-[rgb(var(--color-text-secondary))] line-clamp-2">
            {notification.message}
          </p>
        )}
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
