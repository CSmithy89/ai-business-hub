/**
 * Dynamic Module System Constants
 *
 * All magic numbers for DM epics must be defined here.
 * Do NOT hardcode values in components.
 *
 * @see docs/modules/bm-dm/epics/epic-dm-01-tech-spec.md
 */
export const DM_CONSTANTS = {
  // CopilotKit Configuration
  COPILOTKIT: {
    /** Delay before attempting reconnection (ms) */
    RECONNECT_DELAY_MS: 1000,
    /** Maximum number of reconnection attempts */
    MAX_RECONNECT_ATTEMPTS: 5,
    /** Connection timeout (ms) */
    CONNECTION_TIMEOUT_MS: 30000,
    /** Heartbeat interval for keeping connection alive (ms) */
    HEARTBEAT_INTERVAL_MS: 15000,
  },

  // Widget Rendering (for DM-01.2, DM-01.3)
  WIDGETS: {
    /** Maximum widgets per dashboard page */
    MAX_WIDGETS_PER_PAGE: 12,
    /** Minimum widget height in pixels */
    WIDGET_MIN_HEIGHT_PX: 100,
    /** Maximum widget height in pixels */
    WIDGET_MAX_HEIGHT_PX: 600,
    /** Animation duration for widget transitions (ms) */
    ANIMATION_DURATION_MS: 200,
    /** Skeleton loading pulse duration (ms) */
    SKELETON_PULSE_DURATION_MS: 1500,
    /** Debounce delay for widget resize events (ms) */
    DEBOUNCE_RESIZE_MS: 150,
  },

  // Chat UI (for DM-01.4)
  CHAT: {
    /** Maximum message length in characters */
    MAX_MESSAGE_LENGTH: 10000,
    /** Maximum messages to keep in chat history */
    MAX_HISTORY_MESSAGES: 100,
    /** Delay before showing typing indicator (ms) */
    TYPING_INDICATOR_DELAY_MS: 500,
    /** Distance from bottom to trigger auto-scroll (px) */
    AUTO_SCROLL_THRESHOLD_PX: 100,
    /** Keyboard shortcut for opening chat */
    KEYBOARD_SHORTCUT: '/',
    /** Modifier key for keyboard shortcut */
    KEYBOARD_MODIFIER: 'meta', // Cmd on Mac, Ctrl on Windows
  },

  // CCR Configuration (for DM-01.6, DM-01.7, DM-01.8)
  CCR: {
    /** Quota warning threshold (0-1) */
    DEFAULT_QUOTA_WARNING_THRESHOLD: 0.8,
    /** Quota critical threshold (0-1) */
    DEFAULT_QUOTA_CRITICAL_THRESHOLD: 0.95,
    /** Status polling interval (ms) */
    STATUS_POLL_INTERVAL_MS: 30000,
    /** Reconnection backoff multiplier */
    RECONNECT_BACKOFF_MULTIPLIER: 1.5,
    /** Maximum reconnection backoff (ms) */
    MAX_RECONNECT_BACKOFF_MS: 60000,
  },

  // Performance
  PERFORMANCE: {
    /** Budget for initial render (ms) */
    INITIAL_RENDER_BUDGET_MS: 100,
    /** Budget for user interactions (ms) */
    INTERACTION_BUDGET_MS: 50,
    /** Warning threshold for bundle size (KB) */
    BUNDLE_SIZE_WARNING_KB: 500,
  },

  // Z-Index Layers (independent values for DM module components)
  Z_INDEX: {
    /** Copilot chat sidebar */
    COPILOT_CHAT: 60,
    /** Widget overlay (e.g., expanded view) */
    WIDGET_OVERLAY: 55,
  },

  // Dashboard State Boundaries (DM-08.6)
  DASHBOARD: {
    /** Maximum alerts to keep in state */
    MAX_ALERTS: 50,
    /** Maximum activities to keep in state */
    MAX_ACTIVITIES: 100,
    /** Maximum metrics to keep in state */
    MAX_METRICS: 50,
    /** Maximum active tasks to track */
    MAX_ACTIVE_TASKS: 20,
  },
} as const;

export type DMConstantsType = typeof DM_CONSTANTS;
