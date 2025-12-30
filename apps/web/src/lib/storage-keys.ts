/**
 * Centralized localStorage/sessionStorage key constants
 *
 * All storage keys used in the application should be defined here
 * to prevent key collisions and ensure consistency.
 *
 * Naming convention: CATEGORY_DESCRIPTION
 * Prefix: 'hyvve-' for all application storage keys
 */

// ============================================================================
// UI State Keys
// ============================================================================

/** User's active workspace ID */
export const STORAGE_ACTIVE_WORKSPACE_ID = 'activeWorkspaceId' as const;

/** Sidebar collapsed state */
export const STORAGE_UI_STATE = 'hyvve-ui-state' as const;

/** Layout priority preference (sidebar vs chat) */
export const STORAGE_LAYOUT_PRIORITY = 'hyvve-layout-priority' as const;

/** Appearance settings (theme, colors) */
export const STORAGE_APPEARANCE = 'hyvve-appearance-settings' as const;

// ============================================================================
// Chat Keys
// ============================================================================

/** Chat history for AI assistant */
export const STORAGE_CHAT_HISTORY = 'hyvve-chat-history' as const;

// ============================================================================
// Command Palette Keys
// ============================================================================

/** Recently used commands in command palette */
export const STORAGE_COMMAND_RECENT = 'hyvve-command-palette-recent' as const;

// ============================================================================
// Onboarding Keys
// ============================================================================

/** Account onboarding wizard state */
export const STORAGE_ACCOUNT_ONBOARDING = 'hyvve-account-onboarding' as const;

/** Business onboarding wizard state */
export const STORAGE_ONBOARDING_WIZARD = 'hyvve-onboarding-wizard' as const;

/** Whether to show the product tour */
export const STORAGE_SHOW_TOUR = 'hyvve-show-tour' as const;

// ============================================================================
// Demo Mode Keys
// ============================================================================

/** Whether demo mode banner has been dismissed */
export const STORAGE_DEMO_BANNER_DISMISSED = 'hyvve-demo-banner-dismissed' as const;

// ============================================================================
// Approval Queue Keys
// ============================================================================

/** Approval queue custom order prefix (append workspace ID) */
export const STORAGE_APPROVAL_ORDER_PREFIX = 'hyvve-approval-order-' as const;

// ============================================================================
// Auth & Verification Keys
// ============================================================================

/** Email verification resend countdown timestamp */
export const STORAGE_VERIFICATION_COUNTDOWN = 'verification-resend-countdown' as const;

// ============================================================================
// Dashboard State Keys (Epic DM-04)
// ============================================================================

/** Dashboard state persistence for session continuity */
export const STORAGE_DASHBOARD_STATE = 'hyvve-dashboard-state' as const;

/** Dashboard state version for schema migrations */
export const STORAGE_DASHBOARD_STATE_VERSION = 'hyvve-dashboard-state-version' as const;
