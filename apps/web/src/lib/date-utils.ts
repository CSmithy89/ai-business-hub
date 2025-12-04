/**
 * Date Utilities
 *
 * Standardized date/timestamp handling utilities for consistent
 * date operations across the application.
 *
 * Epic: 07 - UI Shell
 * Technical Debt: Standardize timestamp handling across components
 */

/**
 * Normalizes a timestamp to a Date object.
 * Accepts Date objects, ISO strings, or numeric timestamps.
 *
 * @param timestamp - Date object, ISO string, or numeric timestamp
 * @returns Date object
 *
 * @example
 * ```ts
 * normalizeTimestamp(new Date()); // Returns same Date
 * normalizeTimestamp('2024-01-15T10:30:00Z'); // Returns Date
 * normalizeTimestamp(1705315800000); // Returns Date
 * ```
 */
export function normalizeTimestamp(timestamp: Date | string | number): Date {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp);
}

/**
 * Formats a timestamp for display in chat messages.
 * Shows time in 12-hour format (e.g., "2:30 PM").
 *
 * @param timestamp - Date object, ISO string, or numeric timestamp
 * @returns Formatted time string
 *
 * @example
 * ```ts
 * formatChatTime(new Date()); // "2:30 PM"
 * ```
 */
export function formatChatTime(timestamp: Date | string | number): string {
  const date = normalizeTimestamp(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Formats a timestamp for display with date and time.
 * Shows full date and time (e.g., "Jan 15, 2024, 2:30 PM").
 *
 * @param timestamp - Date object, ISO string, or numeric timestamp
 * @returns Formatted date-time string
 */
export function formatDateTime(timestamp: Date | string | number): string {
  const date = normalizeTimestamp(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Formats a timestamp as a relative time string.
 * Shows relative time (e.g., "2 minutes ago", "yesterday").
 *
 * @param timestamp - Date object, ISO string, or numeric timestamp
 * @returns Relative time string
 */
export function formatRelativeTime(timestamp: Date | string | number): string {
  const date = normalizeTimestamp(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }
  if (diffDays === 1) {
    return 'yesterday';
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  // Fall back to formatted date for older timestamps
  return formatDateTime(timestamp);
}
