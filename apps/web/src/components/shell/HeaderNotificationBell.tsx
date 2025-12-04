/**
 * Header Notification Bell Component
 *
 * Shows notification icon with unread count badge.
 * Clicking opens the notification center (Story 07.7).
 */

'use client';

import { NotificationCenter } from '@/components/notifications';

export function HeaderNotificationBell() {
  return <NotificationCenter />;
}
