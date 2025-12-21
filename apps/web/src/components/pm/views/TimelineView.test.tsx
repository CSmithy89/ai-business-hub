import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TimelineView } from './TimelineView'
import type { TaskListItem } from '@/hooks/use-pm-tasks'
import { usePmDependencies } from '@/hooks/use-pm-dependencies'
import { useUpdatePmTask } from '@/hooks/use-pm-tasks'

vi.mock('@/hooks/use-pm-dependencies', () => ({
  usePmDependencies: vi.fn(),
}))

vi.mock('@/hooks/use-pm-tasks', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/use-pm-tasks')>('@/hooks/use-pm-tasks')
  return {
    ...actual,
    useUpdatePmTask: vi.fn(),
  }
})

const baseTask = (overrides: Partial<TaskListItem>): TaskListItem => ({
  id: 'task-1',
  workspaceId: 'ws-1',
  projectId: 'proj-1',
  phaseId: 'phase-1',
  taskNumber: 1,
  title: 'Task A',
  description: null,
  type: 'TASK',
  priority: 'MEDIUM',
  assignmentType: 'HUMAN',
  assigneeId: null,
  agentId: null,
  storyPoints: null,
  status: 'TODO',
  dueDate: '2025-01-03T00:00:00.000Z',
  startedAt: '2025-01-01T00:00:00.000Z',
  completedAt: null,
  parentId: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  ...overrides,
})

describe('TimelineView', () => {
  beforeEach(() => {
    vi.mocked(usePmDependencies).mockReturnValue({
      data: { data: { relations: [] } },
    } as any)
  })

  it('highlights critical path based on dependency relations', () => {
    vi.mocked(usePmDependencies).mockReturnValue({
      data: {
        data: {
          relations: [
            {
              id: 'rel-1',
              relationType: 'BLOCKS',
              createdAt: '2025-01-01T00:00:00.000Z',
              source: {
                taskId: 'task-1',
                taskNumber: 1,
                title: 'Task A',
                projectId: 'proj-1',
                projectSlug: 'alpha',
                projectName: 'Alpha',
              },
              target: {
                taskId: 'task-2',
                taskNumber: 2,
                title: 'Task B',
                projectId: 'proj-1',
                projectSlug: 'alpha',
                projectName: 'Alpha',
              },
            },
          ],
        },
      },
    } as any)

    vi.mocked(useUpdatePmTask).mockReturnValue({ mutate: vi.fn() } as any)

    const tasks = [
      baseTask({ id: 'task-1', title: 'Task A', taskNumber: 1 }),
      baseTask({
        id: 'task-2',
        title: 'Task B',
        taskNumber: 2,
        startedAt: '2025-01-04T00:00:00.000Z',
        dueDate: '2025-01-05T00:00:00.000Z',
      }),
    ]

    render(<TimelineView tasks={tasks} />)

    expect(screen.getAllByText('Critical')).toHaveLength(2)
  })

  it('dispatches updates on drag', () => {
    const mutate = vi.fn()
    vi.mocked(useUpdatePmTask).mockReturnValue({ mutate } as any)

    const tasks = [baseTask({ id: 'task-1', title: 'Task A', taskNumber: 1 })]

    render(<TimelineView tasks={tasks} />)

    const bar = screen.getByRole('button', { name: /Task A/i })
    fireEvent.mouseDown(bar, { clientX: 100 })
    fireEvent.mouseMove(window, { clientX: 118 })
    fireEvent.mouseUp(window)

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 'task-1',
        input: expect.objectContaining({
          startedAt: expect.stringContaining('2025-01-02'),
          dueDate: expect.stringContaining('2025-01-04'),
        }),
      }),
    )
  })

  it('renders without crashing on circular dependencies', () => {
    vi.mocked(usePmDependencies).mockReturnValue({
      data: {
        data: {
          relations: [
            {
              id: 'rel-1',
              relationType: 'BLOCKS',
              createdAt: '2025-01-01T00:00:00.000Z',
              source: {
                taskId: 'task-1',
                taskNumber: 1,
                title: 'Task A',
                projectId: 'proj-1',
                projectSlug: 'alpha',
                projectName: 'Alpha',
              },
              target: {
                taskId: 'task-2',
                taskNumber: 2,
                title: 'Task B',
                projectId: 'proj-1',
                projectSlug: 'alpha',
                projectName: 'Alpha',
              },
            },
            {
              id: 'rel-2',
              relationType: 'BLOCKS',
              createdAt: '2025-01-01T00:00:00.000Z',
              source: {
                taskId: 'task-2',
                taskNumber: 2,
                title: 'Task B',
                projectId: 'proj-1',
                projectSlug: 'alpha',
                projectName: 'Alpha',
              },
              target: {
                taskId: 'task-1',
                taskNumber: 1,
                title: 'Task A',
                projectId: 'proj-1',
                projectSlug: 'alpha',
                projectName: 'Alpha',
              },
            },
          ],
        },
      },
    } as any)

    vi.mocked(useUpdatePmTask).mockReturnValue({ mutate: vi.fn() } as any)

    const tasks = [
      baseTask({ id: 'task-1', title: 'Task A', taskNumber: 1 }),
      baseTask({ id: 'task-2', title: 'Task B', taskNumber: 2 }),
    ]

    render(<TimelineView tasks={tasks} />)

    expect(screen.getByText('Timeline')).toBeInTheDocument()
  })
})
