/**
 * Copilot Context Provider Utilities
 *
 * Provides hooks and utilities for exposing application context
 * to CopilotKit agents via useCopilotReadable.
 *
 * Context is pushed to agents via system prompt augmentation,
 * enabling natural references like "this project" and "here" to work correctly.
 *
 * @see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
 * Epic: DM-06 | Story: DM-06.1
 */
'use client';

import { useCopilotReadable } from '@copilotkit/react-core';
import { useMemo } from 'react';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Context for the currently active project.
 */
export interface ProjectContext {
  id: string;
  name: string;
  status: 'active' | 'on-hold' | 'completed';
  currentPhase?: string;
  healthScore?: number;
  progress: number;
  tasksTotal: number;
  tasksCompleted: number;
  team?: Array<{ id: string; name: string; role: string }>;
}

/**
 * Context for currently selected items in the UI.
 */
export interface SelectionContext {
  type: 'task' | 'project' | 'document' | 'none';
  ids: string[];
  count: number;
  summary?: string;
}

/**
 * Context for user activity and navigation.
 */
export interface ActivityContext {
  recentActions: Array<{
    action: string;
    target: string;
    timestamp: number;
  }>;
  currentPage: string;
  sessionDuration: number;
}

/**
 * Context for the document currently being edited.
 */
export interface DocumentContext {
  id: string;
  title: string;
  type: 'markdown' | 'rich-text' | 'code';
  wordCount: number;
  lastEdited: number;
  cursorPosition?: { line: number; column: number };
  selectedText?: string;
}

/**
 * Context for the current workspace.
 */
export interface WorkspaceContext {
  id: string;
  name: string;
  plan: string;
  memberCount: number;
  modulesEnabled: string[];
}

/**
 * Context for current view configuration.
 */
export interface ViewContext {
  type: 'list' | 'board' | 'calendar' | 'gantt';
  filters: Record<string, unknown>;
  sortBy?: string;
  groupBy?: string;
  visibleCount: number;
  totalCount: number;
}

// =============================================================================
// PRIVACY UTILITIES
// =============================================================================

/**
 * Default fields to filter out for privacy.
 */
const DEFAULT_SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'ssn',
  'creditCard',
  'accessToken',
  'refreshToken',
  'authorization',
  'credentials',
  'privateKey',
  'sessionId',
];

/**
 * Recursively filter sensitive fields from context before exposure.
 * Guards against circular references using a WeakSet.
 *
 * @param data - The data object to filter
 * @param sensitiveFields - Field names to exclude (case-insensitive matching)
 * @param visited - Internal WeakSet to track visited objects (prevents circular reference loops)
 * @returns Filtered data with sensitive fields removed
 *
 * @example
 * ```typescript
 * const safe = filterSensitiveContext({
 *   name: 'Project X',
 *   apiKey: 'sk-xxx',  // EXCLUDED
 *   config: {
 *     secretToken: 'abc'  // EXCLUDED (nested)
 *   }
 * });
 * // Result: { name: 'Project X', config: {} }
 * ```
 */
export function filterSensitiveContext<T extends Record<string, unknown>>(
  data: T,
  sensitiveFields: string[] = DEFAULT_SENSITIVE_FIELDS,
  visited: WeakSet<object> = new WeakSet()
): Partial<T> {
  // Guard against circular references
  if (visited.has(data)) {
    return {} as Partial<T>;
  }
  visited.add(data);

  const result: Record<string, unknown> = {};

  // Normalize a string by removing separators and converting to lowercase
  // This allows matching API_KEY with apiKey, secret_token with secretToken, etc.
  const normalize = (str: string) => str.toLowerCase().replace(/[_-]/g, '');

  for (const [key, value] of Object.entries(data)) {
    // Case-insensitive check for sensitive fields (with separator normalization)
    const normalizedKey = normalize(key);
    const isSensitive = sensitiveFields.some((field) =>
      normalizedKey.includes(normalize(field))
    );

    if (isSensitive) {
      continue;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively filter nested objects (pass visited set)
      result[key] = filterSensitiveContext(
        value as Record<string, unknown>,
        sensitiveFields,
        visited
      );
    } else if (Array.isArray(value)) {
      // Filter each item in arrays if they're objects
      result[key] = value.map((item) =>
        item && typeof item === 'object' && !Array.isArray(item)
          ? filterSensitiveContext(
              item as Record<string, unknown>,
              sensitiveFields,
              visited
            )
          : item
      );
    } else {
      result[key] = value;
    }
  }

  return result as Partial<T>;
}

// =============================================================================
// CONTEXT PROVIDER HOOKS
// =============================================================================

/**
 * Provide active project context to agents.
 *
 * Transforms project data for agent consumption:
 * - Team members are exposed as count (teamSize), not individual details
 * - All project metadata is included for context-aware responses
 *
 * @param project - The currently active project, or null if none
 *
 * @example
 * ```tsx
 * function ProjectPage({ project }) {
 *   useProjectContext(project);
 *   return <ProjectDetails project={project} />;
 * }
 * ```
 */
export function useProjectContext(project: ProjectContext | null): void {
  const contextValue = useMemo(() => {
    if (!project) return null;

    // Filter sensitive data before exposing to agent
    return {
      id: project.id,
      name: project.name,
      status: project.status,
      currentPhase: project.currentPhase,
      healthScore: project.healthScore,
      progress: project.progress,
      tasksTotal: project.tasksTotal,
      tasksCompleted: project.tasksCompleted,
      teamSize: project.team?.length ?? 0, // Expose count, not individual members
    };
  }, [project]);

  useCopilotReadable({
    description: 'The currently active project the user is viewing',
    value: contextValue,
  });
}

/**
 * Provide selection context to agents.
 *
 * Exposes information about currently selected items in the UI.
 *
 * @param selection - Current selection state, or null if nothing selected
 *
 * @example
 * ```tsx
 * function TaskList({ selectedTasks }) {
 *   useSelectionContext({
 *     type: 'task',
 *     ids: selectedTasks.map(t => t.id),
 *     count: selectedTasks.length,
 *     summary: `${selectedTasks.length} tasks selected`,
 *   });
 *   return <TaskListView tasks={tasks} />;
 * }
 * ```
 */
export function useSelectionContext(selection: SelectionContext | null): void {
  useCopilotReadable({
    description: 'Currently selected items in the interface',
    value: selection,
  });
}

/**
 * Provide user activity context to agents.
 *
 * Transforms activity data:
 * - Limits recent actions to last 10 entries to prevent prompt bloat
 * - Converts session duration from milliseconds to minutes
 *
 * @param activity - User activity state, or null if not tracking
 *
 * @example
 * ```tsx
 * function AppLayout({ children }) {
 *   const activity = useActivityTracking();
 *   useActivityContext(activity);
 *   return <Layout>{children}</Layout>;
 * }
 * ```
 */
export function useActivityContext(activity: ActivityContext | null): void {
  const contextValue = useMemo(() => {
    if (!activity) return null;

    // Only include recent actions (last 10) and convert duration to minutes
    return {
      recentActions: activity.recentActions.slice(0, 10),
      currentPage: activity.currentPage,
      sessionMinutes: Math.floor(activity.sessionDuration / 60000),
    };
  }, [activity]);

  useCopilotReadable({
    description: 'Recent user activity and navigation context',
    value: contextValue,
  });
}

/**
 * Provide document editing context to agents.
 *
 * Transforms document data:
 * - Truncates selected text to 100 characters to prevent prompt bloat
 * - Exposes cursor position and selection state
 *
 * @param document - Document editing state, or null if not editing
 *
 * @example
 * ```tsx
 * function DocumentEditor({ document }) {
 *   useDocumentContext(document);
 *   return <Editor document={document} />;
 * }
 * ```
 */
export function useDocumentContext(document: DocumentContext | null): void {
  const contextValue = useMemo(() => {
    if (!document) return null;

    return {
      id: document.id,
      title: document.title,
      type: document.type,
      wordCount: document.wordCount,
      lastEdited: document.lastEdited,
      cursorLine: document.cursorPosition?.line,
      hasSelection: !!document.selectedText,
      selectionPreview: document.selectedText?.slice(0, 100),
    };
  }, [document]);

  useCopilotReadable({
    description: 'The document currently being edited',
    value: contextValue,
  });
}

/**
 * Provide workspace-level context to agents.
 *
 * Exposes workspace information including plan and enabled modules.
 *
 * @param workspace - Workspace info, or null if not in a workspace context
 */
export function useWorkspaceContext(workspace: WorkspaceContext | null): void {
  useCopilotReadable({
    description: 'The current workspace context',
    value: workspace,
  });
}

/**
 * Provide filtered/sorted view context to agents.
 *
 * Exposes current view configuration including filters, sorting, and counts.
 *
 * @param view - View configuration, or null if not applicable
 */
export function useViewContext(view: ViewContext | null): void {
  useCopilotReadable({
    description: 'Current view configuration and visible items',
    value: view,
  });
}

/**
 * Combined hook with automatic sensitive data filtering.
 *
 * Use this for custom context that may contain sensitive fields.
 *
 * @param description - Description for the agent to understand the context purpose
 * @param data - Data to expose (will be filtered for sensitive fields)
 * @param sensitiveFields - Optional custom list of sensitive field names
 *
 * @example
 * ```tsx
 * function CustomContext({ config }) {
 *   useSafeContext('Custom configuration', config);
 *   return <ConfigView config={config} />;
 * }
 * ```
 */
export function useSafeContext<T extends Record<string, unknown>>(
  description: string,
  data: T | null,
  sensitiveFields?: string[]
): void {
  const safeValue = useMemo(() => {
    if (!data) return null;
    return filterSensitiveContext(data, sensitiveFields);
  }, [data, sensitiveFields]);

  useCopilotReadable({
    description,
    value: safeValue,
  });
}
