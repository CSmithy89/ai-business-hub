/**
 * PM View Preferences
 *
 * Story: PM-03.1 - Task List View
 * Story: PM-03.3 - Kanban Drag & Drop
 *
 * Utilities for managing user view preferences in localStorage.
 * Preferences are stored per project to allow different settings for each project.
 */

import type { GroupByOption } from './kanban-grouping'

export interface ViewPreferences {
  /** Visible column IDs in list view */
  listColumns: string[]
  /** Sort field */
  sortBy?: string
  /** Sort direction */
  sortOrder?: 'asc' | 'desc'
  /** Kanban board grouping option */
  kanbanGroupBy?: GroupByOption
  /** Active view mode: simple, table, kanban, calendar, or timeline */
  viewMode?: 'simple' | 'table' | 'kanban' | 'calendar' | 'timeline'
}

/** Default column configuration for list view */
const DEFAULT_COLUMNS = [
  'select',
  'taskNumber',
  'title',
  'status',
  'priority',
  'assigneeId',
  'dueDate',
]

/**
 * Get view preferences for a project from localStorage
 */
export function getViewPreferences(projectId: string): ViewPreferences {
  if (typeof window === 'undefined') {
    return getDefaultPreferences()
  }

  const key = `pm-view-prefs-${projectId}`
  const stored = localStorage.getItem(key)

  if (stored) {
    try {
      const parsed = JSON.parse(stored) as ViewPreferences
      // Ensure all required fields exist
      return {
        listColumns: parsed.listColumns || DEFAULT_COLUMNS,
        sortBy: parsed.sortBy,
        sortOrder: parsed.sortOrder,
        kanbanGroupBy: parsed.kanbanGroupBy || 'status',
        viewMode: parsed.viewMode || 'simple',
      }
    } catch {
      return getDefaultPreferences()
    }
  }

  return getDefaultPreferences()
}

/**
 * Save view preferences for a project to localStorage
 */
export function setViewPreferences(
  projectId: string,
  prefs: Partial<ViewPreferences>
): void {
  if (typeof window === 'undefined') {
    return
  }

  const key = `pm-view-prefs-${projectId}`
  const current = getViewPreferences(projectId)
  const updated = { ...current, ...prefs }

  try {
    localStorage.setItem(key, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save view preferences:', error)
  }
}

/**
 * Get default preferences
 */
function getDefaultPreferences(): ViewPreferences {
  return {
    listColumns: DEFAULT_COLUMNS,
    sortBy: undefined,
    sortOrder: undefined,
    kanbanGroupBy: 'status',
    viewMode: 'simple',
  }
}

/**
 * Check if a column is visible
 */
export function isColumnVisible(
  projectId: string,
  columnId: string
): boolean {
  const prefs = getViewPreferences(projectId)
  return prefs.listColumns.includes(columnId)
}

/**
 * Toggle column visibility
 */
export function toggleColumnVisibility(
  projectId: string,
  columnId: string
): void {
  const prefs = getViewPreferences(projectId)
  const columns = prefs.listColumns

  if (columns.includes(columnId)) {
    // Remove column
    setViewPreferences(projectId, {
      listColumns: columns.filter((id) => id !== columnId),
    })
  } else {
    // Add column
    setViewPreferences(projectId, {
      listColumns: [...columns, columnId],
    })
  }
}
