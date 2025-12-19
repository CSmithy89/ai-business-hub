/**
 * Unit tests for Kanban Grouping Utilities
 *
 * Story: PM-03.2 - Kanban Board Basic
 * Story: PM-03.3 - Kanban Drag & Drop
 *
 * Tests the groupTasksIntoColumns and getUpdatePayloadFromGrouping functions.
 */

import { describe, it, expect } from 'vitest'
import {
  groupTasksIntoColumns,
  groupTasksByStatus,
  getUpdatePayloadFromGrouping,
} from './kanban-grouping'
import type { TaskListItem } from '@/hooks/use-pm-tasks'

// Mock task factory
function createMockTask(overrides: Partial<TaskListItem> = {}): TaskListItem {
  return {
    id: overrides.id ?? 'task-1',
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    taskNumber: overrides.taskNumber ?? 1,
    title: overrides.title ?? 'Test Task',
    description: null,
    status: overrides.status ?? 'TODO',
    priority: overrides.priority ?? 'MEDIUM',
    type: overrides.type ?? 'TASK',
    assignmentType: 'HUMAN',
    assigneeId: overrides.assigneeId !== undefined ? overrides.assigneeId : null,
    agentId: null,
    storyPoints: null,
    // Note: phaseId is string in TaskListItem but tests need to handle null for "No Phase" grouping
    // The groupByPhase function handles tasks where phaseId may be missing
    phaseId: (overrides.phaseId as string) ?? '',
    dueDate: overrides.dueDate !== undefined ? overrides.dueDate : null,
    startedAt: null,
    completedAt: null,
    parentId: null,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
    _count: { labels: 0 },
  } as unknown as TaskListItem
}

describe('groupTasksIntoColumns', () => {
  describe('groupBy status', () => {
    it('should create all status columns even when empty', () => {
      const columns = groupTasksIntoColumns([], 'status')

      expect(columns).toHaveLength(5)
      expect(columns.map(c => c.id)).toEqual([
        'BACKLOG',
        'TODO',
        'IN_PROGRESS',
        'REVIEW',
        'DONE',
      ])
    })

    it('should group tasks by status', () => {
      const tasks = [
        createMockTask({ id: '1', status: 'TODO' }),
        createMockTask({ id: '2', status: 'TODO' }),
        createMockTask({ id: '3', status: 'IN_PROGRESS' }),
        createMockTask({ id: '4', status: 'DONE' }),
      ]

      const columns = groupTasksIntoColumns(tasks, 'status')

      expect(columns.find(c => c.id === 'TODO')?.tasks).toHaveLength(2)
      expect(columns.find(c => c.id === 'IN_PROGRESS')?.tasks).toHaveLength(1)
      expect(columns.find(c => c.id === 'DONE')?.tasks).toHaveLength(1)
      expect(columns.find(c => c.id === 'BACKLOG')?.tasks).toHaveLength(0)
      expect(columns.find(c => c.id === 'REVIEW')?.tasks).toHaveLength(0)
    })

    it('should set groupType to status for all columns', () => {
      const columns = groupTasksIntoColumns([], 'status')

      columns.forEach(column => {
        expect(column.groupType).toBe('status')
      })
    })

    it('should apply WIP limits when provided', () => {
      const tasks = [createMockTask({ id: '1', status: 'TODO' })]
      const wipLimits = { TODO: 5, IN_PROGRESS: 3 }

      const columns = groupTasksIntoColumns(tasks, 'status', wipLimits)

      expect(columns.find(c => c.id === 'TODO')?.wipLimit).toBe(5)
      expect(columns.find(c => c.id === 'IN_PROGRESS')?.wipLimit).toBe(3)
      expect(columns.find(c => c.id === 'DONE')?.wipLimit).toBeUndefined()
    })
  })

  describe('groupBy priority', () => {
    it('should create all priority columns in correct order', () => {
      const columns = groupTasksIntoColumns([], 'priority')

      expect(columns).toHaveLength(5)
      expect(columns.map(c => c.id)).toEqual([
        'URGENT',
        'HIGH',
        'MEDIUM',
        'LOW',
        'NONE',
      ])
    })

    it('should group tasks by priority', () => {
      const tasks = [
        createMockTask({ id: '1', priority: 'HIGH' }),
        createMockTask({ id: '2', priority: 'HIGH' }),
        createMockTask({ id: '3', priority: 'LOW' }),
      ]

      const columns = groupTasksIntoColumns(tasks, 'priority')

      expect(columns.find(c => c.id === 'HIGH')?.tasks).toHaveLength(2)
      expect(columns.find(c => c.id === 'LOW')?.tasks).toHaveLength(1)
      expect(columns.find(c => c.id === 'URGENT')?.tasks).toHaveLength(0)
    })

    it('should set groupType to priority for all columns', () => {
      const columns = groupTasksIntoColumns([], 'priority')

      columns.forEach(column => {
        expect(column.groupType).toBe('priority')
      })
    })
  })

  describe('groupBy assignee', () => {
    it('should create columns for each unique assignee plus unassigned', () => {
      const tasks = [
        createMockTask({ id: '1', assigneeId: 'user-1' }),
        createMockTask({ id: '2', assigneeId: 'user-2' }),
        createMockTask({ id: '3', assigneeId: 'user-1' }),
        createMockTask({ id: '4', assigneeId: null }),
      ]

      const columns = groupTasksIntoColumns(tasks, 'assignee')

      // Should have user-1, user-2, and unassigned columns
      expect(columns).toHaveLength(3)
      expect(columns.find(c => c.id === 'user-1')?.tasks).toHaveLength(2)
      expect(columns.find(c => c.id === 'user-2')?.tasks).toHaveLength(1)
      expect(columns.find(c => c.id === 'unassigned')?.tasks).toHaveLength(1)
    })

    it('should always include unassigned column', () => {
      const tasks = [createMockTask({ id: '1', assigneeId: 'user-1' })]

      const columns = groupTasksIntoColumns(tasks, 'assignee')

      expect(columns.find(c => c.id === 'unassigned')).toBeDefined()
    })

    it('should set groupValue to null for unassigned column', () => {
      const columns = groupTasksIntoColumns([], 'assignee')

      const unassignedColumn = columns.find(c => c.id === 'unassigned')
      expect(unassignedColumn?.groupValue).toBeNull()
    })
  })

  describe('groupBy type', () => {
    it('should create all type columns in correct order', () => {
      const columns = groupTasksIntoColumns([], 'type')

      expect(columns).toHaveLength(7)
      expect(columns.map(c => c.id)).toEqual([
        'EPIC',
        'STORY',
        'TASK',
        'SUBTASK',
        'BUG',
        'RESEARCH',
        'CONTENT',
      ])
    })

    it('should group tasks by type', () => {
      const tasks = [
        createMockTask({ id: '1', type: 'BUG' }),
        createMockTask({ id: '2', type: 'TASK' }),
        createMockTask({ id: '3', type: 'BUG' }),
      ]

      const columns = groupTasksIntoColumns(tasks, 'type')

      expect(columns.find(c => c.id === 'BUG')?.tasks).toHaveLength(2)
      expect(columns.find(c => c.id === 'TASK')?.tasks).toHaveLength(1)
    })
  })

  describe('groupBy phase', () => {
    it('should create columns for each unique phase plus no-phase', () => {
      const tasks = [
        createMockTask({ id: '1', phaseId: 'phase-1' }),
        createMockTask({ id: '2', phaseId: 'phase-2' }),
        createMockTask({ id: '3', phaseId: undefined }),
      ]

      const columns = groupTasksIntoColumns(tasks, 'phase')

      expect(columns).toHaveLength(3)
      expect(columns.find(c => c.id === 'phase-1')?.tasks).toHaveLength(1)
      expect(columns.find(c => c.id === 'phase-2')?.tasks).toHaveLength(1)
      expect(columns.find(c => c.id === 'no-phase')?.tasks).toHaveLength(1)
    })

    it('should set groupValue to null for no-phase column', () => {
      const columns = groupTasksIntoColumns([], 'phase')

      const noPhaseColumn = columns.find(c => c.id === 'no-phase')
      expect(noPhaseColumn?.groupValue).toBeNull()
    })
  })

  describe('default behavior', () => {
    it('should default to status grouping for unknown groupBy values', () => {
      // @ts-expect-error Testing invalid input
      const columns = groupTasksIntoColumns([], 'invalid')

      expect(columns).toHaveLength(5)
      expect(columns[0].groupType).toBe('status')
    })
  })
})

describe('groupTasksByStatus', () => {
  it('should be an alias for groupTasksIntoColumns with status', () => {
    const tasks = [
      createMockTask({ id: '1', status: 'TODO' }),
      createMockTask({ id: '2', status: 'DONE' }),
    ]

    const result1 = groupTasksByStatus(tasks)
    const result2 = groupTasksIntoColumns(tasks, 'status')

    expect(result1).toEqual(result2)
  })
})

describe('getUpdatePayloadFromGrouping', () => {
  describe('status grouping', () => {
    it('should return status update payload', () => {
      const payload = getUpdatePayloadFromGrouping('status', 'IN_PROGRESS')

      expect(payload).toEqual({ status: 'IN_PROGRESS' })
    })
  })

  describe('priority grouping', () => {
    it('should return priority update payload', () => {
      const payload = getUpdatePayloadFromGrouping('priority', 'HIGH')

      expect(payload).toEqual({ priority: 'HIGH' })
    })
  })

  describe('assignee grouping', () => {
    it('should return assigneeId update payload for user', () => {
      const payload = getUpdatePayloadFromGrouping('assignee', 'user-123')

      expect(payload).toEqual({ assigneeId: 'user-123' })
    })

    it('should return null assigneeId for unassigned column', () => {
      const payload = getUpdatePayloadFromGrouping('assignee', 'unassigned')

      expect(payload).toEqual({ assigneeId: null })
    })
  })

  describe('type grouping', () => {
    it('should return type update payload', () => {
      const payload = getUpdatePayloadFromGrouping('type', 'BUG')

      expect(payload).toEqual({ type: 'BUG' })
    })
  })

  describe('phase grouping', () => {
    it('should return phaseId update payload for phase', () => {
      const payload = getUpdatePayloadFromGrouping('phase', 'phase-123')

      expect(payload).toEqual({ phaseId: 'phase-123' })
    })

    it('should return null phaseId for no-phase column', () => {
      const payload = getUpdatePayloadFromGrouping('phase', 'no-phase')

      expect(payload).toEqual({ phaseId: null })
    })
  })

  describe('default behavior', () => {
    it('should return empty object for unknown groupBy values', () => {
      // @ts-expect-error Testing invalid input
      const payload = getUpdatePayloadFromGrouping('invalid', 'some-value')

      expect(payload).toEqual({})
    })
  })
})
