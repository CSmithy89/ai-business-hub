'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { BookmarkPlus, CalendarDays, ChevronRight, KanbanSquare, LayoutList, Search, Upload, Download, Github, DownloadCloud } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { usePmProject } from '@/hooks/use-pm-projects'
import { usePmTasks, type TaskListItem, type TaskPriority, type TaskStatus, type TaskType } from '@/hooks/use-pm-tasks'
import { usePmTeam } from '@/hooks/use-pm-team'
import { useDefaultView, useSavedViews, type SavedView } from '@/hooks/use-saved-views'
import { usePresence } from '@/hooks/use-presence'
import { PresenceBar } from '@/components/pm/presence/PresenceBar'
import { TASK_PRIORITY_META, TASK_TYPE_META } from '@/lib/pm/task-meta'
import { getViewPreferences, setViewPreferences } from '@/lib/pm/view-preferences'
import type { GroupByOption } from '@/lib/pm/kanban-grouping'
import { cn } from '@/lib/utils'
import { useSession } from '@/lib/auth-client'
import { TaskDetailSheet } from './TaskDetailSheet'
import { TaskListView } from '@/components/pm/views/TaskListView'
import { KanbanBoardView } from '@/components/pm/views/KanbanBoardView'
import { CalendarView } from '@/components/pm/views/CalendarView'
import { TimelineView } from '@/components/pm/views/TimelineView'
import { GroupBySelector } from '@/components/pm/kanban/GroupBySelector'
import { SavedViewsDropdown } from '@/components/pm/saved-views/SavedViewsDropdown'
import { SaveViewModal } from '@/components/pm/saved-views/SaveViewModal'
import { FilterBar } from '@/components/pm/filters/FilterBar'
import { ErrorBoundary } from '@/components/error-boundary'
import type { FilterState } from '@/lib/pm/url-state'
import { CsvImportWizard } from '@/components/pm/imports/CsvImportWizard'
import { CsvExportModal } from '@/components/pm/exports/CsvExportModal'
import { GithubIssuesSyncDialog } from '@/components/pm/integrations/GithubIssuesSyncDialog'
import { JiraImportDialog } from '@/components/pm/imports/JiraImportDialog'
import { AsanaTrelloImportDialog } from '@/components/pm/imports/AsanaTrelloImportDialog'

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
  router.push(`${pathname}?${next.toString()}` as Parameters<typeof router.push>[0])
}

function closeTask(router: ReturnType<typeof useRouter>, pathname: string, searchParams: URLSearchParams) {
  const next = new URLSearchParams(searchParams.toString())
  next.delete('taskId')
  const url = next.toString() ? `${pathname}?${next.toString()}` : pathname
  router.replace(url as Parameters<typeof router.replace>[0])
}

export function ProjectTasksContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const params = useParams<{ slug: string }>()
  const { data: session } = useSession()
  const currentUserId = session?.user?.id ?? null

  const slug = params?.slug
  const taskId = searchParams.get('taskId')
  const viewId = searchParams.get('viewId')

  const { data: projectData, isLoading: projectLoading, error: projectError } = usePmProject(slug)
  const project = projectData?.data

  // Track user presence on this project page
  usePresence({
    projectId: project?.id ?? '',
    page: 'tasks',
    enabled: !!project?.id,
  })

  // Fetch team data for assignee name lookups
  const { data: teamData } = usePmTeam(project?.id ?? '')
  const team = teamData?.data

  // Build name lookup maps for kanban column titles
  const assigneeNames = useMemo(() => {
    if (!team?.members) return undefined
    const map: Record<string, string> = {}
    team.members.forEach((member) => {
      if (member.userId && member.user) {
        map[member.userId] = member.user.name || member.user.email
      }
    })
    return Object.keys(map).length > 0 ? map : undefined
  }, [team?.members])

  const phaseNames = useMemo(() => {
    if (!project?.phases) return undefined
    const map: Record<string, string> = {}
    project.phases.forEach((phase) => {
      map[phase.id] = phase.name
    })
    return Object.keys(map).length > 0 ? map : undefined
  }, [project?.phases])

  // Saved views state
  const [activeSavedViewId, setActiveSavedViewId] = useState<string | null>(null)
  const [saveViewModalOpen, setSaveViewModalOpen] = useState(false)
  const { data: defaultViewData } = useDefaultView(project?.id)
  const defaultView = defaultViewData?.data
  const { data: savedViewsData } = useSavedViews(project?.id)
  const savedViews = savedViewsData?.data ?? []

  const [search, setSearch] = useState('')
  const viewPreferences = useMemo(() => {
    if (!project?.id) return null
    return getViewPreferences(project.id)
  }, [project?.id])
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    priority: null,
    assigneeId: null,
    type: null,
    labels: [],
    dueDateFrom: null,
    dueDateTo: null,
    phaseId: null,
  })
  const [viewMode, setViewMode] = useState<'simple' | 'table' | 'kanban' | 'calendar' | 'timeline'>(() => {
    if (project?.id) {
      const prefs = getViewPreferences(project.id)
      return prefs.viewMode || 'simple'
    }
    return 'simple'
  })

  // Grouping preference for kanban view
  const [groupBy, setGroupBy] = useState<GroupByOption>(() => {
    if (project?.id) {
      const prefs = getViewPreferences(project.id)
      return prefs.kanbanGroupBy || 'status'
    }
    return 'status'
  })
  const [importWizardOpen, setImportWizardOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [githubSyncOpen, setGithubSyncOpen] = useState(false)
  const [jiraImportOpen, setJiraImportOpen] = useState(false)
  const [asanaTrelloImportOpen, setAsanaTrelloImportOpen] = useState(false)

  // Apply default view on mount
  useEffect(() => {
    if (defaultView && !activeSavedViewId && !viewId) {
      applyView(defaultView)
    }
  }, [defaultView?.id, viewId])

  useEffect(() => {
    if (!viewId || !savedViews.length) return
    const sharedView = savedViews.find((view) => view.id === viewId)
    if (sharedView) {
      applyView(sharedView)
    }
  }, [savedViews, viewId])

  // Apply a saved view
  const applyView = (view: SavedView | null) => {
    if (!view) {
      // Reset to "All Tasks"
      setSearch('')
      setFilters({
        status: [],
        priority: null,
        assigneeId: null,
        type: null,
        labels: [],
        dueDateFrom: null,
        dueDateTo: null,
        phaseId: null,
      })
      setViewMode('simple')
      setGroupBy('status')
      setActiveSavedViewId(null)
      return
    }

    setActiveSavedViewId(view.id)
    const nextMode =
      view.viewType === 'KANBAN'
        ? 'kanban'
        : view.viewType === 'CALENDAR'
          ? 'calendar'
          : view.viewType === 'TABLE'
            ? 'table'
            : 'simple'
    setViewMode(nextMode)
    setSearch((view.filters.search as string) || '')

    // Convert saved view filters to new filter format
    const status = view.filters.status as TaskStatus | undefined
    setFilters({
      status: status ? [status] : [],
      priority: (view.filters.priority as TaskPriority) || null,
      assigneeId: null,
      type: (view.filters.type as TaskType) || null,
      labels: [],
      dueDateFrom: null,
      dueDateTo: null,
      phaseId: null,
    })

    if (view.filters.kanbanGroupBy) {
      setGroupBy(view.filters.kanbanGroupBy as GroupByOption)
    }

    if (project?.id) {
      const nextPrefs: Partial<ReturnType<typeof getViewPreferences>> = {}
      if (view.columns && view.columns.length > 0) {
        nextPrefs.listColumns = view.columns
      }
      if (view.sortBy) {
        nextPrefs.sortBy = view.sortBy
      }
      if (view.sortOrder) {
        nextPrefs.sortOrder = view.sortOrder as 'asc' | 'desc'
      }
      if (Object.keys(nextPrefs).length > 0) {
        setViewPreferences(project.id, nextPrefs)
      }
    }
  }

  // Detect if current state differs from saved view (for "Save View" button visibility)
  const hasUnsavedChanges = useMemo(() => {
    // Show save button if filters are applied and we're not viewing a saved view
    // Or if we are viewing a saved view but the current state differs from it
    if (!activeSavedViewId) {
      return (
        search !== '' ||
        filters.status.length > 0 ||
        filters.priority !== null ||
        filters.assigneeId !== null ||
        filters.type !== null ||
        filters.labels.length > 0 ||
        filters.dueDateFrom !== null ||
        filters.dueDateTo !== null ||
        filters.phaseId !== null
      )
    }
    return false
  }, [search, filters, activeSavedViewId])

  const handleGroupByChange = (newGroupBy: GroupByOption) => {
    setGroupBy(newGroupBy)
    if (project?.id) {
      setViewPreferences(project.id, { kanbanGroupBy: newGroupBy })
    }
  }

  const handleViewModeChange = (mode: 'simple' | 'table' | 'kanban' | 'calendar' | 'timeline') => {
    setViewMode(mode)
    if (project?.id) {
      setViewPreferences(project.id, { viewMode: mode })
    }
  }

  const query = useMemo(() => {
    // Convert multi-select status to single status for API
    // If multiple statuses selected, we'll filter client-side
    const singleStatus = filters.status.length === 1 ? filters.status[0] : undefined

    return {
      projectId: project?.id,
      search: search.trim() ? search.trim() : undefined,
      status: singleStatus,
      type: filters.type || undefined,
      priority: filters.priority || undefined,
      assigneeId: filters.assigneeId || undefined,
      phaseId: filters.phaseId || undefined,
      page: 1,
      limit: 50,
    }
  }, [filters, project?.id, search])

  const { data, isLoading, error } = usePmTasks(query)
  const allTasks = data?.data ?? []

  // Client-side filtering for multi-select status, labels, and date ranges
  const tasks = useMemo(() => {
    let filtered = [...allTasks]

    // Multi-status filter (if more than one status selected)
    if (filters.status.length > 1) {
      filtered = filtered.filter((task) => filters.status.includes(task.status))
    }

    // Label filter - Currently disabled as TaskListItem doesn't include labels
    // TODO: Enable when backend returns labels with task list (requires API enhancement)
    // When enabled: filtered = filtered.filter((task) => task.labels?.some(l => filters.labels.includes(l.name)))

    // Date range filter
    if (filters.dueDateFrom || filters.dueDateTo) {
      filtered = filtered.filter((task) => {
        if (!task.dueDate) return false

        const dueDate = new Date(task.dueDate)

        if (filters.dueDateFrom) {
          const fromDate = parseISO(filters.dueDateFrom)
          if (dueDate < fromDate) return false
        }

        if (filters.dueDateTo) {
          const toDate = parseISO(filters.dueDateTo)
          if (dueDate > toDate) return false
        }

        return true
      })
    }

    return filtered
  }, [allTasks, filters])

  // Current view state for saving - must be before early returns to avoid rules-of-hooks violation
  const currentViewState = useMemo(() => {
    const viewType: 'LIST' | 'KANBAN' | 'CALENDAR' | 'TABLE' =
      viewMode === 'kanban'
        ? 'KANBAN'
        : viewMode === 'calendar'
          ? 'CALENDAR'
          : viewMode === 'table'
            ? 'TABLE'
            : 'LIST'

    return {
      viewType,
      filters: {
        search,
        status: filters.status.length === 1 ? filters.status[0] : undefined,
        type: filters.type || undefined,
        priority: filters.priority || undefined,
        assigneeId: filters.assigneeId || undefined,
        phaseId: filters.phaseId || undefined,
      },
      sortBy: viewPreferences?.sortBy,
      sortOrder: viewPreferences?.sortOrder,
      columns: viewPreferences?.listColumns,
      groupBy,
    }
  }, [viewMode, search, filters, groupBy, viewPreferences?.listColumns, viewPreferences?.sortBy, viewPreferences?.sortOrder])

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
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[rgb(var(--color-text-primary))]">Tasks</h1>
            <PresenceBar projectId={project.id} />
          </div>
          <p className="text-sm text-[rgb(var(--color-text-secondary))]">
            {project.name} • {tasks.length} tasks
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Saved Views Dropdown */}
          {currentUserId && (
            <SavedViewsDropdown
              projectId={project.id}
              projectSlug={slug}
              currentUserId={currentUserId}
              onApplyView={applyView}
              onSaveCurrentView={() => setSaveViewModalOpen(true)}
              activeViewId={activeSavedViewId}
              currentViewState={currentViewState}
            />
          )}

          {/* Save View Button */}
          {hasUnsavedChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSaveViewModalOpen(true)}
              className="gap-2"
            >
              <BookmarkPlus className="h-4 w-4" />
              Save View
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setImportWizardOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setExportModalOpen(true)} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setGithubSyncOpen(true)} className="gap-2">
            <Github className="h-4 w-4" />
            Sync Issues
          </Button>
          <Button variant="outline" size="sm" onClick={() => setJiraImportOpen(true)} className="gap-2">
            <DownloadCloud className="h-4 w-4" />
            Import Jira
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAsanaTrelloImportOpen(true)} className="gap-2">
            <DownloadCloud className="h-4 w-4" />
            Import Asana/Trello
          </Button>

          {/* View Mode Toggles */}
          <Button
            variant={viewMode === 'simple' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => handleViewModeChange('simple')}
          >
            Simple
          </Button>
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => handleViewModeChange('table')}
          >
            <LayoutList className="h-4 w-4 mr-2" />
            Table
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => handleViewModeChange('kanban')}
          >
            <KanbanSquare className="h-4 w-4 mr-2" />
            Kanban
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => handleViewModeChange('calendar')}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Calendar
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => handleViewModeChange('timeline')}
          >
            Timeline
          </Button>
          {viewMode === 'kanban' && (
            <GroupBySelector value={groupBy} onChange={handleGroupByChange} />
          )}
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-[rgb(var(--color-text-secondary))]" aria-hidden="true" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filter Bar */}
      <FilterBar
        projectId={project.id}
        projectSlug={slug}
        tasks={allTasks}
        onFiltersChange={setFilters}
      />

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
          onCtaClick={() => router.push(`/dashboard/pm/${slug}`)}
        />
      ) : null}

      {tasks.length ? (
        viewMode === 'calendar' ? (
          <ErrorBoundary errorMessage="Failed to load calendar view">
            <CalendarView
              tasks={tasks}
              onTaskClick={(taskId) => openTask(router, pathname, new URLSearchParams(searchParams.toString()), taskId)}
            />
          </ErrorBoundary>
        ) : viewMode === 'timeline' ? (
          <ErrorBoundary errorMessage="Failed to load timeline view">
            <TimelineView tasks={tasks} />
          </ErrorBoundary>
        ) : viewMode === 'kanban' ? (
          <ErrorBoundary errorMessage="Failed to load kanban view">
            <KanbanBoardView
              tasks={tasks}
              onTaskClick={(taskId) => openTask(router, pathname, new URLSearchParams(searchParams.toString()), taskId)}
              groupBy={groupBy}
              projectId={project.id}
              assigneeNames={assigneeNames}
              phaseNames={phaseNames}
            />
          </ErrorBoundary>
        ) : viewMode === 'table' ? (
          <ErrorBoundary errorMessage="Failed to load table view">
            <TaskListView
              tasks={tasks}
              projectId={project.id}
              isLoading={isLoading}
              onTaskClick={(taskId) => openTask(router, pathname, new URLSearchParams(searchParams.toString()), taskId)}
            />
          </ErrorBoundary>
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

      <CsvImportWizard
        open={importWizardOpen}
        onOpenChange={setImportWizardOpen}
        projectId={project.id}
        phases={project.phases ?? []}
      />
      <CsvExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        projectId={project.id}
        filters={filters}
        search={search}
      />
      <GithubIssuesSyncDialog
        open={githubSyncOpen}
        onOpenChange={setGithubSyncOpen}
        projectId={project.id}
      />
      <JiraImportDialog
        open={jiraImportOpen}
        onOpenChange={setJiraImportOpen}
        projectId={project.id}
      />
      <AsanaTrelloImportDialog
        open={asanaTrelloImportOpen}
        onOpenChange={setAsanaTrelloImportOpen}
        projectId={project.id}
      />

      {/* Save View Modal */}
      <SaveViewModal
        open={saveViewModalOpen}
        onOpenChange={setSaveViewModalOpen}
        projectId={project.id}
        viewState={currentViewState}
        existingView={null}
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
          <Badge variant={statusBadgeVariant(task.status)}>{task.status.replace(/_/g, ' ')}</Badge>
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
