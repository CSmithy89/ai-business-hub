/**
 * Notification List Component
 *
 * Groups notifications by time period and renders notification items.
 * Supports infinite scroll for paginated notifications.
 *
 * @see Story PM-06.5: In-App Notifications
 */

'use client';

import { useRef, useCallback } from 'react';
import {
  isToday,
  isYesterday,
  isThisWeek,
  differenceInMinutes,
} from 'date-fns';
import { Bell, Sparkles, Loader2 } from 'lucide-react';
import type { NotificationDto } from '@hyvve/shared';
import { NotificationItem } from './NotificationItem';
import { useNotificationsInfinite } from '@/hooks/use-notifications-api';

interface NotificationListProps {
  notifications: NotificationDto[];
  workspaceId?: string;
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

function groupNotificationsByTime(notifications: NotificationDto[]): Map<TimeGroup, NotificationDto[]> {
  const groups = new Map<TimeGroup, NotificationDto[]>();

  // Initialize groups in order
  const groupOrder: TimeGroup[] = ['Just now', 'Today', 'Yesterday', 'This Week', 'Earlier'];
  groupOrder.forEach((group) => groups.set(group, []));

  // Group notifications
  notifications.forEach((notification) => {
    const group = getTimeGroup(new Date(notification.createdAt));
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

export function NotificationList({ notifications, workspaceId }: NotificationListProps) {
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = useNotificationsInfinite(workspaceId);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Infinite scroll callback
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  // Set up intersection observer for infinite scroll
  const setLoadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (node) {
        observerRef.current = new IntersectionObserver(handleObserver, {
          threshold: 0.1,
        });
        observerRef.current.observe(node);
        loadMoreRef.current = node;
      }
    },
    [handleObserver],
  );

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
                workspaceId={workspaceId}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Infinite scroll loading indicator */}
      {hasNextPage && (
        <div ref={setLoadMoreRef} className="flex items-center justify-center py-4">
          {isFetchingNextPage ? (
            <div className="flex items-center gap-2 text-sm text-[rgb(var(--color-text-secondary))]">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading more...</span>
            </div>
          ) : (
            <div className="text-xs text-[rgb(var(--color-text-muted))]">
              Scroll for more
            </div>
          )}
        </div>
      )}
    </div>
  );
}
