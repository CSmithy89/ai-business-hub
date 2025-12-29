/**
 * Custom Hooks Index
 *
 * Central export for all custom React hooks.
 */

export { useKeyboardShortcut } from './use-keyboard-shortcut';
export { useNullSafePathname } from './use-null-safe-pathname';
export { usePlatform, getPlatform, getModifierKey, type Platform } from './use-platform';

// Real-time hooks (Story 16-15)
export { useRealtimeApprovals } from './use-realtime-approvals';
export { useRealtimeAgents } from './use-realtime-agents';
export { useRealtimeNotifications, useNotificationBadge } from './use-realtime-notifications';
export { useRealtimeChat } from './use-realtime-chat';

// Celebration hooks (Story 16-25)
export {
  useCelebration,
  triggerConfetti,
  type CelebrationType,
  type UseCelebrationReturn,
} from './use-celebration';

// PM module hooks (Epic PM-05)
export { usePmRisks, type RiskEntry } from './use-pm-risks';
export { usePhaseTransition } from './use-phase-transition';

// CopilotKit context hooks (Story DM-01.5)
export {
  useCopilotPageContext,
  useCopilotProjectContext,
  useCopilotSelectionContext,
  getSection,
  type PageSection,
  type PageContext,
  type ProjectProgress,
  type ProjectPhaseInfo,
  type ProjectContext,
  type SelectedTaskSummary,
  type SelectionContext,
} from './useCopilotContext';
