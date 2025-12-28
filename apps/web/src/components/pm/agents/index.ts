/**
 * PM Agent Components
 *
 * Story: PM-12.1 - Agent UI Components
 *
 * Public exports for PM agent UI components.
 * These components provide the frontend interface for interacting
 * with PM agents (Navi, Sage, Chrono, Scope, Pulse, Herald).
 */

// Agent Panel - Chat interface
export { AgentPanel, AgentPanelTrigger } from './AgentPanel';

// Suggestion Components
export { SuggestionCard, SuggestionCardCompact } from './SuggestionCard';
export type { Suggestion } from './SuggestionCard';
export {
  SuggestionListPanel,
  SuggestionListTrigger,
  SuggestionListInline,
} from './SuggestionList';

// Time Tracking
export { TimeTracker, TimeTrackerButton } from './TimeTracker';

// Estimation Display
export { EstimationDisplay, EstimationBadge } from './EstimationDisplay';

// Health Dashboard
export { HealthDashboard, HealthBadge } from './HealthDashboard';

// Constants and Utilities
export {
  AGENT_CONFIG,
  FIBONACCI_POINTS,
  SNOOZE_OPTIONS,
  TIME_TRACKER_STORAGE_KEY,
  EXPIRY_WARNING_HOURS,
  getAgentConfig,
  getConfidenceColor,
  getConfidenceBadge,
  getConfidenceLabel,
  getSuggestionIcon,
  suggestionTypeLabels,
} from './constants';

// Types
export type {
  AgentName,
  AgentConfig,
  SuggestionType,
  SuggestionStatus,
  FibonacciPoint,
} from './constants';
