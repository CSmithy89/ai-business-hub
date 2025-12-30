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

// Dashboard state hooks (Epic DM-04)
export {
  useAgentStateSync,
  useAgentStateWidget,
  DASHBOARD_AGENT_NAME,
  UPDATE_DEBOUNCE_MS,
  type UseAgentStateSyncOptions,
  type UseAgentStateSyncResult,
} from './use-agent-state-sync';

export {
  useProjectStatus,
  useMetrics,
  useTeamActivity,
  useAlerts,
  useAllAlerts,
  useWidgetLoading,
  useAnyLoading,
  useLoadingAgents,
  useWidgetError,
  useErrors,
  useHasErrors,
  useActiveProject,
  useLastUpdated,
  useDashboardActions,
} from './use-dashboard-selectors';

// State persistence hooks (Story DM-04.5)
export {
  useStatePersistence,
  useDashboardStateWithPersistence,
  clearPersistedDashboardState,
  hasPersistedDashboardState,
  PERSISTENCE_DEBOUNCE_MS,
  STATE_TTL_MS,
  BROADCAST_CHANNEL_NAME,
  type UseStatePersistenceOptions,
  type UseStatePersistenceResult,
} from './use-state-persistence';

// HITL hooks (Story DM-05.2)
export {
  useHITLAction,
  useGenericHITLAction,
  type UseHITLActionOptions,
  type GenericHITLOptions,
} from '@/lib/hitl';

export type {
  HITLActionArgs,
  HITLConfig,
  HITLResponse,
  HITLRenderProps,
  ApprovalLevel,
  RiskLevel,
} from '@/lib/hitl';
