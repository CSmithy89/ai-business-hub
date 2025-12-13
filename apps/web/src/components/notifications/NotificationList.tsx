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
import { Bell, Sparkles } from 'lucide-react';
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
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <Bell className="h-7 w-7 text-amber-600" />
          <Sparkles
            className="absolute -right-1 -top-1 h-5 w-5 text-amber-400 animate-pulse"
            aria-hidden="true"
          />
        </div>
        <p className="mb-1 text-sm font-semibold text-[rgb(var(--color-text-primary))]">
          You&apos;re all caught up!
        </p>
        <p className="text-xs text-[rgb(var(--color-text-secondary))]">
          No new notifications right now.
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
