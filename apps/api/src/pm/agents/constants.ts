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
// Use reserved prefix (__system__) to avoid conflicts with real user IDs
export const SYSTEM_USERS = {
  /** System user for health check cron jobs */
  HEALTH_CHECK: '__system__health_check',
  /** System user for scheduled report generation */
  HERALD_AGENT: '__system__herald_agent',
  /** System user for checkpoint reminders */
  CHECKPOINT_REMINDER: '__system__checkpoint',
} as const;

// Cron job settings for scalability
export const CRON_SETTINGS = {
  /** Number of concurrent health checks (limits DB load) */
  HEALTH_CHECK_CONCURRENCY: 5,
  /** Maximum projects to process per cron run */
  HEALTH_CHECK_BATCH_SIZE: 100,
  /** Minutes before a project's health check is considered stale */
  HEALTH_CHECK_STALE_MINUTES: 14, // Slightly less than 15 to ensure overlap
  /** Number of concurrent report generations */
  REPORT_GENERATION_CONCURRENCY: 3,
  /** Maximum reports to generate per cron run */
  REPORT_GENERATION_BATCH_SIZE: 50,
} as const;

// Health check limits
export const HEALTH_CHECK_LIMITS = {
  /** Maximum tasks to analyze per health check */
  MAX_TASKS: 500,
  /** Days of task history to consider for velocity */
  VELOCITY_LOOKBACK_DAYS: 30,
  /** Maximum risks to create per health check */
  MAX_RISKS_PER_CHECK: 20,
} as const;
