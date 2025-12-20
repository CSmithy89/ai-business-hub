/**
 * Constants for PM Agent Services
 * Centralizes magic numbers for better maintainability
 */

// Time unit conversions (milliseconds)
export const TIME_UNITS = {
  SECOND_MS: 1000,
  MINUTE_MS: 60 * 1000,
  HOUR_MS: 60 * 60 * 1000,
  DAY_MS: 24 * 60 * 60 * 1000,
  WEEK_MS: 7 * 24 * 60 * 60 * 1000,
  SPRINT_MS: 14 * 24 * 60 * 60 * 1000, // 2-week sprints
} as const;

// Query limits to prevent abuse and ensure performance
export const QUERY_LIMITS = {
  /** Maximum tasks per briefing query */
  BRIEFING_TASKS: 200,
  /** Maximum recent activity items */
  RECENT_ACTIVITY: 10,
  /** Maximum similar tasks for estimation */
  SIMILAR_TASKS: 50,
  /** Maximum tasks for calibration analysis */
  CALIBRATION_TASKS: 1000,
  /** Maximum time suggestions */
  TIME_SUGGESTIONS: 10,
} as const;

// Suggestion settings
export const SUGGESTION_SETTINGS = {
  /** Hours until suggestion expires */
  EXPIRY_HOURS: 24,
  /** Default snooze duration in hours */
  DEFAULT_SNOOZE_HOURS: 4,
  /** Maximum snooze duration in hours (1 week) */
  MAX_SNOOZE_HOURS: 168,
} as const;

// Rate limiting settings (in milliseconds for TTL)
export const RATE_LIMITS = {
  /** Default: 100 requests per minute */
  DEFAULT: { limit: 100, ttl: 60000 },
  /** Medium: 10-20 requests per 10 seconds */
  MEDIUM: { limit: 10, ttl: 10000 },
  /** Short: 2-3 requests per second */
  SHORT: { limit: 2, ttl: 1000 },
} as const;

// Activity lookback periods
export const LOOKBACK_PERIODS = {
  /** Hours for recent activity */
  RECENT_ACTIVITY_HOURS: 24,
  /** Days for time tracking suggestions */
  TIME_SUGGESTION_DAYS: 7,
} as const;

// System user IDs for scheduled/automated tasks
export const SYSTEM_USERS = {
  /** System user for health check cron jobs */
  HEALTH_CHECK: 'system',
  /** System user for scheduled report generation */
  HERALD_AGENT: 'herald_agent',
  /** System user for checkpoint reminders */
  CHECKPOINT_REMINDER: 'system',
} as const;
