/**
 * Layout Constants
 *
 * Centralized layout dimensions and spacing values used throughout
 * the dashboard. These ensure consistency and make updates easier.
 *
 * Epic: 07 - UI Shell
 * Technical Debt: Extract magic numbers from layout components
 */

/**
 * Dashboard layout dimensions in pixels
 */
export const LAYOUT = {
  /** Fixed header height */
  HEADER_HEIGHT: 60,

  /** Sidebar width when collapsed */
  SIDEBAR_COLLAPSED_WIDTH: 64,

  /** Sidebar width when expanded */
  SIDEBAR_EXPANDED_WIDTH: 256,

  /** Minimum chat panel width */
  CHAT_MIN_WIDTH: 320,

  /** Maximum chat panel width */
  CHAT_MAX_WIDTH: 480,

  /** Default chat panel width */
  CHAT_DEFAULT_WIDTH: 320,

  /** Minimum main content width on desktop */
  CONTENT_MIN_WIDTH_DESKTOP: 600,

  /** Minimum main content width on tablet */
  CONTENT_MIN_WIDTH_TABLET: 400,
} as const;

/**
 * Tailwind class equivalents for layout constants
 * Use these when you need the Tailwind class string
 */
export const LAYOUT_CLASSES = {
  /** Header height as padding-top class value */
  HEADER_HEIGHT_PT: 'pt-[60px]',

  /** Sidebar collapsed width as margin-left class value */
  SIDEBAR_COLLAPSED_ML: 'ml-16', // 64px = 16 * 4

  /** Sidebar expanded width as margin-left class value */
  SIDEBAR_EXPANDED_ML: 'ml-64', // 256px = 64 * 4

  /** Main content min-width on desktop */
  CONTENT_MIN_WIDTH_DESKTOP: 'min-w-[600px]',

  /** Main content min-width on tablet */
  CONTENT_MIN_WIDTH_TABLET: 'lg:min-w-[400px]',
} as const;

/**
 * Z-index layers for consistent stacking
 */
export const Z_INDEX = {
  /** Base content layer */
  CONTENT: 0,

  /** Sidebar overlay on mobile */
  SIDEBAR: 40,

  /** Header (always above content) */
  HEADER: 50,

  /** Chat panel */
  CHAT_PANEL: 30,

  /** Dropdowns and tooltips */
  DROPDOWN: 100,

  /** Modals and dialogs */
  MODAL: 200,

  /** Command palette */
  COMMAND_PALETTE: 300,

  /** Toast notifications */
  TOAST: 400,
} as const;

/**
 * Animation durations in milliseconds
 */
export const ANIMATION = {
  /** Fast transition (hover effects) */
  FAST: 150,

  /** Default transition (most UI changes) */
  DEFAULT: 200,

  /** Slow transition (panel open/close) */
  SLOW: 300,
} as const;

/**
 * Type exports for TypeScript consumers
 */
export type LayoutKey = keyof typeof LAYOUT;
export type ZIndexKey = keyof typeof Z_INDEX;
export type AnimationKey = keyof typeof ANIMATION;
