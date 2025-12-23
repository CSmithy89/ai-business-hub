'use client'

import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import {
  addDays,
  addMonths,
  differenceInDays,
  endOfDay,
  endOfMonth,
  format,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePmDependencies } from '@/hooks/use-pm-dependencies'
import { useUpdatePmTask, type TaskListItem } from '@/hooks/use-pm-tasks'
import { VIRTUALIZATION } from '@/lib/pm/constants'
import { cn } from '@/lib/utils'
import {
  DEFAULT_DURATION_DAYS,
  ROW_HEIGHT,
  TIMELINE_PADDING_DAYS,
  ZOOM_DAY_WIDTH,
  ZOOM_LABELS,
  type ZoomLevel,
} from './TimelineView.constants'

type TaskDates = {
  start: Date
  end: Date
}

type DragMode = 'move' | 'start' | 'end'

type DragState = {
  taskId: string
  mode: DragMode
  startX: number
  start: Date
  end: Date
}

function parseDate(value: string | null, fallback: Date): Date {
  if (!value) return fallback
  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : fallback
}

function buildTaskDates(task: TaskListItem, overrides?: TaskDates): TaskDates {
  if (overrides) return overrides
  const baseStart = parseDate(task.startedAt, parseDate(task.createdAt, new Date()))
  const endCandidate = parseDate(task.dueDate, addDays(baseStart, DEFAULT_DURATION_DAYS))
  const normalizedStart = startOfDay(baseStart)
  const normalizedEnd = endOfDay(endCandidate)
  if (normalizedEnd < normalizedStart) {
    return { start: normalizedStart, end: endOfDay(addDays(normalizedStart, 1)) }
  }
  return { start: normalizedStart, end: normalizedEnd }
}

function buildSegments(start: Date, end: Date, zoom: ZoomLevel) {
  const segments: Array<{ label: string; start: Date; days: number }> = []

  if (zoom === 'day') {
    let cursor = startOfDay(start)
    while (cursor <= end) {
      segments.push({ label: format(cursor, 'MMM d'), start: cursor, days: 1 })
      cursor = addDays(cursor, 1)
    }
    return segments
  }

  if (zoom === 'week') {
    let cursor = startOfWeek(start, { weekStartsOn: 1 })
    while (cursor <= end) {
      segments.push({ label: `Wk ${format(cursor, 'MMM d')}`, start: cursor, days: 7 })
      cursor = addDays(cursor, 7)
    }
    return segments
  }

  let cursor = startOfMonth(start)
  while (cursor <= end) {
    const monthEnd = endOfMonth(cursor)
    const days = differenceInDays(monthEnd, cursor) + 1
    segments.push({ label: format(cursor, 'MMM yyyy'), start: cursor, days })
    cursor = addMonths(cursor, 1)
  }
  return segments
}

/**
 * Compute the longest dependency chain to highlight critical tasks.
 * Uses directed edges of predecessor -> successor and ignores cyclic branches.
 */
function buildCriticalPath(
  items: Array<{ id: string; duration: number }>,
  edges: Array<{ from: string; to: string }>,
) {
  if (edges.length === 0) return new Set<string>()
  const childrenMap = new Map<string, string[]>()
  const durationMap = new Map<string, number>()

  items.forEach((item) => {
    durationMap.set(item.id, item.duration)
    childrenMap.set(item.id, [])
  })

  edges.forEach((edge) => {
    const list = childrenMap.get(edge.from)
    if (!list) return
    list.push(edge.to)
  })

  const memo = new Map<string, { length: number; path: string[] }>()
  const visiting = new Set<string>()

  const dfs = (id: string): { length: number; path: string[] } => {
    if (memo.has(id)) return memo.get(id)!
    if (visiting.has(id)) return { length: 0, path: [] }
    visiting.add(id)
    const duration = durationMap.get(id) ?? 0
    const children = childrenMap.get(id) ?? []
    if (children.length === 0) {
      const result = { length: duration, path: [id] }
      memo.set(id, result)
      visiting.delete(id)
      return result
    }

    let best = { length: 0, path: [] as string[] }
    for (const child of children) {
      const childResult = dfs(child)
      if (childResult.length > best.length) {
        best = childResult
      }
    }

    const result = { length: duration + best.length, path: [id, ...best.path] }
    memo.set(id, result)
    visiting.delete(id)
    return result
  }

  let bestPath: string[] = []
  let bestLength = 0
  items.forEach((item) => {
    const result = dfs(item.id)
    if (result.length > bestLength) {
      bestLength = result.length
      bestPath = result.path
    }
  })

  return new Set(bestPath)
}

export function TimelineView({
  tasks,
  onSelectTask,
}: {
  tasks: TaskListItem[]
  onSelectTask?: (taskId: string) => void
}) {
  const [zoom, setZoom] = useState<ZoomLevel>('week')
  const [draftDates, setDraftDates] = useState<Record<string, TaskDates>>({})
  const [dragState, setDragState] = useState<DragState | null>(null)
  const { mutate: updateTask } = useUpdatePmTask()
  const latestDraftDates = useRef(draftDates)
  const scrollRef = useRef<HTMLDivElement>(null)
  const projectId = tasks[0]?.projectId ?? null
  const { data: dependenciesData } = usePmDependencies(
    { projectId: projectId ?? undefined, crossProjectOnly: false, limit: 100 },
    { enabled: !!projectId },
  )
  const dependencyRelations = dependenciesData?.data.relations ?? []

  useEffect(() => {
    latestDraftDates.current = draftDates
  }, [draftDates])

  useEffect(() => {
    if (!projectId || typeof window === 'undefined') return
    try {
      const stored = window.localStorage.getItem(`pm-timeline-zoom-${projectId}`)
      if (stored === 'day' || stored === 'week' || stored === 'month') {
        setZoom(stored as ZoomLevel)
      }
    } catch (error) {
      console.error('Failed to read timeline zoom from localStorage:', error)
      // Ignore storage errors (private browsing, disabled storage)
    }
  }, [projectId])

  const schedule = useMemo(() => {
    return tasks.map((task) => {
      const overrides = draftDates[task.id]
      const dates = buildTaskDates(task, overrides)
      return { task, dates }
    })
  }, [tasks, draftDates])

  const timelineBounds = useMemo(() => {
    if (schedule.length === 0) {
      const today = startOfDay(new Date())
      return { start: today, end: addDays(today, 14) }
    }

    let min = schedule[0].dates.start
    let max = schedule[0].dates.end
    schedule.forEach(({ dates }) => {
      if (dates.start < min) min = dates.start
      if (dates.end > max) max = dates.end
    })

    return {
      start: startOfDay(addDays(min, -TIMELINE_PADDING_DAYS)),
      end: endOfDay(addDays(max, TIMELINE_PADDING_DAYS)),
    }
  }, [schedule])

  const totalDays = Math.max(1, differenceInDays(timelineBounds.end, timelineBounds.start) + 1)
  const dayWidth = ZOOM_DAY_WIDTH[zoom]
  const timelineWidth = totalDays * dayWidth
  const segments = useMemo(() => buildSegments(timelineBounds.start, timelineBounds.end, zoom), [timelineBounds, zoom])

  const dependencyEdges = useMemo(() => {
    if (dependencyRelations.length === 0) return []
    const taskIds = new Set(tasks.map((task) => task.id))
    const edges: Array<{ from: string; to: string }> = []
    const seen = new Set<string>()

    dependencyRelations.forEach((relation) => {
      const sourceId = relation.source.taskId
      const targetId = relation.target.taskId
      if (!taskIds.has(sourceId) || !taskIds.has(targetId)) return

      let from: string | null = null
      let to: string | null = null

      if (relation.relationType === 'BLOCKS' || relation.relationType === 'DEPENDENCY_OF') {
        from = sourceId
        to = targetId
      } else if (relation.relationType === 'BLOCKED_BY' || relation.relationType === 'DEPENDS_ON') {
        from = targetId
        to = sourceId
      }

      if (!from || !to || from === to) return
      const key = `${from}:${to}`
      if (seen.has(key)) return
      seen.add(key)
      edges.push({ from, to })
    })

    return edges
  }, [dependencyRelations, tasks])

  const criticalPath = useMemo(() => {
    const items = schedule.map(({ task, dates }) => ({
      id: task.id,
      duration: Math.max(1, differenceInDays(dates.end, dates.start) + 1),
    }))
    return buildCriticalPath(items, dependencyEdges)
  }, [schedule, dependencyEdges])

  useEffect(() => {
    if (!dragState) return

    const handleMove = (event: globalThis.MouseEvent) => {
      const deltaDays = Math.round((event.clientX - dragState.startX) / dayWidth)
      let nextStart = dragState.start
      let nextEnd = dragState.end

      if (dragState.mode === 'move') {
        nextStart = addDays(dragState.start, deltaDays)
        nextEnd = addDays(dragState.end, deltaDays)
      } else if (dragState.mode === 'start') {
        nextStart = addDays(dragState.start, deltaDays)
        if (nextStart >= dragState.end) {
          nextStart = addDays(dragState.end, -1)
        }
      } else {
        nextEnd = addDays(dragState.end, deltaDays)
        if (nextEnd <= dragState.start) {
          nextEnd = addDays(dragState.start, 1)
        }
      }

      setDraftDates((prev) => ({
        ...prev,
        [dragState.taskId]: { start: startOfDay(nextStart), end: endOfDay(nextEnd) },
      }))
    }

    const handleUp = () => {
      const updated = latestDraftDates.current[dragState.taskId]
      if (updated) {
        updateTask({
          taskId: dragState.taskId,
          input: {
            startedAt: startOfDay(updated.start).toISOString(),
            dueDate: endOfDay(updated.end).toISOString(),
          },
        })
      }
      setDragState(null)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [dayWidth, dragState, updateTask])

  const shouldVirtualize = schedule.length > VIRTUALIZATION.TABLE_ROW_THRESHOLD
  const rowVirtualizer = useVirtualizer({
    count: schedule.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: VIRTUALIZATION.OVERSCAN,
    enabled: shouldVirtualize,
  })

  const virtualRows = shouldVirtualize
    ? rowVirtualizer.getVirtualItems()
    : schedule.map((_, index) => ({
        index,
        start: index * ROW_HEIGHT,
        size: ROW_HEIGHT,
      }))

  const totalHeight = shouldVirtualize
    ? rowVirtualizer.getTotalSize()
    : schedule.length * ROW_HEIGHT

  const dependencyLines = useMemo(() => {
    const idToIndex = new Map<string, number>()
    schedule.forEach(({ task }, index) => {
      idToIndex.set(task.id, index)
    })

    // Determine visible vertical range
    const visibleStart = virtualRows.length > 0 ? virtualRows[0].start : 0
    const visibleEnd =
      virtualRows.length > 0
        ? virtualRows[virtualRows.length - 1].start + virtualRows[virtualRows.length - 1].size
        : 0
    // Add buffer for smooth scrolling (lines appearing before entering view)
    const buffer = 500
    const renderStart = visibleStart - buffer
    const renderEnd = visibleEnd + buffer

    return dependencyEdges.flatMap((edge) => {
      const parentIndex = idToIndex.get(edge.from)
      if (parentIndex === undefined) return []
      const childIndex = idToIndex.get(edge.to)
      if (childIndex === undefined) return []
      
      const parentY = parentIndex * ROW_HEIGHT + ROW_HEIGHT / 2
      const childY = childIndex * ROW_HEIGHT + ROW_HEIGHT / 2

      // Optimization: Skip lines that are entirely outside the visible/buffered area
      const minY = Math.min(parentY, childY)
      const maxY = Math.max(parentY, childY)
      
      if (maxY < renderStart || minY > renderEnd) {
         return []
      }

      const parent = schedule[parentIndex]
      const child = schedule[childIndex]
      const parentLeft = differenceInDays(parent.dates.end, timelineBounds.start) * dayWidth + dayWidth
      const childLeft = differenceInDays(child.dates.start, timelineBounds.start) * dayWidth

      return [
        {
          id: `${edge.from}-${edge.to}`,
          path: `M ${parentLeft} ${parentY} L ${parentLeft + 12} ${parentY} L ${parentLeft + 12} ${childY} L ${childLeft} ${childY}`,
        },
      ]
    })
  }, [schedule, timelineBounds, dayWidth, dependencyEdges, virtualRows]) // Depend on virtualRows to update on scroll

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-bg-primary))] p-6">
        <h3 className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">Timeline</h3>
        <p className="mt-2 text-sm text-[rgb(var(--color-text-secondary))]">No tasks to plot yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-bg-primary))]">
      <div className="flex flex-col gap-3 border-b border-[rgb(var(--color-border-default))] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-[rgb(var(--color-text-primary))]">Timeline</h3>
          <p className="text-xs text-[rgb(var(--color-text-secondary))]">
            Drag to adjust start/end dates. Critical path is highlighted.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(Object.keys(ZOOM_LABELS) as ZoomLevel[]).map((level) => (
            <Button
              key={level}
              size="sm"
              variant={zoom === level ? 'secondary' : 'outline'}
              onClick={() => {
                setZoom(level)
                if (projectId && typeof window !== 'undefined') {
                  try {
                    window.localStorage.setItem(`pm-timeline-zoom-${projectId}`, level)
                  } catch (error) {
                    console.error('Failed to save timeline zoom to localStorage:', error)
                    // Ignore storage errors (private browsing, disabled storage)
                  }
                }
              }}
            >
              {ZOOM_LABELS[level]}
            </Button>
          ))}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="grid grid-cols-[240px_minmax(0,1fr)] overflow-y-auto"
        style={{ maxHeight: VIRTUALIZATION.TABLE_HEIGHT }}
      >
        <div className="border-r border-[rgb(var(--color-border-default))]">
          <div className="sticky top-0 z-10 flex h-10 items-center border-b border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-bg-primary))] px-3 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--color-text-secondary))]">
            Task
          </div>
          <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
            {virtualRows.map((virtualRow) => {
              const { task, dates } = schedule[virtualRow.index]
              const isCritical = criticalPath.has(task.id)
              return (
                <div
                  key={task.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="flex items-center gap-2 border-b border-[rgb(var(--color-border-default))] px-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[rgb(var(--color-text-secondary))]">#{task.taskNumber}</span>
                      <span className="truncate text-sm font-medium text-[rgb(var(--color-text-primary))]">
                        {task.title}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-[rgb(var(--color-text-secondary))]">
                      {format(dates.start, 'MMM d')} → {format(dates.end, 'MMM d')}
                    </div>
                  </div>
                  {isCritical ? (
                    <Badge variant="destructive" className="ml-auto text-[10px]">
                      Critical
                    </Badge>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <div style={{ width: `${timelineWidth}px` }}>
            <div className="sticky top-0 z-10 flex h-10 border-b border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-bg-primary))]">
              {segments.map((segment) => (
                <div
                  key={`${segment.label}-${segment.start.toISOString()}`}
                  className="flex items-center justify-center border-r border-[rgb(var(--color-border-default))] text-[11px] font-medium text-[rgb(var(--color-text-secondary))]"
                  style={{ width: `${segment.days * dayWidth}px` }}
                >
                  {segment.label}
                </div>
              ))}
            </div>
            <div className="relative" style={{ height: `${totalHeight}px` }}>
              <svg
                className="absolute left-0 top-0 pointer-events-none"
                width={timelineWidth}
                height={totalHeight}
              >
                <defs>
                  <marker
                    id="dependency-arrow"
                    markerWidth="6"
                    markerHeight="6"
                    refX="5"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L6,3 L0,6 Z" fill="rgba(79, 70, 229, 0.5)" />
                  </marker>
                </defs>
                {dependencyLines.map((line) => (
                  <path
                    key={line.id}
                    d={line.path}
                    stroke="rgba(79, 70, 229, 0.5)"
                    strokeWidth="1.5"
                    fill="none"
                    markerEnd="url(#dependency-arrow)"
                  />
                ))}
              </svg>
              {virtualRows.map((virtualRow) => {
                const { task, dates } = schedule[virtualRow.index]
                const isCritical = criticalPath.has(task.id)
                const startOffset = differenceInDays(dates.start, timelineBounds.start) * dayWidth
                const durationDays = Math.max(1, differenceInDays(dates.end, dates.start) + 1)
                const barWidth = Math.max(dayWidth, durationDays * dayWidth)
                const handleDown = (mode: DragMode) => (event: ReactMouseEvent<HTMLDivElement>) => {
                  event.preventDefault()
                  event.stopPropagation()
                  setDragState({
                    taskId: task.id,
                    mode,
                    startX: event.clientX,
                    start: dates.start,
                    end: dates.end,
                  })
                }
                const handleKeyboardResize = (mode: 'start' | 'end', deltaDays: number) => {
                  const currentDates = latestDraftDates.current[task.id] ?? dates
                  let nextStart = currentDates.start
                  let nextEnd = currentDates.end

                  if (mode === 'start') {
                    nextStart = addDays(currentDates.start, deltaDays)
                    if (nextStart >= currentDates.end) {
                      nextStart = addDays(currentDates.end, -1)
                    }
                  } else {
                    nextEnd = addDays(currentDates.end, deltaDays)
                    if (nextEnd <= currentDates.start) {
                      nextEnd = addDays(currentDates.start, 1)
                    }
                  }

                  const normalizedStart = startOfDay(nextStart)
                  const normalizedEnd = endOfDay(nextEnd)
                  setDraftDates((prev) => ({
                    ...prev,
                    [task.id]: { start: normalizedStart, end: normalizedEnd },
                  }))
                  updateTask({
                    taskId: task.id,
                    input: {
                      startedAt: normalizedStart.toISOString(),
                      dueDate: normalizedEnd.toISOString(),
                    },
                  })
                }

                return (
                  <div
                    key={task.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                      borderBottom: '1px solid rgb(var(--color-border-default))',
                    }}
                  >
                    <div
                      className={cn(
                        'absolute top-3 h-6 rounded-md border px-2 text-xs font-semibold text-white shadow-sm',
                        isCritical
                          ? 'border-red-400 bg-red-500'
                          : 'border-[rgb(var(--color-primary-500))] bg-[rgb(var(--color-primary-500))]',
                      )}
                      style={{ left: `${startOffset}px`, width: `${barWidth}px` }}
                      onMouseDown={handleDown('move')}
                      onClick={() => onSelectTask?.(task.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          onSelectTask?.(task.id)
                          return
                        }
                        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
                        if (!event.shiftKey && !event.altKey) return
                        event.preventDefault()
                        event.stopPropagation()
                        const deltaDays = event.key === 'ArrowRight' ? 1 : -1
                        if (event.shiftKey) {
                          handleKeyboardResize('start', deltaDays)
                          return
                        }
                        handleKeyboardResize('end', deltaDays)
                      }}
                      aria-keyshortcuts="Shift+ArrowLeft Shift+ArrowRight Alt+ArrowLeft Alt+ArrowRight"
                      role="button"
                      tabIndex={0}
                    >
                      <span className="truncate">{task.title}</span>
                      <span
                        className="absolute left-0 top-0 h-full w-2 cursor-ew-resize"
                        onMouseDown={handleDown('start')}
                        aria-hidden="true"
                      />
                      <span
                        className="absolute right-0 top-0 h-full w-2 cursor-ew-resize"
                        onMouseDown={handleDown('end')}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
