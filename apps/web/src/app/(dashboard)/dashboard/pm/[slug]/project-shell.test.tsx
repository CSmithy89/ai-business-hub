import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ProjectShell } from './project-shell'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  project: {
    id: 'proj-1',
    phases: [
      { id: 'phase-1', name: 'Plan', phaseNumber: 1, status: 'CURRENT' as const },
      { id: 'phase-2', name: 'Build', phaseNumber: 2, status: 'PLANNED' as const },
    ],
  },
  createTask: {
    mutateAsync: vi.fn().mockResolvedValue({ data: { id: 'task-123' } }),
    isPending: false,
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
  useParams: () => ({ slug: 'acme' }),
}))

vi.mock('@/hooks/use-pm-projects', () => ({
  usePmProject: () => ({ data: { data: mocks.project } }),
}))

vi.mock('@/hooks/use-pm-tasks', () => ({
  useCreatePmTask: () => mocks.createTask,
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
}))

describe('ProjectShell', () => {
  beforeAll(() => {
    if (!('ResizeObserver' in globalThis)) {
      const ResizeObserverPolyfill = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
      ;(globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
        ResizeObserverPolyfill as unknown as typeof ResizeObserver
    }
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens quick capture on `c`', async () => {
    render(
      <ProjectShell>
        <div>Child</div>
      </ProjectShell>
    )

    fireEvent.keyDown(document, { key: 'c' })

    await waitFor(() => {
      expect(screen.getByText('Quick capture')).toBeInTheDocument()
    })
  })

  it('creates and deep-links on Shift+Enter', async () => {
    render(
      <ProjectShell>
        <div>Child</div>
      </ProjectShell>
    )

    fireEvent.keyDown(document, { key: 'c' })
    await screen.findByText('Quick capture')

    fireEvent.change(screen.getByPlaceholderText('What needs doing?'), { target: { value: 'Ship it' } })
    fireEvent.keyDown(screen.getByPlaceholderText('What needs doing?'), { key: 'Enter', shiftKey: true })

    await waitFor(() => {
      expect(mocks.createTask.mutateAsync).toHaveBeenCalledWith({
        input: { projectId: 'proj-1', phaseId: 'phase-1', title: 'Ship it' },
      })
    })

    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith('/dashboard/pm/acme/tasks?taskId=task-123')
    })
  })
})
