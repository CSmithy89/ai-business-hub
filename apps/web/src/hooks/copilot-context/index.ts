/**
 * CopilotKit Context Providers - Story DM-01.5
 *
 * Hooks for providing application context to CopilotKit agents.
 * These hooks use useCopilotReadable to share state with agents,
 * enabling context-aware AI assistance.
 *
 * Context Hierarchy:
 * - Page Context (global): Where the user is in the app
 * - Project Context (project pages): Active project details
 * - Selection Context (task views): Selected task information
 *
 * @see https://docs.copilotkit.ai/reference/hooks/useCopilotReadable
 * Epic: DM-01 | Story: DM-01.5
 */

// Type exports
export type {
  PageSection,
  PageContext,
  ProjectProgress,
  ProjectPhaseInfo,
  ProjectContext,
  SelectedTaskSummary,
  SelectionContext,
} from './types';

// Hook exports
export { useCopilotPageContext, getSection } from './use-copilot-page-context';
export { useCopilotProjectContext } from './use-copilot-project-context';
export { useCopilotSelectionContext } from './use-copilot-selection-context';
