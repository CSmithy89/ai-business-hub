'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { format, parseISO } from 'date-fns'
import { CalendarIcon, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { usePmTeam } from '@/hooks/use-pm-team'
import {
  useCreatePmTask,
  usePmTask,
  useUpdatePmTask,
  type TaskPriority,
  type TaskStatus,
  type TaskType,
  type UpdateTaskInput,
} from '@/hooks/use-pm-tasks'
import { TASK_PRIORITIES, TASK_PRIORITY_META, TASK_TYPES, TASK_TYPE_META } from '@/lib/pm/task-meta'
import { cn } from '@/lib/utils'

const TASK_STATUSES: TaskStatus[] = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'AWAITING_APPROVAL',
  'DONE',
  'CANCELLED',
]

function formatDateLabel(value: string | null): string {
  if (!value) return 'No due date'
  try {
    return format(parseISO(value), 'PPP')
  } catch {
    return 'No due date'
  }
}

export function TaskDetailSheet({
  open,
  taskId,
  onOpenChange,
}: {
  open: boolean
  taskId: string | null
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  const { data, isLoading, error } = usePmTask(taskId)
  const task = data?.data

  const createTask = useCreatePmTask()
  const updateTask = useUpdatePmTask()

  const team = usePmTeam(task?.projectId ?? '')
  const members = team.data?.data.members ?? []

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState<string>('')
  const [storyPoints, setStoryPoints] = useState<string>('')
  const [subtaskTitle, setSubtaskTitle] = useState('')
  const [subtaskOpen, setSubtaskOpen] = useState(false)

  useEffect(() => {
    if (!task) return
    setTitle(task.title ?? '')
    setDescription(task.description ?? '')
    setStoryPoints(task.storyPoints === null ? '' : String(task.storyPoints))
    setSubtaskTitle('')
    setSubtaskOpen(false)
  }, [task?.id])

  const dueDate = useMemo(() => {
    if (!task?.dueDate) return undefined
    try {
      return parseISO(task.dueDate)
    } catch {
      return undefined
    }
  }, [task?.dueDate])

  const isSaving = updateTask.isPending

  function saveField(input: UpdateTaskInput) {
    if (!taskId) return
    updateTask.mutate({ taskId, input })
  }

  function openTask(nextTaskId: string) {
    const next = new URLSearchParams(searchParams.toString())
    next.set('taskId', nextTaskId)
    router.push(`${pathname}?${next.toString()}` as any)
  }

  async function handleCreateSubtask() {
    if (!task) return
    const trimmed = subtaskTitle.trim()
    if (!trimmed) return

    const created = await createTask.mutateAsync({
      input: {
        projectId: task.projectId,
        phaseId: task.phaseId,
        title: trimmed,
        parentId: task.id,
        type: 'SUBTASK',
      },
    })

    setSubtaskTitle('')
    setSubtaskOpen(false)
    queryClient.invalidateQueries({ queryKey: ['pm-task'] })
    openTask(created.data.id)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[480px]">
        <SheetHeader className="space-y-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="truncate">
                Task #{task?.taskNumber ?? '—'}
              </SheetTitle>
              <p className="mt-1 text-xs text-[rgb(var(--color-text-secondary))]">
                {task?.status ? task.status.replace(/_/g, ' ') : '—'}
              </p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-[rgb(var(--color-text-secondary))]">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading task…
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error.message}
          </div>
        ) : null}

        {task ? (
          <div className="mt-6 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Title</span>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  if (title.trim() !== task.title) saveField({ title: title.trim() })
                }}
                placeholder="Task title"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Status</span>
                <Select
                  value={task.status}
                  onValueChange={(value) => saveField({ status: value as TaskStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Type</span>
                <Select value={task.type} onValueChange={(value) => saveField({ type: value as TaskType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_TYPES.map((type) => {
                      const meta = TASK_TYPE_META[type]
                      const Icon = meta.icon
                      return (
                        <SelectItem key={type} value={type}>
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

              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Priority</span>
                <Select value={task.priority} onValueChange={(value) => saveField({ priority: value as TaskPriority })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITIES.map((priority) => {
                      const meta = TASK_PRIORITY_META[priority]
                      return (
                        <SelectItem key={priority} value={priority}>
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
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Assignee</span>
                <Select
                  value={task.assigneeId ?? 'unassigned'}
                  onValueChange={(value) => saveField({ assigneeId: value === 'unassigned' ? null : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members
                      .filter((m) => m.user)
                      .map((m) => (
                        <SelectItem key={m.userId} value={m.userId}>
                          {m.user?.name || m.user?.email || m.userId}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Story points</span>
                <Input
                  value={storyPoints}
                  inputMode="numeric"
                  onChange={(e) => setStoryPoints(e.target.value)}
                  onBlur={() => {
                    const trimmed = storyPoints.trim()
                    const next = trimmed === '' ? null : Number(trimmed)
                    const safe = next !== null && Number.isFinite(next) ? next : null
                    if (safe !== task.storyPoints) saveField({ storyPoints: safe })
                  }}
                  placeholder="e.g. 3"
                />
              </div>
            </div>

            {task.subtasks ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Subtasks</div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-[rgb(var(--color-text-secondary))]">
                      <span>{task.subtasks.total} total</span>
                      <span>•</span>
                      <span>{task.subtasks.completionPercent}% done</span>
                    </div>
                  </div>
                  <Button type="button" size="sm" variant="secondary" onClick={() => setSubtaskOpen((v) => !v)}>
                    {subtaskOpen ? 'Close' : 'Add subtask'}
                  </Button>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-[rgb(var(--color-bg-tertiary))]">
                  <div
                    className="h-full rounded-full bg-[rgb(var(--color-primary-500))]"
                    style={{ width: `${Math.max(0, Math.min(100, task.subtasks.completionPercent))}%` }}
                  />
                </div>

                {task.subtasks.total > 0 &&
                task.subtasks.done === task.subtasks.total &&
                task.status !== 'DONE' ? (
                  <div className="rounded-md border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-bg-tertiary))] p-3">
                    <div className="text-sm font-medium text-[rgb(var(--color-text-primary))]">
                      All subtasks are done
                    </div>
                    <div className="mt-1 text-xs text-[rgb(var(--color-text-secondary))]">
                      Mark the parent task as Done?
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button type="button" size="sm" onClick={() => saveField({ status: 'DONE' })}>
                        Mark Done
                      </Button>
                    </div>
                  </div>
                ) : null}

                {subtaskOpen ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={subtaskTitle}
                      onChange={(e) => setSubtaskTitle(e.target.value)}
                      placeholder="Subtask title"
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          setSubtaskOpen(false)
                        }
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          void handleCreateSubtask()
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void handleCreateSubtask()}
                      disabled={!subtaskTitle.trim() || createTask.isPending}
                    >
                      Create
                    </Button>
                  </div>
                ) : null}

                {task.children?.length ? (
                  <div className="rounded-md border border-[rgb(var(--color-border-default))]">
                    <ul className="divide-y divide-[rgb(var(--color-border-default))]">
                      {task.children.map((child) => {
                        const typeMeta = TASK_TYPE_META[child.type]
                        const TypeIcon = typeMeta.icon
                        const priorityMeta = TASK_PRIORITY_META[child.priority]

                        return (
                          <li key={child.id}>
                            <button
                              type="button"
                              className={cn(
                                'flex w-full items-center justify-between gap-3 px-3 py-2 text-left',
                                'hover:bg-[rgb(var(--color-bg-tertiary))] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary-500))]',
                              )}
                              onClick={() => openTask(child.id)}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <TypeIcon className={cn('h-4 w-4', typeMeta.iconClassName)} aria-hidden="true" />
                                  <span className="text-xs text-[rgb(var(--color-text-secondary))]">
                                    #{child.taskNumber}
                                  </span>
                                  <span className="truncate text-sm font-medium text-[rgb(var(--color-text-primary))]">
                                    {child.title}
                                  </span>
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-xs text-[rgb(var(--color-text-secondary))]">
                                  <span className={cn('h-2.5 w-2.5 rounded-full', priorityMeta.dotClassName)} />
                                  <span>{priorityMeta.label}</span>
                                  <span>•</span>
                                  <span>{child.status.replace(/_/g, ' ')}</span>
                                </div>
                              </div>
                              <span className="text-xs text-[rgb(var(--color-text-secondary))]">Open</span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ) : (
                  <div className="text-sm text-[rgb(var(--color-text-secondary))]">No subtasks yet.</div>
                )}
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Due date</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('justify-start gap-2', !task.dueDate && 'text-[rgb(var(--color-text-secondary))]')}
                    type="button"
                  >
                    <CalendarIcon className="h-4 w-4" aria-hidden="true" />
                    {formatDateLabel(task.dueDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(value) => {
                      const next = value ? value.toISOString() : null
                      saveField({ dueDate: next })
                    }}
                    initialFocus
                  />
                  <div className="flex items-center justify-end gap-2 border-t border-[rgb(var(--color-border-default))] p-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => saveField({ dueDate: null })}>
                      Clear
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Description</span>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => {
                  const next = description.trim() ? description : ''
                  if ((task.description ?? '') !== next) saveField({ description: next })
                }}
                placeholder="Write markdown…"
                className="min-h-[120px]"
              />
              <div className="rounded-md border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-bg-tertiary))] p-3">
                <div className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Preview</div>
                <div className="prose prose-sm mt-2 max-w-none text-[rgb(var(--color-text-primary))]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {description.trim() ? description : '*No description*'}
                  </ReactMarkdown>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Activity</span>
                {isSaving ? (
                  <span className="inline-flex items-center gap-2 text-xs text-[rgb(var(--color-text-secondary))]">
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                    Saving…
                  </span>
                ) : null}
              </div>
              <div className="max-h-[220px] overflow-auto rounded-md border border-[rgb(var(--color-border-default))]">
                {task.activities?.length ? (
                  <ul className="divide-y divide-[rgb(var(--color-border-default))]">
                    {task.activities.map((activity) => (
                      <li key={activity.id} className="p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-medium text-[rgb(var(--color-text-primary))]">
                            {String(activity.type).replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-[rgb(var(--color-text-secondary))]">
                            {(() => {
                              try {
                                return format(parseISO(activity.createdAt), 'MMM d, HH:mm')
                              } catch {
                                return '—'
                              }
                            })()}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-[rgb(var(--color-text-secondary))]">
                          Actor: {activity.userId}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-3 text-sm text-[rgb(var(--color-text-secondary))]">
                    No activity yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
