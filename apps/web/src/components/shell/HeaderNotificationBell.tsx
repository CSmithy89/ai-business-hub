/**
 * Header Notification Bell Component
 *
 * Shows notification icon with unread count badge.
 * Clicking opens the notification center (Story 07.7).
 */

'use client';

import { useState } from 'react';

// Mock hook for notification count - will be replaced with real API
function useNotificationCount() {
  // TODO: Replace with actual notification API from Story 07.7
  return { count: 3, isLoading: false };
}

export function HeaderNotificationBell() {
  const { count } = useNotificationCount();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg
                   text-[rgb(var(--color-text-secondary))] transition-colors
                   hover:bg-[rgb(var(--color-bg-hover))] hover:text-[rgb(var(--color-text-primary))]
                   focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className="material-symbols-rounded text-xl">notifications</span>
        {count > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center
                       rounded-full bg-[rgb(var(--color-primary))] px-1 text-[10px] font-bold text-white"
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Notification dropdown placeholder - Full implementation in Story 07.7 */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-lg border
                     border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-bg-primary))]
                     p-4 shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-[rgb(var(--color-border-default))] pb-3 mb-3">
            <h3 className="font-semibold text-[rgb(var(--color-text-primary))]">
              Notifications
            </h3>
            <button
              className="text-xs text-[rgb(var(--color-primary))] hover:underline"
              type="button"
            >
              Mark all read
            </button>
          </div>
          <p className="text-sm text-[rgb(var(--color-text-secondary))]">
            {count} unread notifications
          </p>
          <p className="mt-2 text-xs text-[rgb(var(--color-text-tertiary))]">
            Full notification center in Story 07.7
          </p>
        </div>
      )}
    </div>
  );
}
