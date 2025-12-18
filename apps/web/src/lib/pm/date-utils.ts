/**
 * PM Module Date Utilities
 *
 * Centralized date formatting functions for consistent display across PM components.
 * Uses date-fns for formatting.
 */

import { format, parseISO } from 'date-fns'

/**
 * Format a date string to short display format (e.g., "Jan 15")
 */
export function formatShortDate(dateString: string): string {
  return format(parseISO(dateString), 'MMM d')
}

/**
 * Format a date string to full display format (e.g., "Jan 15, 2025")
 */
export function formatFullDate(dateString: string): string {
  return format(parseISO(dateString), 'MMM d, yyyy')
}

/**
 * Format a date to ISO date key (e.g., "2025-01-15")
 * Used for grouping tasks by date in calendar views
 */
export function toDateKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'yyyy-MM-dd')
}

/**
 * Format a date range for display
 * Returns appropriate format based on which dates are provided:
 * - Both dates: "Jan 15 - Jan 20"
 * - Only from: "From Jan 15"
 * - Only to: "Until Jan 20"
 * - Neither: null
 */
export function formatDateRange(from: string | null, to: string | null): string | null {
  if (from && to) {
    return `${formatShortDate(from)} - ${formatShortDate(to)}`
  }
  if (from) {
    return `From ${formatShortDate(from)}`
  }
  if (to) {
    return `Until ${formatShortDate(to)}`
  }
  return null
}
