/**
 * Context Provider Components
 *
 * React components that provide context to CopilotKit agents.
 * These wrap application sections and expose relevant context
 * via the useCopilotReadable hooks.
 *
 * @see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
 * Epic: DM-06 | Story: DM-06.1
 */
'use client';

import { ReactNode } from 'react';
import {
  useProjectContext,
  useSelectionContext,
  useActivityContext,
  useDocumentContext,
  useWorkspaceContext,
  useViewContext,
  type ProjectContext,
  type SelectionContext,
  type ActivityContext,
  type DocumentContext,
  type WorkspaceContext,
  type ViewContext,
} from '@/lib/context';

// =============================================================================
// INDIVIDUAL PROVIDERS
// =============================================================================

interface ProjectContextProviderProps {
  project: ProjectContext | null;
  children: ReactNode;
}

/**
 * Provides project context to child components and agents.
 *
 * @example
 * ```tsx
 * <ProjectContextProvider project={currentProject}>
 *   <ProjectDetails />
 * </ProjectContextProvider>
 * ```
 */
export function ProjectContextProvider({
  project,
  children,
}: ProjectContextProviderProps) {
  useProjectContext(project);
  return <>{children}</>;
}

interface SelectionContextProviderProps {
  selection: SelectionContext | null;
  children: ReactNode;
}

/**
 * Provides selection context to child components and agents.
 *
 * @example
 * ```tsx
 * <SelectionContextProvider selection={currentSelection}>
 *   <TaskList />
 * </SelectionContextProvider>
 * ```
 */
export function SelectionContextProvider({
  selection,
  children,
}: SelectionContextProviderProps) {
  useSelectionContext(selection);
  return <>{children}</>;
}

interface ActivityContextProviderProps {
  activity: ActivityContext | null;
  children: ReactNode;
}

/**
 * Provides activity context to child components and agents.
 *
 * @example
 * ```tsx
 * <ActivityContextProvider activity={userActivity}>
 *   <Dashboard />
 * </ActivityContextProvider>
 * ```
 */
export function ActivityContextProvider({
  activity,
  children,
}: ActivityContextProviderProps) {
  useActivityContext(activity);
  return <>{children}</>;
}

interface DocumentContextProviderProps {
  document: DocumentContext | null;
  children: ReactNode;
}

/**
 * Provides document context to child components and agents.
 *
 * @example
 * ```tsx
 * <DocumentContextProvider document={editingDocument}>
 *   <Editor />
 * </DocumentContextProvider>
 * ```
 */
export function DocumentContextProvider({
  document,
  children,
}: DocumentContextProviderProps) {
  useDocumentContext(document);
  return <>{children}</>;
}

interface WorkspaceContextProviderProps {
  workspace: WorkspaceContext | null;
  children: ReactNode;
}

/**
 * Provides workspace context to child components and agents.
 *
 * @example
 * ```tsx
 * <WorkspaceContextProvider workspace={currentWorkspace}>
 *   <WorkspaceLayout />
 * </WorkspaceContextProvider>
 * ```
 */
export function WorkspaceContextProvider({
  workspace,
  children,
}: WorkspaceContextProviderProps) {
  useWorkspaceContext(workspace);
  return <>{children}</>;
}

interface ViewContextProviderProps {
  view: ViewContext | null;
  children: ReactNode;
}

/**
 * Provides view context to child components and agents.
 *
 * @example
 * ```tsx
 * <ViewContextProvider view={currentView}>
 *   <TaskBoard />
 * </ViewContextProvider>
 * ```
 */
export function ViewContextProvider({
  view,
  children,
}: ViewContextProviderProps) {
  useViewContext(view);
  return <>{children}</>;
}

// =============================================================================
// COMPOSITE PROVIDER
// =============================================================================

interface CompositeContextProviderProps {
  project?: ProjectContext | null;
  selection?: SelectionContext | null;
  activity?: ActivityContext | null;
  document?: DocumentContext | null;
  workspace?: WorkspaceContext | null;
  view?: ViewContext | null;
  children: ReactNode;
}

/**
 * Composite context provider that combines multiple context sources.
 *
 * Provides a convenient way to expose multiple context types at once.
 * All context types are optional - only provided contexts will be exposed.
 *
 * @example
 * ```tsx
 * <CompositeContextProvider
 *   project={currentProject}
 *   selection={selectedItems}
 *   activity={userActivity}
 *   workspace={currentWorkspace}
 * >
 *   <Dashboard />
 * </CompositeContextProvider>
 * ```
 */
export function CompositeContextProvider({
  project,
  selection,
  activity,
  document,
  workspace,
  view,
  children,
}: CompositeContextProviderProps) {
  // Call all context hooks - they handle null values gracefully
  useProjectContext(project ?? null);
  useSelectionContext(selection ?? null);
  useActivityContext(activity ?? null);
  useDocumentContext(document ?? null);
  useWorkspaceContext(workspace ?? null);
  useViewContext(view ?? null);

  return <>{children}</>;
}
