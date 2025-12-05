/**
 * Date Utilities
 *
 * Standardized date/timestamp handling utilities for consistent
 * date operations across the application.
 *
 * All formatting functions support an optional timezone parameter
 * for multi-tenant applications where users may be in different timezones.
 *
 * Epic: 07 - UI Shell
 * Technical Debt: Standardize timestamp handling across components
 */

/** Options for date formatting functions */
export interface DateFormatOptions {
  /**
   * IANA timezone identifier (e.g., 'America/New_York', 'Europe/London', 'UTC')
   * Defaults to user's local timezone if not specified.
   */
  timezone?: string;
}

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
 * @param options - Optional formatting options including timezone
 * @returns Formatted time string
 *
 * @example
 * ```ts
 * formatChatTime(new Date()); // "2:30 PM" (local timezone)
 * formatChatTime(new Date(), { timezone: 'UTC' }); // "2:30 PM" (UTC)
 * ```
 */
export function formatChatTime(
  timestamp: Date | string | number,
  options?: DateFormatOptions
): string {
  const date = normalizeTimestamp(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: options?.timezone,
  }).format(date);
}

/**
 * Formats a timestamp for display with date and time.
 * Shows full date and time (e.g., "Jan 15, 2024, 2:30 PM").
 *
 * @param timestamp - Date object, ISO string, or numeric timestamp
 * @param options - Optional formatting options including timezone
 * @returns Formatted date-time string
 *
 * @example
 * ```ts
 * formatDateTime(new Date()); // "Jan 15, 2024, 2:30 PM" (local)
 * formatDateTime(new Date(), { timezone: 'America/New_York' });
 * ```
 */
export function formatDateTime(
  timestamp: Date | string | number,
  options?: DateFormatOptions
): string {
  const date = normalizeTimestamp(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: options?.timezone,
  }).format(date);
}

/**
 * Formats a timestamp as a relative time string.
 * Shows relative time (e.g., "2 minutes ago", "yesterday").
 *
 * Note: Relative time is calculated from the current moment,
 * so timezone doesn't affect the relative calculation. The fallback
 * to formatDateTime will use the specified timezone if provided.
 *
 * @param timestamp - Date object, ISO string, or numeric timestamp
 * @param options - Optional formatting options including timezone
 * @returns Relative time string
 */
export function formatRelativeTime(
  timestamp: Date | string | number,
  options?: DateFormatOptions
): string {
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
  return formatDateTime(timestamp, options);
}

/**
 * User activity status types
 */
export type ActivityStatus = 'online' | 'away' | 'offline';

/**
 * Calculates activity status based on last active timestamp.
 * - Online: active within 5 minutes
 * - Away: active within 30 minutes
 * - Offline: more than 30 minutes ago
 *
 * @param lastActiveAt - Date object, ISO string, numeric timestamp, or null/undefined
 * @returns Activity status
 *
 * @example
 * ```ts
 * getActivityStatus(new Date()); // 'online'
 * getActivityStatus(Date.now() - 10 * 60 * 1000); // 'away'
 * getActivityStatus(Date.now() - 60 * 60 * 1000); // 'offline'
 * getActivityStatus(null); // 'offline'
 * ```
 */
export function getActivityStatus(
  lastActiveAt: Date | string | number | null | undefined
): ActivityStatus {
  if (!lastActiveAt) {
    return 'offline';
  }

  const date = normalizeTimestamp(lastActiveAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 1000 / 60);

  if (diffMinutes < 5) {
    return 'online';
  }
  if (diffMinutes < 30) {
    return 'away';
  }
  return 'offline';
}

/**
 * Formats last active time with "Never" fallback.
 * Used for displaying user activity in member lists.
 *
 * @param lastActiveAt - Date object, ISO string, numeric timestamp, or null/undefined
 * @param options - Optional formatting options including timezone
 * @returns Relative time string or "Never"
 *
 * @example
 * ```ts
 * formatLastActive(new Date()); // "just now"
 * formatLastActive(Date.now() - 2 * 60 * 1000); // "2 minutes ago"
 * formatLastActive(null); // "Never"
 * ```
 */
export function formatLastActive(
  lastActiveAt: Date | string | number | null | undefined,
  options?: DateFormatOptions
): string {
  if (!lastActiveAt) {
    return 'Never';
  }
  return formatRelativeTime(lastActiveAt, options);
}
