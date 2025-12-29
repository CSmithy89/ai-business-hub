/**
 * Unified CopilotKit Context Hook - Story DM-01.5
 *
 * Re-exports context hooks from the copilot-context module.
 * This file provides backward compatibility with the file path
 * specified in the tech spec (hooks/useCopilotContext.ts).
 *
 * Prefer importing directly from '@/hooks/copilot-context' for
 * better tree-shaking and explicit imports.
 *
 * @see docs/modules/bm-dm/epics/epic-dm-01-tech-spec.md - Section 6
 * Epic: DM-01 | Story: DM-01.5
 */

// Re-export all context hooks and types
export {
  // Hooks
  useCopilotPageContext,
  useCopilotProjectContext,
  useCopilotSelectionContext,
  // Utility functions
  getSection,
  // Types
  type PageSection,
  type PageContext,
  type ProjectProgress,
  type ProjectPhaseInfo,
  type ProjectContext,
  type SelectedTaskSummary,
  type SelectionContext,
} from './copilot-context';
