/**
 * CopilotKit Context Provider Types - Story DM-01.5
 *
 * TypeScript interfaces for CopilotKit context data shapes.
 * These types define the structure of context information
 * shared with AI agents via useCopilotReadable.
 *
 * @see https://docs.copilotkit.ai/reference/hooks/useCopilotReadable
 * Epic: DM-01 | Story: DM-01.5
 */

/**
 * High-level page section identifiers
 * Used to help agents understand what area of the app the user is in
 */
export type PageSection =
  | 'dashboard'
  | 'projects'
  | 'project-detail'
  | 'tasks'
  | 'knowledge-base'
  | 'settings'
  | 'onboarding'
  | 'other';

/**
 * Page/navigation context provided to agents
 *
 * Tracks the user's current location in the application,
 * enabling agents to provide location-aware assistance.
 */
export interface PageContext {
  /** Current URL pathname (e.g., "/dashboard/pm/projects/my-project") */
  pathname: string;

  /** High-level section identifier for quick context */
  section: PageSection;

  /** URL parameters extracted from the route (e.g., { slug: "my-project" }) */
  params: Record<string, string>;

  /** Query string parameters (e.g., { view: "kanban", filter: "active" }) */
  searchParams: Record<string, string>;
}

/**
 * Progress metrics for a project
 */
export interface ProjectProgress {
  /** Total number of tasks in the project */
  totalTasks: number;

  /** Number of completed tasks */
  completedTasks: number;

  /** Completion percentage (0-100) */
  percentage: number;
}

/**
 * Current phase information for a project
 */
export interface ProjectPhaseInfo {
  /** Phase ID */
  id: string;

  /** Phase display name */
  name: string;

  /** Phase number (1-based) */
  phaseNumber: number;
}

/**
 * Project context provided to agents
 *
 * Contains information about the currently active project,
 * enabling agents to provide project-specific assistance.
 */
export interface ProjectContext {
  /** Project ID (CUID) */
  id: string;

  /** URL-friendly project identifier */
  slug: string;

  /** Project display name */
  name: string;

  /** Current project status (e.g., "ACTIVE", "ON_HOLD", "COMPLETED") */
  status: string;

  /** Project type (e.g., "STANDARD", "TEMPLATE", "PERSONAL") */
  type: string;

  /** Progress metrics */
  progress: ProjectProgress;

  /** Current/active phase information, or null if no phases */
  currentPhase: ProjectPhaseInfo | null;

  /** Target completion date in ISO format, or null if not set */
  targetDate: string | null;
}

/**
 * Minimal task information for selection context
 *
 * Only includes essential fields to keep context lightweight
 * while still providing enough information for agents.
 */
export interface SelectedTaskSummary {
  /** Task ID */
  id: string;

  /** Task title */
  title: string;

  /** Task status (e.g., "TODO", "IN_PROGRESS", "DONE") */
  status: string;

  /** Task priority (e.g., "HIGH", "MEDIUM", "LOW") */
  priority: string;

  /** Task type (e.g., "TASK", "BUG", "STORY") */
  type: string;
}

/**
 * Task selection context provided to agents
 *
 * Tracks which tasks the user has selected in list/kanban views,
 * enabling agents to perform bulk operations or provide
 * targeted assistance for selected items.
 */
export interface SelectionContext {
  /** Number of selected items */
  count: number;

  /** Array of selected task IDs */
  taskIds: string[];

  /** Summary information for each selected task */
  tasks: SelectedTaskSummary[];
}
