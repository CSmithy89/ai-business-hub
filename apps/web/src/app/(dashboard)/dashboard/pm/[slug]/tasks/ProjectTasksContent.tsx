'use client'

import { useMemo, useState } from 'react'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { CalendarDays, ChevronRight, Filter, KanbanSquare, LayoutList, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePmProject } from '@/hooks/use-pm-projects'
import { usePmTasks, type TaskListItem, type TaskPriority, type TaskStatus, type TaskType } from '@/hooks/use-pm-tasks'
import { TASK_PRIORITIES, TASK_PRIORITY_META, TASK_TYPES, TASK_TYPE_META } from '@/lib/pm/task-meta'
import { getViewPreferences, setViewPreferences } from '@/lib/pm/view-preferences'
import type { GroupByOption } from '@/lib/pm/kanban-grouping'
import { cn } from '@/lib/utils'
import { TaskDetailSheet } from './TaskDetailSheet'
import { TaskListView } from '@/components/pm/views/TaskListView'
import { KanbanBoardView } from '@/components/pm/views/KanbanBoardView'
import { GroupBySelector } from '@/components/pm/kanban/GroupBySelector'

const TASK_STATUSES: TaskStatus[] = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'AWAITING_APPROVAL',
  'DONE',
  'CANCELLED',
]

function formatDate(value: string | null): string {
  if (!value) return '—'
  try {
    return format(parseISO(value), 'MMM d')
  } catch {
    return '—'
  }
}

function statusBadgeVariant(status: TaskStatus): 'secondary' | 'outline' | 'success' | 'destructive' {
  if (status === 'DONE') return 'success'
  if (status === 'CANCELLED') return 'destructive'
  if (status === 'IN_PROGRESS') return 'secondary'
  return 'outline'
}

function openTask(router: ReturnType<typeof useRouter>, pathname: string, searchParams: URLSearchParams, taskId: string) {
  const next = new URLSearchParams(searchParams.toString())
  next.set('taskId', taskId)
  router.push(`${pathname}?${next.toString()}` as any)
}

function closeTask(router: ReturnType<typeof useRouter>, pathname: string, searchParams: URLSearchParams) {
  const next = new URLSearchParams(searchParams.toString())
  next.delete('taskId')
  const url = next.toString() ? `${pathname}?${next.toString()}` : pathname
  router.replace(url as any)
}

export function ProjectTasksContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const params = useParams<{ slug: string }>()

  const slug = params?.slug
  const taskId = searchParams.get('taskId')

  const { data: projectData, isLoading: projectLoading, error: projectError } = usePmProject(slug)
  const project = projectData?.data

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<TaskStatus | 'all'>('all')
  const [type, setType] = useState<TaskType | 'all'>('all')
  const [priority, setPriority] = useState<TaskPriority | 'all'>('all')
  const [viewMode, setViewMode] = useState<'simple' | 'table' | 'kanban'>('simple')

  // Grouping preference for kanban view
  const [groupBy, setGroupBy] = useState<GroupByOption>(() => {
    if (project?.id) {
      const prefs = getViewPreferences(project.id)
      return prefs.kanbanGroupBy || 'status'
    }
    return 'status'
  })

  const handleGroupByChange = (newGroupBy: GroupByOption) => {
    setGroupBy(newGroupBy)
    if (project?.id) {
      setViewPreferences(project.id, { kanbanGroupBy: newGroupBy })
    }
  }

  const query = useMemo(() => {
    return {
      projectId: project?.id,
      search: search.trim() ? search.trim() : undefined,
      status: status === 'all' ? undefined : status,
      type: type === 'all' ? undefined : type,
      priority: priority === 'all' ? undefined : priority,
      page: 1,
      limit: 50,
    }
  }, [priority, project?.id, search, status, type])

  const { data, isLoading, error } = usePmTasks(query)
  const tasks = data?.data ?? []

  if (projectError) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-red-600">{projectError.message}</p>
        </CardContent>
      </Card>
    )
  }

  if (projectLoading || !project) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-[rgb(var(--color-text-secondary))]">Loading…</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--color-text-primary))]">Tasks</h1>
          <p className="text-sm text-[rgb(var(--color-text-secondary))]">
            {project.name} • {tasks.length} tasks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'simple' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('simple')}
          >
            Simple
          </Button>
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <LayoutList className="h-4 w-4 mr-2" />
            Table
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            <KanbanSquare className="h-4 w-4 mr-2" />
            Kanban
          </Button>
          {viewMode === 'kanban' && (
            <GroupBySelector value={groupBy} onChange={handleGroupByChange} />
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-[rgb(var(--color-text-secondary))]" aria-hidden="true" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[rgb(var(--color-text-secondary))]" aria-hidden="true" />
            <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {TASK_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[rgb(var(--color-text-secondary))]" aria-hidden="true" />
            <Select value={type} onValueChange={(value) => setType(value as TaskType | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {TASK_TYPES.map((value) => {
                  const meta = TASK_TYPE_META[value]
                  const Icon = meta.icon
                  return (
                    <SelectItem key={value} value={value}>
                      <span className="inline-flex items-center gap-2">
                        <Icon className={cn('h-4 w-4', meta.iconClassName)} aria-hidden="true" />
                        {meta.label}
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[rgb(var(--color-text-secondary))]" aria-hidden="true" />
            <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {TASK_PRIORITIES.map((value) => {
                  const meta = TASK_PRIORITY_META[value]
                  return (
                    <SelectItem key={value} value={value}>
                      <span className="inline-flex items-center gap-2">
                        <span className={cn('h-2.5 w-2.5 rounded-full', meta.dotClassName)} aria-hidden="true" />
                        {meta.label}
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-red-600">{error.message}</p>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-[rgb(var(--color-text-secondary))]">Loading tasks…</p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && tasks.length === 0 ? (
        <EmptyState
          icon={ChevronRight}
          headline="No tasks yet"
          description="Press `c` on any project page to quick capture, or create via API."
          ctaText="Back to overview"
          onCtaClick={() => router.push(`/dashboard/pm/${slug}` as any)}
        />
      ) : null}

      {tasks.length ? (
        viewMode === 'kanban' ? (
          <KanbanBoardView
            tasks={tasks}
            onTaskClick={(taskId) => openTask(router, pathname, new URLSearchParams(searchParams.toString()), taskId)}
            groupBy={groupBy}
            projectId={project.id}
          />
        ) : viewMode === 'table' ? (
          <TaskListView
            tasks={tasks}
            projectId={project.id}
            isLoading={isLoading}
            onTaskClick={(taskId) => openTask(router, pathname, new URLSearchParams(searchParams.toString()), taskId)}
          />
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Task List</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-[rgb(var(--color-border-default))]">
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onClick={() => openTask(router, pathname, new URLSearchParams(searchParams.toString()), task.id)}
                />
              ))}
            </CardContent>
          </Card>
        )
      ) : null}

      <TaskDetailSheet
        taskId={taskId}
        open={!!taskId}
        onOpenChange={(open) => {
          if (!open) closeTask(router, pathname, new URLSearchParams(searchParams.toString()))
        }}
      />
    </div>
  )
}

function TaskRow({ task, onClick }: { task: TaskListItem; onClick: () => void }) {
  const typeMeta = TASK_TYPE_META[task.type]
  const TypeIcon = typeMeta.icon
  const priorityMeta = TASK_PRIORITY_META[task.priority]

  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center justify-between gap-3 py-3 text-left',
        'hover:bg-[rgb(var(--color-bg-tertiary))] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary-500))]',
      )}
      onClick={onClick}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <TypeIcon className={cn('h-4 w-4 shrink-0', typeMeta.iconClassName)} aria-hidden="true" />
          <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">
            #{task.taskNumber}
          </span>
          <span className="truncate text-sm font-medium text-[rgb(var(--color-text-primary))]">
            {task.title}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--color-text-secondary))]">
          <Badge variant={statusBadgeVariant(task.status) as any}>{task.status.replace(/_/g, ' ')}</Badge>
          <span className="inline-flex items-center gap-1.5">
            <span className={cn('h-2.5 w-2.5 rounded-full', priorityMeta.dotClassName)} aria-hidden="true" />
            {priorityMeta.label}
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDate(task.dueDate)}
          </span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-[rgb(var(--color-text-secondary))]" aria-hidden="true" />
    </button>
  )
}
