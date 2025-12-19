/**
 * PM Module Constants
 *
 * Centralized constants for the Project Management module to avoid magic numbers.
 */

/**
 * Virtualization settings for TanStack Virtual
 */
export const VIRTUALIZATION = {
  /** Row height in pixels for table rows */
  TABLE_ROW_HEIGHT: 50,
  /** Card height in pixels for kanban cards */
  KANBAN_CARD_HEIGHT: 100,
  /** Number of items to render above/below the viewport */
  OVERSCAN: 5,
  /** Larger overscan for tables */
  TABLE_OVERSCAN: 10,
  /** Default table container height */
  TABLE_HEIGHT: '600px',
  /** Threshold for enabling kanban column virtualization */
  KANBAN_COLUMN_THRESHOLD: 20,
  /** Threshold for enabling table virtualization */
  TABLE_ROW_THRESHOLD: 500,
} as const

/**
 * Debounce delays in milliseconds
 */
export const DEBOUNCE = {
  /** URL state update debounce delay */
  URL_UPDATE_MS: 300,
  /** Search input debounce delay */
  SEARCH_MS: 300,
} as const

/**
 * Pagination defaults
 */
export const PAGINATION = {
  /** Default page size for task lists */
  DEFAULT_PAGE_SIZE: 50,
  /** Maximum saved views per query */
  MAX_SAVED_VIEWS: 100,
} as const
