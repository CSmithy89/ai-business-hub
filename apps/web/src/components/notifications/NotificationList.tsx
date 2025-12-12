/**
 * Notification List Component
 *
 * Groups notifications by time period and renders notification items.
 */

'use client';

import {
  isToday,
  isYesterday,
  isThisWeek,
  differenceInMinutes,
} from 'date-fns';
import { BellOff } from 'lucide-react';
import type { Notification } from '@/hooks/use-notifications';
import { NotificationItem } from './NotificationItem';

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
}

type TimeGroup = 'Just now' | 'Today' | 'Yesterday' | 'This Week' | 'Earlier';

function getTimeGroup(timestamp: Date): TimeGroup {
  const now = new Date();
  const minutesDiff = differenceInMinutes(now, timestamp);

  if (minutesDiff < 5) {
    return 'Just now';
  }

  if (isToday(timestamp)) {
    return 'Today';
  }

  if (isYesterday(timestamp)) {
    return 'Yesterday';
  }

  if (isThisWeek(timestamp, { weekStartsOn: 1 })) {
    return 'This Week';
  }

  return 'Earlier';
}

function groupNotificationsByTime(notifications: Notification[]): Map<TimeGroup, Notification[]> {
  const groups = new Map<TimeGroup, Notification[]>();

  // Initialize groups in order
  const groupOrder: TimeGroup[] = ['Just now', 'Today', 'Yesterday', 'This Week', 'Earlier'];
  groupOrder.forEach((group) => groups.set(group, []));

  // Group notifications
  notifications.forEach((notification) => {
    const group = getTimeGroup(notification.timestamp);
    groups.get(group)?.push(notification);
  });

  // Remove empty groups
  groupOrder.forEach((group) => {
    if (groups.get(group)?.length === 0) {
      groups.delete(group);
    }
  });

  return groups;
}

export function NotificationList({ notifications, onMarkAsRead }: NotificationListProps) {
  const groupedNotifications = groupNotificationsByTime(notifications);

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[rgb(var(--color-bg-tertiary))]">
          <BellOff className="h-8 w-8 text-[rgb(var(--color-text-muted))]" />
        </div>
        <p className="mb-1 text-sm font-medium text-[rgb(var(--color-text-primary))]">
          No notifications
        </p>
        <p className="text-xs text-[rgb(var(--color-text-secondary))]">
          You&apos;re all caught up!
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[500px] overflow-y-auto scrollbar-thin">
      {Array.from(groupedNotifications.entries()).map(([group, groupNotifications]) => (
        <div key={group} className="mb-2">
          {/* Time group header */}
          <div className="sticky top-0 z-10 bg-[rgb(var(--color-bg-primary))] px-4 py-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">
              {group}
            </p>
          </div>

          {/* Notifications in group */}
          <div className="divide-y divide-[rgb(var(--color-border-subtle))]">
            {groupNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
