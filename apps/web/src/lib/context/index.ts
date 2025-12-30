/**
 * Context Module
 *
 * Exports for CopilotKit context providers.
 * These hooks and utilities enable agents to understand application state
 * through CopilotKit's useCopilotReadable system prompt augmentation.
 *
 * Epic: DM-06 | Story: DM-06.1
 */

// Types
export type {
  ProjectContext,
  SelectionContext,
  ActivityContext,
  DocumentContext,
  WorkspaceContext,
  ViewContext,
} from './copilot-context';

// Hooks
export {
  useProjectContext,
  useSelectionContext,
  useActivityContext,
  useDocumentContext,
  useWorkspaceContext,
  useViewContext,
  useSafeContext,
} from './copilot-context';

// Utilities
export { filterSensitiveContext } from './copilot-context';
