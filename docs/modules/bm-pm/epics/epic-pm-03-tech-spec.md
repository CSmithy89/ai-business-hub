# Epic PM-03: Views & Navigation - Technical Specification

**Epic:** PM-03
**Status:** Contexted
**Created:** 2025-12-18
**Author:** AI Business Hub Team
**Version:** 1.0

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Library Selection & Rationale](#library-selection--rationale)
4. [Component Architecture](#component-architecture)
5. [API Layer](#api-layer)
6. [State Management](#state-management)
7. [Story-by-Story Technical Breakdown](#story-by-story-technical-breakdown)
8. [Data Models & Schema](#data-models--schema)
9. [Performance Considerations](#performance-considerations)
10. [Testing Strategy](#testing-strategy)
11. [Dependencies & Integration Points](#dependencies--integration-points)
12. [Open Questions & Decisions](#open-questions--decisions)

---

## Executive Summary

Epic PM-03 delivers comprehensive task visualization and navigation capabilities through three primary view types (List, Kanban, Calendar) with advanced filtering, saved views, and bulk operations. This epic transforms the basic task management system from PM-02 into a production-ready project management interface.

### Key Deliverables

- **List View**: High-performance sortable table with virtualization (TanStack Table)
- **Kanban Board**: Drag-drop board with flexible grouping (@dnd-kit)
- **Calendar View**: Timeline visualization with drag-to-reschedule
- **Advanced Filtering**: URL-based filter state with persistence
- **Saved Views**: CRUD for filter/sort/column configurations
- **Bulk Operations**: Multi-select with bulk actions and keyboard shortcuts

### Technical Approach

- **Performance**: Virtualization for list view, optimistic updates for drag-drop
- **URL State**: Shareable filter URLs using Next.js searchParams
- **Real-time**: WebSocket integration for multi-user updates
- **Progressive Enhancement**: Views work without JS, enhanced with interactions

---

## Architecture Overview

### View Architecture Pattern

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     Project Tasks Page                                    │
│                  /[workspaceSlug]/pm/projects/[id]/tasks                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌────────────────────────────────────────────────────────────────┐    │
│   │                    View Switcher Bar                            │    │
│   │   [List] [Kanban] [Calendar]  |  View: [Saved View Dropdown]  │    │
│   └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│   ┌────────────────────────────────────────────────────────────────┐    │
│   │                    Filter Bar                                   │    │
│   │  Status: [Multi] Priority: [Any] Assignee: [Any] [Clear]      │    │
│   └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│   ┌────────────────────────────────────────────────────────────────┐    │
│   │                  Current View Renderer                          │    │
│   │                                                                 │    │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │    │
│   │  │  ListView   │  │ KanbanView  │  │ CalendarView│            │    │
│   │  │             │  │             │  │             │            │    │
│   │  │ TanStack    │  │ @dnd-kit    │  │ Custom      │            │    │
│   │  │ Table       │  │ DnD         │  │ Calendar    │            │    │
│   │  └─────────────┘  └─────────────┘  └─────────────┘            │    │
│   └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
TasksPage
├── ViewSwitcher (PM-03.7)
│   ├── ViewTypeToggle (List/Kanban/Calendar)
│   └── SavedViewDropdown
├── FilterBar (PM-03.7)
│   ├── StatusFilter (multi-select)
│   ├── PriorityFilter
│   ├── AssigneeFilter
│   ├── TypeFilter
│   ├── DateRangeFilter
│   └── FilterChips
├── BulkActionsBar (PM-03.8)
│   └── CommandBar integration
└── ViewRenderer
    ├── TaskListView (PM-03.1)
    │   ├── TanStackTable
    │   ├── VirtualRows
    │   └── ColumnVisibilityToggle
    ├── KanbanBoardView (PM-03.2, PM-03.3)
    │   ├── GroupBySelector
    │   ├── KanbanColumn[]
    │   │   ├── ColumnHeader (with count, WIP limit)
    │   │   └── TaskCard[] (draggable)
    │   └── DndContext (@dnd-kit)
    └── CalendarView (PM-03.4)
        ├── MonthView
        ├── WeekView
        └── DayView
```

---

## Library Selection & Rationale

### TanStack Table v8 (List View)

**Why:**
- Industry standard for React tables
- Built-in virtualization support
- Headless architecture (full style control)
- Column visibility, sorting, filtering out of the box
- TypeScript-first with excellent type inference

**Already in use:** No, will be added

**Alternative considered:** react-table v7 (deprecated), AG Grid (too heavy)

**Installation:**
```bash
pnpm add @tanstack/react-table @tanstack/react-virtual
```

### @dnd-kit (Kanban Drag-Drop)

**Why:**
- Modern, accessible drag-drop library
- Better performance than react-beautiful-dnd
- Active maintenance (react-beautiful-dnd is deprecated)
- Built-in keyboard navigation
- Supports complex layouts (multiple droppable areas)

**Already in use:** Yes (`@dnd-kit/core`, `@dnd-kit/sortable` in package.json)

**Alternative considered:** react-beautiful-dnd (deprecated), react-dnd (lower-level)

### Custom Calendar Implementation

**Why:**
- Existing calendar libraries (FullCalendar, react-big-calendar) are heavyweight
- Our use case is simpler: show tasks on due dates
- Better control over styling and interactions
- Can leverage date-fns (already installed)

**Already in use:** date-fns v4.1.0 is installed

**Alternative considered:** FullCalendar (30KB+ gzipped, overkill for our needs)

### URL State Management

**Why:**
- Shareable filter URLs
- Browser back/forward support
- No additional state library needed

**Library:** Next.js 15 searchParams (built-in)

**Pattern:**
```typescript
// URL: /tasks?status=TODO,IN_PROGRESS&priority=HIGH&assignee=user_123
const params = useSearchParams()
const status = params.get('status')?.split(',') || []
```

---

## Component Architecture

### 1. TasksPage (Container)

**Location:** `apps/web/src/app/(dashboard)/dashboard/pm/projects/[id]/tasks/page.tsx`

**Responsibilities:**
- Read URL search params for filters
- Fetch initial task data (server component)
- Pass data to client components
- Handle view type persistence (localStorage + user settings)

**Code structure:**
```typescript
// Server Component
export default async function TasksPage({
  params,
  searchParams
}: {
  params: { workspaceSlug: string; id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Parse filters from URL
  const filters = parseTaskFilters(searchParams)

  // Fetch data server-side
  const tasks = await api.pm.tasks.list({
    projectId: params.id,
    ...filters
  })

  // Get user's default view preference
  const defaultView = await getUserViewPreference(params.id)

  return (
    <TasksPageClient
      initialTasks={tasks}
      defaultView={defaultView}
      projectId={params.id}
    />
  )
}
```

### 2. FilterBar Component

**Location:** `apps/web/src/components/pm/filters/FilterBar.tsx`

**Props:**
```typescript
interface FilterBarProps {
  projectId: string
  value: TaskFilters
  onChange: (filters: TaskFilters) => void
  onSaveView?: () => void
}

interface TaskFilters {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  assigneeId?: string[]
  type?: TaskType[]
  labels?: string[]
  dueDate?: { from?: Date; to?: Date }
  search?: string
}
```

**Features:**
- Multi-select dropdowns for status, priority, assignee
- Date range picker for due dates
- Search input (debounced)
- Active filter chips with remove button
- "Clear All" button
- "Save View" button (if filters applied)

### 3. TaskListView Component

**Location:** `apps/web/src/components/pm/views/TaskListView.tsx`

**TanStack Table Setup:**
```typescript
'use client'

import { useReactTable, getCoreRowModel, getSortedRowModel } from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'

export function TaskListView({ tasks }: { tasks: Task[] }) {
  const columns = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
    },
    {
      accessorKey: 'taskNumber',
      header: 'ID',
      cell: ({ getValue }) => `#${getValue()}`,
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <TaskTitleCell task={row.original} />
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => <StatusBadge status={getValue()} />,
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ getValue }) => <PriorityBadge priority={getValue()} />,
    },
    {
      accessorKey: 'assigneeId',
      header: 'Assignee',
      cell: ({ getValue }) => <AssigneeAvatar userId={getValue()} />,
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ getValue }) => <DateCell date={getValue()} />,
    },
  ], [])

  const table = useReactTable({
    data: tasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
  })

  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Row height
    overscan: 10,
  })

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody style={{ height: `${virtualizer.getTotalSize()}px` }}>
          {virtualizer.getVirtualItems().map(virtualRow => {
            const row = table.getRowModel().rows[virtualRow.index]
            return (
              <TableRow
                key={row.id}
                style={{
                  position: 'absolute',
                  transform: `translateY(${virtualRow.start}px)`,
                  width: '100%',
                }}
              >
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
```

**Column Visibility:**
- Settings popover with checkboxes for each column
- Saved in localStorage per user per project
- Default columns: checkbox, ID, title, status, priority, assignee, due date

### 4. KanbanBoardView Component

**Location:** `apps/web/src/components/pm/views/KanbanBoardView.tsx`

**@dnd-kit Setup:**
```typescript
'use client'

import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core'
import { SortableContext, arrayMove } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'

interface KanbanColumn {
  id: string
  title: string
  tasks: Task[]
  wipLimit?: number
}

export function KanbanBoardView({
  tasks,
  groupBy = 'status'
}: {
  tasks: Task[]
  groupBy?: 'status' | 'priority' | 'assignee' | 'type' | 'phase'
}) {
  const columns = useMemo(() => {
    return groupTasksIntoColumns(tasks, groupBy)
  }, [tasks, groupBy])

  const [activeId, setActiveId] = useState<string | null>(null)
  const updateTaskMutation = useUpdateTask()

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const taskId = active.id as string
    const newColumnId = over.id as string

    // Optimistic update
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // Map column ID to field value (e.g., "TODO" -> status: "TODO")
    const updateField = getFieldFromGroupBy(groupBy)
    const updateValue = newColumnId

    await updateTaskMutation.mutateAsync({
      taskId,
      [updateField]: updateValue
    })
  }

  return (
    <DndContext onDragStart={({ active }) => setActiveId(active.id)} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(column => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={column.tasks}
          />
        ))}
      </div>

      <DragOverlay>
        {activeId ? <TaskCard task={tasks.find(t => t.id === activeId)!} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function KanbanColumn({ column, tasks }: { column: KanbanColumn; tasks: Task[] }) {
  const { setNodeRef } = useSortable({ id: column.id })
  const isOverLimit = column.wipLimit && tasks.length > column.wipLimit

  return (
    <div ref={setNodeRef} className="flex-shrink-0 w-80">
      <div className="bg-muted p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{column.title}</h3>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-sm text-muted-foreground",
              isOverLimit && "text-destructive font-semibold"
            )}>
              {tasks.length}
              {column.wipLimit && ` / ${column.wipLimit}`}
            </span>
          </div>
        </div>

        <SortableContext items={tasks.map(t => t.id)}>
          <div className="space-y-2">
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}

function TaskCard({ task, isDragging }: { task: Task; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-card p-3 rounded border cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-start gap-2 mb-2">
        <TaskTypeIcon type={task.type} />
        <span className="text-sm font-medium flex-1">{task.title}</span>
        {task.assignmentType === 'AGENT' && (
          <Sparkles className="h-4 w-4 text-purple-500" />
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>#{task.taskNumber}</span>
        <PriorityBadge priority={task.priority} size="sm" />
        {task.assigneeId && <AssigneeAvatar userId={task.assigneeId} size="sm" />}
      </div>
    </div>
  )
}
```

**Grouping Options:**
- Status (default): BACKLOG, TODO, IN_PROGRESS, REVIEW, DONE
- Priority: URGENT, HIGH, MEDIUM, LOW, NONE
- Assignee: User avatars + "Unassigned"
- Type: EPIC, STORY, TASK, SUBTASK, BUG, RESEARCH, CONTENT
- Phase: Phase names from project

**WIP Limits:**
- Configurable per column in project settings
- Visual warning (red count) when exceeded
- Does not block drag-drop (soft limit)

### 5. CalendarView Component

**Location:** `apps/web/src/components/pm/views/CalendarView.tsx`

**Implementation:**
```typescript
'use client'

import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay } from 'date-fns'

export function CalendarView({ tasks }: { tasks: Task[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')

  const days = useMemo(() => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>()
    tasks.forEach(task => {
      if (!task.dueDate) return
      const dateKey = format(task.dueDate, 'yyyy-MM-dd')
      if (!map.has(dateKey)) map.set(dateKey, [])
      map.get(dateKey)!.push(task)
    })
    return map
  }, [tasks])

  const updateTaskMutation = useUpdateTask()

  const handleTaskDrop = async (task: Task, newDate: Date) => {
    await updateTaskMutation.mutateAsync({
      taskId: task.id,
      dueDate: newDate
    })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[200px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            onClick={() => setViewMode('month')}
          >
            Month
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            onClick={() => setViewMode('week')}
          >
            Week
          </Button>
          <Button
            variant={viewMode === 'day' ? 'default' : 'outline'}
            onClick={() => setViewMode('day')}
          >
            Day
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {viewMode === 'month' && (
          <MonthView
            days={days}
            tasksByDate={tasksByDate}
            onTaskDrop={handleTaskDrop}
          />
        )}
        {/* Week and Day views similar structure */}
      </div>
    </div>
  )
}

function MonthView({
  days,
  tasksByDate,
  onTaskDrop
}: {
  days: Date[]
  tasksByDate: Map<string, Task[]>
  onTaskDrop: (task: Task, date: Date) => void
}) {
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="grid grid-cols-7 h-full">
      {/* Header */}
      {weekDays.map(day => (
        <div key={day} className="p-2 text-center font-semibold border-b">
          {day}
        </div>
      ))}

      {/* Days */}
      {days.map(day => {
        const dateKey = format(day, 'yyyy-MM-dd')
        const dayTasks = tasksByDate.get(dateKey) || []

        return (
          <CalendarDay
            key={dateKey}
            date={day}
            tasks={dayTasks}
            onDrop={onTaskDrop}
          />
        )
      })}
    </div>
  )
}

function CalendarDay({
  date,
  tasks,
  onDrop
}: {
  date: Date
  tasks: Task[]
  onDrop: (task: Task, date: Date) => void
}) {
  const [, drop] = useDrop({
    accept: 'TASK',
    drop: (item: { task: Task }) => onDrop(item.task, date),
  })

  const isToday = isSameDay(date, new Date())

  return (
    <div
      ref={drop}
      className={cn(
        "p-2 border-r border-b min-h-[120px] hover:bg-muted/50",
        isToday && "bg-primary/5"
      )}
    >
      <div className={cn(
        "text-sm font-medium mb-1",
        isToday && "text-primary"
      )}>
        {format(date, 'd')}
      </div>

      <div className="space-y-1">
        {tasks.slice(0, 3).map(task => (
          <CalendarTaskCard key={task.id} task={task} />
        ))}
        {tasks.length > 3 && (
          <div className="text-xs text-muted-foreground">
            +{tasks.length - 3} more
          </div>
        )}
      </div>
    </div>
  )
}

function CalendarTaskCard({ task }: { task: Task }) {
  const [{ isDragging }, drag] = useDrag({
    type: 'TASK',
    item: { task },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const priorityColors = {
    URGENT: 'bg-red-500',
    HIGH: 'bg-orange-500',
    MEDIUM: 'bg-yellow-500',
    LOW: 'bg-blue-500',
    NONE: 'bg-gray-500',
  }

  return (
    <div
      ref={drag}
      className={cn(
        "text-xs p-1 rounded border-l-2 cursor-move",
        priorityColors[task.priority],
        isDragging && "opacity-50"
      )}
    >
      <div className="truncate">{task.title}</div>
    </div>
  )
}
```

**Calendar Features:**
- Month, week, day views
- Color-coded by priority
- Drag task to new date to reschedule
- Click task to open detail panel
- "Today" button to jump to current date
- Tasks without due dates not shown

### 6. SavedViewManager Component

**Location:** `apps/web/src/components/pm/views/SavedViewManager.tsx`

**Features:**
- Create new view from current filters
- Edit view name and settings
- Delete view
- Mark as default
- Share view (makes visible to all team)
- Duplicate view

**UI:**
```typescript
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">
      <Eye className="mr-2 h-4 w-4" />
      {currentView?.name || 'All Tasks'}
      <ChevronDown className="ml-2 h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="start" className="w-[300px]">
    <DropdownMenuLabel>Saved Views</DropdownMenuLabel>
    <DropdownMenuSeparator />

    {/* My Views */}
    <DropdownMenuGroup>
      <DropdownMenuLabel className="text-xs text-muted-foreground">
        My Views
      </DropdownMenuLabel>
      {myViews.map(view => (
        <DropdownMenuItem
          key={view.id}
          onClick={() => loadView(view)}
        >
          <div className="flex items-center justify-between w-full">
            <span>{view.name}</span>
            <div className="flex items-center gap-1">
              {view.isDefault && <Star className="h-3 w-3 fill-current" />}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => editView(view)}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => duplicateView(view)}>
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDefaultView(view)}>
                    Set as Default
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => shareView(view)}>
                    Share with Team
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => deleteView(view)}
                    className="text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </DropdownMenuItem>
      ))}
    </DropdownMenuGroup>

    {/* Shared Views */}
    {sharedViews.length > 0 && (
      <>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Shared Views
          </DropdownMenuLabel>
          {sharedViews.map(view => (
            <DropdownMenuItem
              key={view.id}
              onClick={() => loadView(view)}
            >
              {view.name}
              <Globe className="ml-auto h-3 w-3" />
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </>
    )}

    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={openCreateViewDialog}>
      <Plus className="mr-2 h-4 w-4" />
      Save Current View
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### 7. BulkActionsBar Component

**Location:** `apps/web/src/components/pm/bulk/BulkActionsBar.tsx`

**Triggered by:** Row selection in list view or multi-select in kanban

**Actions:**
- Change status (with confirm dialog)
- Change priority
- Change assignee
- Move to phase
- Add label
- Bulk delete (with confirm)
- Archive

**UI Pattern:**
```typescript
{selectedTasks.length > 0 && (
  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
    <Card className="p-4 shadow-lg">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">
          {selectedTasks.length} tasks selected
        </span>

        <Separator orientation="vertical" className="h-6" />

        <Button variant="outline" size="sm" onClick={openBulkStatusDialog}>
          <CircleDot className="mr-2 h-4 w-4" />
          Status
        </Button>

        <Button variant="outline" size="sm" onClick={openBulkPriorityDialog}>
          <Flag className="mr-2 h-4 w-4" />
          Priority
        </Button>

        <Button variant="outline" size="sm" onClick={openBulkAssignDialog}>
          <UserCircle className="mr-2 h-4 w-4" />
          Assign
        </Button>

        <Button variant="outline" size="sm" onClick={openBulkLabelDialog}>
          <Tag className="mr-2 h-4 w-4" />
          Labels
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <Button
          variant="outline"
          size="sm"
          className="text-destructive"
          onClick={confirmBulkDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>

        <Button variant="ghost" size="sm" onClick={clearSelection}>
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>
    </Card>
  </div>
)}
```

---

## API Layer

### Existing Endpoints (PM-02)

From PM-02, we already have:
- `GET /api/pm/tasks` - List tasks with filters
- `PATCH /api/pm/tasks/bulk` - Bulk update tasks
- `GET /api/pm/tasks/:id` - Get task details
- `PATCH /api/pm/tasks/:id` - Update task

### New Endpoints Needed (PM-03)

#### SavedView CRUD

```typescript
// GET /api/pm/projects/:projectId/views
{
  "data": [
    {
      "id": "view_123",
      "projectId": "proj_123",
      "userId": "user_123",
      "name": "My Active Tasks",
      "viewType": "LIST",
      "filters": {
        "status": ["TODO", "IN_PROGRESS"],
        "assigneeId": ["user_123"]
      },
      "sortBy": "dueDate",
      "sortOrder": "asc",
      "columns": ["taskNumber", "title", "status", "dueDate"],
      "isDefault": true,
      "isShared": false,
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:00:00Z"
    }
  ],
  "meta": { "total": 5 }
}

// POST /api/pm/projects/:projectId/views
{
  "name": "High Priority",
  "viewType": "KANBAN",
  "filters": { "priority": ["URGENT", "HIGH"] },
  "sortBy": "priority",
  "sortOrder": "desc",
  "isDefault": false,
  "isShared": false
}

// PATCH /api/pm/views/:viewId
{
  "name": "Updated Name",
  "filters": { ... },
  "isDefault": true
}

// DELETE /api/pm/views/:viewId
```

#### Controller Implementation

**Location:** `apps/api/src/pm/views/views.controller.ts`

```typescript
@Controller('pm/projects/:projectId/views')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
export class ViewsController {
  constructor(private readonly viewsService: ViewsService) {}

  @Get()
  @Roles('owner', 'admin', 'member')
  async listViews(
    @CurrentWorkspace() workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: any
  ) {
    return this.viewsService.list(workspaceId, projectId, user.id)
  }

  @Post()
  @Roles('owner', 'admin', 'member')
  async createView(
    @CurrentWorkspace() workspaceId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateSavedViewDto,
    @CurrentUser() user: any
  ) {
    return this.viewsService.create(workspaceId, projectId, user.id, dto)
  }

  @Patch(':viewId')
  @Roles('owner', 'admin', 'member')
  async updateView(
    @CurrentWorkspace() workspaceId: string,
    @Param('viewId') viewId: string,
    @Body() dto: UpdateSavedViewDto,
    @CurrentUser() user: any
  ) {
    return this.viewsService.update(workspaceId, viewId, user.id, dto)
  }

  @Delete(':viewId')
  @Roles('owner', 'admin', 'member')
  async deleteView(
    @CurrentWorkspace() workspaceId: string,
    @Param('viewId') viewId: string,
    @CurrentUser() user: any
  ) {
    return this.viewsService.delete(workspaceId, viewId, user.id)
  }
}
```

#### Service Implementation

**Location:** `apps/api/src/pm/views/views.service.ts`

```typescript
@Injectable()
export class ViewsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(workspaceId: string, projectId: string, userId: string) {
    const views = await this.prisma.savedView.findMany({
      where: {
        projectId,
        OR: [
          { userId }, // User's own views
          { isShared: true } // Shared views
        ]
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return { data: views }
  }

  async create(
    workspaceId: string,
    projectId: string,
    userId: string,
    dto: CreateSavedViewDto
  ) {
    // If setting as default, unset other defaults for this user
    if (dto.isDefault) {
      await this.prisma.savedView.updateMany({
        where: { projectId, userId, isDefault: true },
        data: { isDefault: false }
      })
    }

    const view = await this.prisma.savedView.create({
      data: {
        projectId,
        userId,
        ...dto
      }
    })

    return { data: view }
  }

  async update(
    workspaceId: string,
    viewId: string,
    userId: string,
    dto: UpdateSavedViewDto
  ) {
    // Verify ownership
    const existing = await this.prisma.savedView.findFirst({
      where: { id: viewId, userId }
    })
    if (!existing) throw new NotFoundException('View not found')

    // If setting as default, unset others
    if (dto.isDefault) {
      await this.prisma.savedView.updateMany({
        where: {
          projectId: existing.projectId,
          userId,
          isDefault: true,
          id: { not: viewId }
        },
        data: { isDefault: false }
      })
    }

    const updated = await this.prisma.savedView.update({
      where: { id: viewId },
      data: dto
    })

    return { data: updated }
  }

  async delete(workspaceId: string, viewId: string, userId: string) {
    const existing = await this.prisma.savedView.findFirst({
      where: { id: viewId, userId }
    })
    if (!existing) throw new NotFoundException('View not found')

    await this.prisma.savedView.delete({ where: { id: viewId } })

    return { data: { id: viewId } }
  }
}
```

---

## State Management

### URL State (Primary)

Filters are stored in URL search params for shareability:

```typescript
// apps/web/src/lib/pm/url-state.ts

export interface TaskFiltersUrlParams {
  status?: string          // "TODO,IN_PROGRESS"
  priority?: string        // "HIGH,URGENT"
  assigneeId?: string      // "user_123,user_456"
  type?: string           // "STORY,TASK"
  labels?: string         // "bug,feature"
  dueDateFrom?: string    // ISO date
  dueDateTo?: string      // ISO date
  search?: string
}

export function parseFiltersFromUrl(
  searchParams: URLSearchParams
): TaskFilters {
  return {
    status: searchParams.get('status')?.split(',') as TaskStatus[] || undefined,
    priority: searchParams.get('priority')?.split(',') as TaskPriority[] || undefined,
    assigneeId: searchParams.get('assigneeId')?.split(',') || undefined,
    type: searchParams.get('type')?.split(',') as TaskType[] || undefined,
    labels: searchParams.get('labels')?.split(',') || undefined,
    dueDate: {
      from: searchParams.get('dueDateFrom') ? new Date(searchParams.get('dueDateFrom')!) : undefined,
      to: searchParams.get('dueDateTo') ? new Date(searchParams.get('dueDateTo')!) : undefined,
    },
    search: searchParams.get('search') || undefined,
  }
}

export function serializeFiltersToUrl(filters: TaskFilters): string {
  const params = new URLSearchParams()

  if (filters.status?.length) params.set('status', filters.status.join(','))
  if (filters.priority?.length) params.set('priority', filters.priority.join(','))
  if (filters.assigneeId?.length) params.set('assigneeId', filters.assigneeId.join(','))
  if (filters.type?.length) params.set('type', filters.type.join(','))
  if (filters.labels?.length) params.set('labels', filters.labels.join(','))
  if (filters.dueDate?.from) params.set('dueDateFrom', filters.dueDate.from.toISOString())
  if (filters.dueDate?.to) params.set('dueDateTo', filters.dueDate.to.toISOString())
  if (filters.search) params.set('search', filters.search)

  return params.toString()
}
```

### Local State (View Preferences)

Non-filter preferences (view type, column visibility) in localStorage:

```typescript
// apps/web/src/lib/pm/view-preferences.ts

export interface ViewPreferences {
  viewType: 'list' | 'kanban' | 'calendar'
  listColumns: string[]  // Column IDs to show
  kanbanGroupBy: 'status' | 'priority' | 'assignee' | 'type' | 'phase'
}

export function getViewPreferences(projectId: string): ViewPreferences {
  const key = `pm-view-prefs-${projectId}`
  const stored = localStorage.getItem(key)

  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return getDefaultPreferences()
    }
  }

  return getDefaultPreferences()
}

export function setViewPreferences(
  projectId: string,
  prefs: Partial<ViewPreferences>
) {
  const key = `pm-view-prefs-${projectId}`
  const current = getViewPreferences(projectId)
  const updated = { ...current, ...prefs }
  localStorage.setItem(key, JSON.stringify(updated))
}

function getDefaultPreferences(): ViewPreferences {
  return {
    viewType: 'list',
    listColumns: ['select', 'taskNumber', 'title', 'status', 'priority', 'assigneeId', 'dueDate'],
    kanbanGroupBy: 'status',
  }
}
```

### React Query (Data Fetching)

```typescript
// apps/web/src/lib/pm/queries.ts

export function useTaskList(projectId: string, filters: TaskFilters) {
  return useQuery({
    queryKey: ['tasks', projectId, filters],
    queryFn: () => api.pm.tasks.list({ projectId, ...filters }),
    staleTime: 30_000, // 30 seconds
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, ...data }: { taskId: string } & Partial<Task>) =>
      api.pm.tasks.update(taskId, data),
    onMutate: async ({ taskId, ...data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      // Snapshot previous value
      const previousTasks = queryClient.getQueriesData({ queryKey: ['tasks'] })

      // Optimistically update all queries
      queryClient.setQueriesData(
        { queryKey: ['tasks'] },
        (old: any) => {
          if (!old?.data) return old
          return {
            ...old,
            data: old.data.map((task: Task) =>
              task.id === taskId ? { ...task, ...data } : task
            )
          }
        }
      )

      return { previousTasks }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useSavedViews(projectId: string) {
  return useQuery({
    queryKey: ['saved-views', projectId],
    queryFn: () => api.pm.views.list(projectId),
  })
}

export function useCreateSavedView(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateSavedViewDto) => api.pm.views.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-views', projectId] })
    },
  })
}
```

---

## Story-by-Story Technical Breakdown

### PM-03.1: List View

**Estimated Complexity:** Medium
**Story Points:** 5
**Prerequisites:** PM-02.1 (task API exists)

**Technical Tasks:**
1. Install TanStack Table and React Virtual: `pnpm add @tanstack/react-table @tanstack/react-virtual`
2. Create `TaskListView` component with column definitions
3. Implement virtualization for 500+ tasks
4. Add column visibility toggle (Popover with checkboxes)
5. Implement row selection (checkboxes)
6. Add sort indicators to headers (click to sort)
7. Implement pagination controls (50 rows per page with "Load More")
8. Style table with shadcn/ui Table components
9. Add loading states and empty states
10. Test performance with 1000 tasks

**Files to Create:**
- `apps/web/src/components/pm/views/TaskListView.tsx`
- `apps/web/src/components/pm/table/TaskTableColumns.tsx`
- `apps/web/src/components/pm/table/ColumnVisibilityToggle.tsx`

**Files to Modify:**
- `apps/web/src/app/(dashboard)/dashboard/pm/projects/[id]/tasks/page.tsx`

**Testing:**
- Unit: Column definitions render correct cell content
- Integration: Sorting updates URL and refetches data
- E2E: User can toggle columns, sort, and select rows

**API Changes:** None (uses existing `GET /api/pm/tasks`)

**Acceptance Criteria:**
- [x] Table shows columns: checkbox, ID, title, status, priority, assignee, due date
- [x] Column headers are clickable for sorting (asc/desc toggle)
- [x] Column visibility toggle in view settings
- [x] Bulk select via checkboxes enables bulk actions bar
- [x] Pagination at 50 rows with "Load More"
- [x] Virtualization handles 500+ tasks smoothly (<500ms render time)

---

### PM-03.2: Kanban Board Basic

**Estimated Complexity:** Medium
**Story Points:** 5
**Prerequisites:** PM-02.8 (task status field exists)

**Technical Tasks:**
1. Create `KanbanBoardView` component
2. Implement column layout (flex with overflow-x-auto)
3. Create `KanbanColumn` component (status-based grouping)
4. Create `TaskCard` component with type icon, title, priority, assignee
5. Add AI badge for agent-assigned tasks
6. Add card count to column headers
7. Style with shadcn/ui Card components
8. Add empty state for columns with no tasks
9. Implement horizontal scroll with indicators
10. Test with various task distributions

**Files to Create:**
- `apps/web/src/components/pm/views/KanbanBoardView.tsx`
- `apps/web/src/components/pm/kanban/KanbanColumn.tsx`
- `apps/web/src/components/pm/kanban/TaskCard.tsx`

**Files to Modify:**
- `apps/web/src/app/(dashboard)/dashboard/pm/projects/[id]/tasks/page.tsx`

**Testing:**
- Unit: Tasks grouped correctly by status
- Integration: Column headers show correct counts
- E2E: User can view kanban board and click tasks

**API Changes:** None

**Acceptance Criteria:**
- [x] Columns for each status: Backlog, Todo, In Progress, Review, Done
- [x] Tasks appear as cards with: type icon, title, priority badge, assignee avatar
- [x] Agent-assigned tasks show AI badge (Sparkles icon)
- [x] Card count per column in header
- [x] Horizontal scroll with visual indicators

---

### PM-03.3: Kanban Drag-Drop & Grouping

**Estimated Complexity:** High
**Story Points:** 8
**Prerequisites:** PM-03.2

**Technical Tasks:**
1. Wrap KanbanBoardView with DndContext from @dnd-kit
2. Make TaskCard draggable with useSortable hook
3. Make KanbanColumn droppable
4. Implement onDragEnd handler to update task status
5. Add optimistic updates with rollback on error
6. Implement DragOverlay for visual feedback
7. Add GroupBySelector dropdown (Status, Priority, Assignee, Type, Phase)
8. Create grouping logic for each group type
9. Add "Unassigned" column for null values
10. Implement WIP limit warnings (red count when exceeded)
11. Add WIP limit configuration in project settings
12. Test drag-drop across all group types

**Files to Create:**
- `apps/web/src/components/pm/kanban/GroupBySelector.tsx`
- `apps/web/src/lib/pm/kanban-grouping.ts`

**Files to Modify:**
- `apps/web/src/components/pm/views/KanbanBoardView.tsx`
- `apps/web/src/components/pm/kanban/TaskCard.tsx`
- `apps/web/src/components/pm/kanban/KanbanColumn.tsx`

**Testing:**
- Unit: Grouping logic produces correct columns
- Integration: Drag updates correct field based on group type
- E2E: User can drag task between columns and see optimistic update

**API Changes:** Uses existing `PATCH /api/pm/tasks/:id`

**Acceptance Criteria:**
- [x] Drag-drop moves task between columns (updates status)
- [x] Optimistic updates with rollback on error
- [x] "Group By" dropdown with: Status, Priority, Assignee, Type, Phase
- [x] Selecting option re-renders board with new columns
- [x] "Unassigned" column for null values
- [x] WIP limits can be set per column (visual warning when exceeded)
- [x] Keyboard navigation for accessibility

---

### PM-03.4: Calendar View

**Estimated Complexity:** High
**Story Points:** 8
**Prerequisites:** PM-02.1

**Technical Tasks:**
1. Create `CalendarView` component with month/week/day toggle
2. Implement month grid layout (7 columns for days)
3. Calculate days in month with date-fns
4. Create `CalendarDay` component with drop target
5. Create `CalendarTaskCard` component with drag handle
6. Group tasks by due date
7. Implement color coding by priority
8. Add drag-to-reschedule functionality
9. Implement month navigation (prev/next/today buttons)
10. Add week view layout (7 days with time slots)
11. Add day view layout (single day with hourly slots)
12. Handle tasks without due dates (not shown)
13. Test with various date ranges

**Files to Create:**
- `apps/web/src/components/pm/views/CalendarView.tsx`
- `apps/web/src/components/pm/calendar/MonthView.tsx`
- `apps/web/src/components/pm/calendar/WeekView.tsx`
- `apps/web/src/components/pm/calendar/DayView.tsx`
- `apps/web/src/components/pm/calendar/CalendarDay.tsx`
- `apps/web/src/components/pm/calendar/CalendarTaskCard.tsx`

**Files to Modify:**
- `apps/web/src/app/(dashboard)/dashboard/pm/projects/[id]/tasks/page.tsx`

**Testing:**
- Unit: Date calculations correct for all months/years
- Integration: Drag updates dueDate field
- E2E: User can navigate months, drag tasks, toggle views

**API Changes:** Uses existing `PATCH /api/pm/tasks/:id`

**Acceptance Criteria:**
- [x] Month calendar with tasks on due dates
- [x] Tasks show as colored bars (by priority)
- [x] Click task opens detail panel
- [x] Drag task to new date updates dueDate
- [x] Week and day views available
- [x] Month navigation (prev/next/today)
- [x] Tasks without due dates not shown

---

### PM-03.5: View Toggle & Persistence

**Estimated Complexity:** Low
**Story Points:** 3
**Prerequisites:** PM-03.1, PM-03.2, PM-03.4

**Technical Tasks:**
1. Create `ViewSwitcher` component with toggle buttons
2. Implement view state in URL param (`?view=list|kanban|calendar`)
3. Save view preference to localStorage per user per project
4. Optionally sync to user settings table in database
5. Implement filter persistence across view switches
6. Add keyboard shortcuts: `1` for list, `2` for kanban, `3` for calendar
7. Add visual indication of active view
8. Test view switching with applied filters

**Files to Create:**
- `apps/web/src/components/pm/views/ViewSwitcher.tsx`
- `apps/web/src/lib/pm/view-preferences.ts`

**Files to Modify:**
- `apps/web/src/app/(dashboard)/dashboard/pm/projects/[id]/tasks/page.tsx`

**Testing:**
- Unit: View preference save/load logic
- Integration: Filters persist across view switches
- E2E: User can switch views and preferences persist on reload

**API Changes:** None (localStorage only)

**Acceptance Criteria:**
- [x] Toggle buttons for: List, Kanban, Calendar
- [x] View preference persists per user per project
- [x] Filters persist across view switches
- [x] Keyboard shortcuts (1/2/3) work
- [x] Active view indicated visually

---

### PM-03.6: Saved Views CRUD

**Estimated Complexity:** Medium
**Story Points:** 5
**Prerequisites:** PM-03.5, PM-03.7 (filters)

**Technical Tasks:**
1. Create SavedView API endpoints (list, create, update, delete)
2. Create `SavedViewManager` component with dropdown
3. Implement "Save View" dialog with name input
4. Add "Set as Default" checkbox
5. Add "Share with Team" toggle
6. Implement edit view dialog (same form, pre-populated)
7. Implement delete confirmation
8. Implement duplicate view action
9. Show saved views in dropdown (My Views, Shared Views)
10. Load saved view on select (apply filters, sort, columns)
11. Test with multiple views per project

**Files to Create:**
- `apps/api/src/pm/views/views.controller.ts`
- `apps/api/src/pm/views/views.service.ts`
- `apps/api/src/pm/views/dto/create-saved-view.dto.ts`
- `apps/api/src/pm/views/dto/update-saved-view.dto.ts`
- `apps/web/src/components/pm/views/SavedViewManager.tsx`
- `apps/web/src/components/pm/views/SaveViewDialog.tsx`

**Files to Modify:**
- `apps/api/src/pm/pm.module.ts` (register ViewsController)

**Testing:**
- Unit: DTO validation
- Integration: CRUD operations work correctly
- E2E: User can save, load, edit, delete views

**API Changes:** New endpoints (documented above in API Layer section)

**Acceptance Criteria:**
- [x] "Save View" modal prompts for view name
- [x] Can mark as default view
- [x] Saved views appear in view dropdown
- [x] Can share view (makes public to team)
- [x] Edit/delete saved views
- [x] Loading view applies all filters, sort, columns

---

### PM-03.7: Advanced Filters

**Estimated Complexity:** High
**Story Points:** 8
**Prerequisites:** PM-02.1

**Technical Tasks:**
1. Create `FilterBar` component with filter controls
2. Implement status multi-select dropdown
3. Implement priority dropdown
4. Implement assignee dropdown (with search)
5. Implement type dropdown
6. Implement label multi-select (with autocomplete)
7. Implement due date range picker (from/to)
8. Implement phase dropdown
9. Create `FilterChip` component for active filters
10. Implement "Clear All" button
11. Serialize filters to URL params
12. Parse filters from URL on page load
13. Debounce URL updates (300ms)
14. Test with all filter combinations

**Files to Create:**
- `apps/web/src/components/pm/filters/FilterBar.tsx`
- `apps/web/src/components/pm/filters/StatusFilter.tsx`
- `apps/web/src/components/pm/filters/PriorityFilter.tsx`
- `apps/web/src/components/pm/filters/AssigneeFilter.tsx`
- `apps/web/src/components/pm/filters/DateRangeFilter.tsx`
- `apps/web/src/components/pm/filters/FilterChip.tsx`
- `apps/web/src/lib/pm/url-state.ts`

**Files to Modify:**
- `apps/web/src/app/(dashboard)/dashboard/pm/projects/[id]/tasks/page.tsx`

**Testing:**
- Unit: Filter serialization/parsing
- Integration: Filters update URL and refetch data
- E2E: User can apply multiple filters and share URL

**API Changes:** None (uses existing query params in `GET /api/pm/tasks`)

**Acceptance Criteria:**
- [x] Filter by: status (multi), priority, assignee, type, labels, due date range, phase
- [x] Active filters show as chips with remove button
- [x] "Clear All" resets filters
- [x] Filter state persists in URL (shareable)
- [x] URL format: `?status=TODO,IN_PROGRESS&assignee=user_123`

---

### PM-03.8: Bulk Selection & Actions

**Estimated Complexity:** Medium
**Story Points:** 5
**Prerequisites:** PM-03.1 (list view with checkboxes)

**Technical Tasks:**
1. Create `BulkActionsBar` component (fixed at bottom)
2. Track selected task IDs in React state
3. Implement "Select All" / "Select None" in table header
4. Create bulk status change dialog
5. Create bulk priority change dialog
6. Create bulk assignee change dialog
7. Create bulk label add dialog
8. Create bulk delete confirmation dialog
9. Implement keyboard shortcuts: `Cmd+A` (select all), `Delete` (bulk delete)
10. Implement bulk update API call
11. Show optimistic updates during bulk operations
12. Add progress indicator for large bulk operations
13. Integrate with existing CommandBar for quick actions

**Files to Create:**
- `apps/web/src/components/pm/bulk/BulkActionsBar.tsx`
- `apps/web/src/components/pm/bulk/BulkStatusDialog.tsx`
- `apps/web/src/components/pm/bulk/BulkPriorityDialog.tsx`
- `apps/web/src/components/pm/bulk/BulkAssignDialog.tsx`

**Files to Modify:**
- `apps/web/src/components/pm/views/TaskListView.tsx` (selection state)
- `apps/web/src/app/(dashboard)/dashboard/pm/projects/[id]/tasks/page.tsx`

**Testing:**
- Unit: Selection state logic
- Integration: Bulk API calls work correctly
- E2E: User can select tasks, apply bulk actions, see updates

**API Changes:** Uses existing `PATCH /api/pm/tasks/bulk`

**Acceptance Criteria:**
- [x] `Cmd/Ctrl + K` opens command bar with task context
- [x] Can search tasks by title/number
- [x] Can navigate to pages
- [x] Can run quick actions (create task, switch view)
- [x] Recent items shown by default
- [x] Results update as user types (debounced)
- [x] Bulk actions bar appears when tasks selected
- [x] Actions: change status, priority, assignee, labels, delete
- [x] Keyboard shortcuts work (`Cmd+A`, `Delete`)

---

## Data Models & Schema

### SavedView Model (Already Exists)

```prisma
model SavedView {
  id        String   @id @default(cuid())
  projectId String   @map("project_id")
  userId    String   @map("user_id")

  name      String
  viewType  ViewType @default(LIST) @map("view_type")
  filters   Json     @default("{}")
  sortBy    String?  @map("sort_by")
  sortOrder String?  @map("sort_order")
  columns   Json?    // For list view column config
  isDefault Boolean  @default(false) @map("is_default")
  isShared  Boolean  @default(false) @map("is_shared")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([userId])
  @@map("saved_views")
}

enum ViewType {
  LIST
  KANBAN
  CALENDAR
  TIMELINE
  CUSTOM
}
```

**Note:** This model already exists in the schema. No migration needed.

### Project Model Extension (WIP Limits)

Consider adding WIP limit configuration to Project or Phase:

```prisma
model Project {
  // ... existing fields

  settings Json? // { wipLimits: { TODO: 10, IN_PROGRESS: 5 } }
}
```

**Implementation:** Store in existing `settings` JSON field, no migration needed.

---

## Performance Considerations

### List View Virtualization

**Target:** Handle 1000+ tasks without lag

**Approach:**
- Use `@tanstack/react-virtual` for row virtualization
- Only render visible rows + overscan (10 rows above/below)
- Estimated row height: 50px
- Viewport height: ~800px = 16 visible rows + 20 overscan = 36 DOM nodes max

**Benchmarks:**
- 100 tasks: <100ms render
- 500 tasks: <200ms render
- 1000 tasks: <500ms render
- 5000 tasks: <1s render

### Kanban Drag-Drop Performance

**Target:** Smooth drag at 60fps

**Approach:**
- Use CSS transforms for drag feedback (GPU-accelerated)
- Throttle drag events to 16ms (60fps)
- Optimistic updates (update UI immediately, revert on error)
- Limit cards per column to 50 (show "Load More" if needed)

**Optimizations:**
- Memoize TaskCard components (`React.memo`)
- Use `useMemo` for computed values (card counts, groups)
- Debounce API calls during drag (only call on drop)

### Calendar Rendering

**Target:** Render month view <300ms

**Approach:**
- Pre-calculate days array with `date-fns` (memoized)
- Group tasks by date once (O(n) operation)
- Limit displayed tasks per day to 5 (show "+N more")
- Lazy load week/day views (code split)

### Filter Performance

**Target:** Update URL and refetch <500ms

**Approach:**
- Debounce URL updates (300ms after last filter change)
- Use shallow routing (no full page reload)
- React Query deduplication (multiple filter changes = 1 API call)
- Server-side indexing on filter fields (status, priority, assigneeId, dueDate)

### Database Indexes (Ensure These Exist)

```sql
-- Already in schema
CREATE INDEX idx_task_status ON tasks(status);
CREATE INDEX idx_task_priority ON tasks(priority);
CREATE INDEX idx_task_assignee ON tasks(assignee_id);
CREATE INDEX idx_task_due_date ON tasks(due_date);
CREATE INDEX idx_task_phase ON tasks(phase_id);
CREATE INDEX idx_task_project ON tasks(project_id);

-- Composite indexes for common queries
CREATE INDEX idx_task_project_status ON tasks(project_id, status);
CREATE INDEX idx_task_project_assignee ON tasks(project_id, assignee_id);
```

---

## Testing Strategy

### Unit Tests

**Location:** `*.test.ts` files next to components

**Coverage targets:**
- Utility functions: 100% (url-state, grouping logic)
- Column definitions: 100%
- Filter parsing/serialization: 100%

**Tools:**
- Vitest for test runner
- Testing Library for component tests
- MSW for API mocking

**Example:**
```typescript
// url-state.test.ts
describe('parseFiltersFromUrl', () => {
  it('parses status filter correctly', () => {
    const params = new URLSearchParams('status=TODO,IN_PROGRESS')
    const filters = parseFiltersFromUrl(params)
    expect(filters.status).toEqual(['TODO', 'IN_PROGRESS'])
  })

  it('handles empty params', () => {
    const params = new URLSearchParams()
    const filters = parseFiltersFromUrl(params)
    expect(filters.status).toBeUndefined()
  })
})
```

### Integration Tests

**Location:** `*.integration.test.ts`

**Coverage:**
- API endpoints (views CRUD)
- Filter queries return correct data
- Bulk operations update multiple tasks

**Tools:**
- Supertest for API testing
- Test database (Docker container)

**Example:**
```typescript
// views.integration.test.ts
describe('POST /api/pm/projects/:projectId/views', () => {
  it('creates saved view successfully', async () => {
    const response = await request(app)
      .post('/api/pm/projects/proj_123/views')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'My View',
        viewType: 'LIST',
        filters: { status: ['TODO'] }
      })

    expect(response.status).toBe(201)
    expect(response.body.data.name).toBe('My View')
  })
})
```

### E2E Tests

**Location:** `apps/web/tests/e2e/pm/`

**Scenarios:**
1. User applies filters, views update correctly
2. User saves view, view appears in dropdown
3. User drags task in kanban, status updates
4. User drags task in calendar, due date updates
5. User bulk selects tasks, applies bulk action
6. User switches views, filters persist

**Tools:**
- Playwright for browser automation
- Fixtures for test data

**Example:**
```typescript
// pm-03.e2e.test.ts
test('user can drag task between kanban columns', async ({ page }) => {
  await page.goto('/workspaces/ws1/pm/projects/proj1/tasks?view=kanban')

  // Wait for board to load
  await page.waitForSelector('[data-testid="kanban-column-TODO"]')

  // Find task card
  const taskCard = page.locator('[data-testid="task-card-123"]')
  const targetColumn = page.locator('[data-testid="kanban-column-IN_PROGRESS"]')

  // Drag task
  await taskCard.dragTo(targetColumn)

  // Wait for optimistic update
  await page.waitForTimeout(100)

  // Verify task moved
  await expect(targetColumn.locator('[data-testid="task-card-123"]')).toBeVisible()

  // Verify API was called
  const requests = await page.waitForRequest(r =>
    r.url().includes('/api/pm/tasks/123') && r.method() === 'PATCH'
  )
  expect(requests).toBeTruthy()
})
```

### Performance Tests

**Load Testing:**
- Render list view with 1000 tasks, measure time
- Drag task in kanban 50 times, measure avg latency
- Apply 5 filters rapidly, measure debounce effectiveness

**Profiling:**
- Use React DevTools Profiler
- Monitor React Query cache size
- Check for unnecessary re-renders (use `why-did-you-render`)

---

## Dependencies & Integration Points

### Internal Dependencies

| Dependency | Location | Usage |
|------------|----------|-------|
| Task API | `apps/api/src/pm/tasks` | Data fetching, updates |
| Project API | `apps/api/src/pm/projects` | Context for views |
| Prisma Client | `packages/db` | Database queries |
| WebSocket Service | `apps/api/src/websockets` | Real-time updates |
| Event Bus | `apps/api/src/events` | Publish task events |

### External Dependencies (New)

```json
{
  "@tanstack/react-table": "^8.10.0",
  "@tanstack/react-virtual": "^3.0.0"
}
```

**Note:** `@dnd-kit` is already installed.

### Integration with Existing Features

#### PM-02 Task Management
- Uses existing Task model and API
- Extends with bulk operations endpoint

#### Real-Time Updates (PM-06)
- Subscribe to `pm.task.updated` events
- Update views optimistically, then sync with WebSocket updates

#### Command Bar (Platform)
- Integrate bulk actions with existing command bar
- Add task search to command palette

#### Approval Queue (Platform)
- Show "Awaiting Approval" status in views
- Filter by approval status

---

## Open Questions & Decisions

### 1. TanStack Table vs AG Grid?

**Decision:** TanStack Table

**Rationale:**
- Lighter weight (15KB vs 100KB+)
- Headless (full control over styling)
- Better React 19 support
- Free (AG Grid Community has limitations)

### 2. Custom Calendar vs FullCalendar?

**Decision:** Custom Calendar

**Rationale:**
- Our use case is simpler (just show tasks on dates)
- FullCalendar is 150KB+ gzipped
- Better control over styling and interactions
- Can optimize for our specific needs

### 3. WIP Limit Enforcement?

**Decision:** Soft limits (visual warning only)

**Rationale:**
- Hard limits frustrate users
- Visual warning encourages good practices
- Users can override if needed
- Consider hard limits for future "strict mode"

### 4. Saved View Visibility Levels?

**Decision:** Two levels - Private and Shared

**Rationale:**
- Simple UX (toggle)
- Covers 95% of use cases
- Future: add Team-specific sharing if needed

### 5. Filter URL Format?

**Decision:** Comma-separated values (`?status=TODO,IN_PROGRESS`)

**Rationale:**
- Human-readable URLs
- Easy to parse
- Shareable via copy-paste
- Compatible with Next.js searchParams

### 6. View Preference Storage?

**Decision:** localStorage + optional DB sync

**Rationale:**
- Fast (no API call on load)
- Works offline
- Optional DB sync for cross-device
- Future: add user settings table for persistence

### 7. Bulk Operation Size Limit?

**Decision:** 100 tasks per bulk operation

**Rationale:**
- Balance performance and usability
- Prevents accidental mass updates
- Show progress indicator for large operations
- Future: add background job for 100+ tasks

### 8. Kanban Column Order?

**Decision:** Fixed order based on status progression

**Rationale:**
- Standard workflow (Backlog → Todo → In Progress → Review → Done)
- Matches typical project flow
- Future: add custom column ordering if requested

### 9. Calendar Task Limit Per Day?

**Decision:** Show 5 tasks, "+N more" button

**Rationale:**
- Prevents visual clutter
- Maintains performance
- Click to see all tasks for that day
- Future: add density toggle (compact/comfortable)

### 10. Filter Persistence Across Projects?

**Decision:** Per-project filters (not global)

**Rationale:**
- Each project has different workflow
- Prevents confusion from unexpected filters
- Future: add "Apply to all projects" option

---

## Appendix: Wireframe References

### List View Wireframe
- **File:** `docs/modules/bm-pm/design/wireframes/.../pm-04_task_list_view/code.html`
- **Screenshot:** `...pm-04_task_list_view/screen.png`

### Kanban Board Wireframe
- **File:** `docs/modules/bm-pm/design/wireframes/.../pm-03_task_board_(kanban_view)_/code.html`
- **Screenshot:** `...pm-03_task_board_(kanban_view)_/screen.png`

### Calendar View Wireframe
- **File:** `docs/modules/bm-pm/design/wireframes/.../pm-07_project_calendar_view/code.html`
- **Screenshot:** `...pm-07_project_calendar_view/screen.png`

### Saved Views Manager Wireframe
- **File:** `docs/modules/bm-pm/design/wireframes/.../pm-26_saved_views_manager/code.html`
- **Screenshot:** `...pm-26_saved_views_manager/screen.png`

### Command Bar Wireframe
- **File:** `docs/modules/bm-pm/design/wireframes/.../pm-17_global_search/code.html`
- **Screenshot:** `...pm-17_global_search/screen.png`

---

## Summary

This technical specification provides a comprehensive blueprint for implementing Epic PM-03: Views & Navigation. Key highlights:

- **Library choices** are justified and minimize bundle size
- **Component architecture** follows Next.js 15 best practices
- **Performance targets** are clear and measurable
- **Testing strategy** covers unit, integration, and E2E
- **Story breakdown** is actionable with clear dependencies

**Next Steps:**
1. Review and approve this spec
2. Create story files in `docs/modules/bm-pm/stories/`
3. Begin implementation with PM-03.1 (List View)
4. Update sprint-status.yaml to mark PM-03 as 'contexted'

---

**Document Status:** Ready for Review
**Approver:** PM / Tech Lead
**Estimated Total Effort:** 47 story points (~3 sprints)
