'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { format, parseISO } from 'date-fns'
import { CalendarIcon, Check, Loader2, Pencil, Trash2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAgents } from '@/hooks/use-agents'
import { useSession } from '@/lib/auth-client'
import { usePmTeam } from '@/hooks/use-pm-team'
import {
  useCreatePmTask,
  useCreatePmTaskAttachment,
  useCreatePmTaskComment,
  useCreatePmTaskRelation,
  useDeletePmTaskAttachment,
  useDeletePmTaskComment,
  useDeletePmTaskRelation,
  useDeletePmTaskLabel,
  usePmTasks,
  usePmTask,
  useUpsertPmTaskLabel,
  useUpdatePmTaskComment,
  useUpdatePmTask,
  type TaskPriority,
  type TaskRelationType,
  type TaskStatus,
  type TaskType,
  type UpdateTaskInput,
} from '@/hooks/use-pm-tasks'
import { deriveAssignmentType } from '@/lib/pm/task-assignment'
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

const TASK_RELATION_OPTIONS: Array<{ value: TaskRelationType; label: string }> = [
  { value: 'BLOCKS', label: 'Blocks' },
  { value: 'BLOCKED_BY', label: 'Blocked by' },
  { value: 'RELATES_TO', label: 'Relates to' },
  { value: 'DUPLICATES', label: 'Duplicates' },
]

const TASK_RELATION_INVERSE: Partial<Record<TaskRelationType, TaskRelationType>> = {
  BLOCKS: 'BLOCKED_BY',
  BLOCKED_BY: 'BLOCKS',
  DUPLICATES: 'DUPLICATED_BY',
  DUPLICATED_BY: 'DUPLICATES',
  RELATES_TO: 'RELATES_TO',
}

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

  const { data: session } = useSession()
  const currentUserId = session?.user?.id

  const { data, isLoading, error } = usePmTask(taskId)
  const task = data?.data

  const createTask = useCreatePmTask()
  const updateTask = useUpdatePmTask()
  const createRelation = useCreatePmTaskRelation()
  const deleteRelation = useDeletePmTaskRelation()
  const createComment = useCreatePmTaskComment()
  const updateComment = useUpdatePmTaskComment()
  const deleteComment = useDeletePmTaskComment()
  const createAttachment = useCreatePmTaskAttachment()
  const deleteAttachment = useDeletePmTaskAttachment()
  const upsertLabel = useUpsertPmTaskLabel()
  const deleteLabel = useDeletePmTaskLabel()

  const team = usePmTeam(task?.projectId ?? '')
  const members = team.data?.data.members ?? []
  const agentsQuery = useAgents()
  const agents = agentsQuery.data ?? []

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState<string>('')
  const [storyPoints, setStoryPoints] = useState<string>('')
  const [subtaskTitle, setSubtaskTitle] = useState('')
  const [subtaskOpen, setSubtaskOpen] = useState(false)
  const [relationOpen, setRelationOpen] = useState(false)
  const [relationType, setRelationType] = useState<TaskRelationType>('BLOCKS')
  const [relationSearch, setRelationSearch] = useState('')
  const [relationTargetTaskId, setRelationTargetTaskId] = useState<string | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [commentEditingId, setCommentEditingId] = useState<string | null>(null)
  const [commentEditingContent, setCommentEditingContent] = useState('')
  const [attachmentUploading, setAttachmentUploading] = useState(false)
  const [labelDraft, setLabelDraft] = useState('')
  const [labelColor, setLabelColor] = useState('#6B7280')

  useEffect(() => {
    if (!task) return
    setTitle(task.title ?? '')
    setDescription(task.description ?? '')
    setStoryPoints(task.storyPoints === null ? '' : String(task.storyPoints))
    setSubtaskTitle('')
    setSubtaskOpen(false)
    setRelationOpen(false)
    setRelationType('BLOCKS')
    setRelationSearch('')
    setRelationTargetTaskId(null)
    setCommentDraft('')
    setCommentEditingId(null)
    setCommentEditingContent('')
    setAttachmentUploading(false)
    setLabelDraft('')
    setLabelColor('#6B7280')
  }, [task?.id])

  const relationSearchQuery = usePmTasks({
    projectId: task?.projectId,
    search: relationSearch.trim() ? relationSearch.trim() : undefined,
    limit: 10,
  })

  const relationSearchResults = useMemo(() => {
    if (!task?.projectId) return []
    const candidates = relationSearchQuery.data?.data ?? []
    return candidates.filter((candidate) => candidate.id !== task.id)
  }, [relationSearchQuery.data?.data, task?.id, task?.projectId])

  const dueDate = useMemo(() => {
    if (!task?.dueDate) return undefined
    try {
      return parseISO(task.dueDate)
    } catch {
      return undefined
    }
  }, [task?.dueDate])

  const isSaving = updateTask.isPending

  function initials(label?: string | null) {
    if (!label) return '?'
    const normalized = label.trim()
    if (!normalized) return '?'
    const parts = normalized.split(/\s+/).filter(Boolean)
    const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).filter(Boolean)
    return letters.join('') || normalized[0]?.toUpperCase() || '?'
  }

  function saveField(input: UpdateTaskInput) {
    if (!taskId) return
    updateTask.mutate({ taskId, input })
  }

  function openTask(nextTaskId: string) {
    const next = new URLSearchParams(searchParams.toString())
    next.set('taskId', nextTaskId)
    router.push(`${pathname}?${next.toString()}` as any)
  }

  async function handleAddRelation() {
    if (!task) return
    if (!relationTargetTaskId) return

    await createRelation.mutateAsync({
      taskId: task.id,
      input: { targetTaskId: relationTargetTaskId, relationType },
    })

    setRelationSearch('')
    setRelationTargetTaskId(null)
    setRelationOpen(false)
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

  async function handleCreateComment() {
    if (!task) return
    const trimmed = commentDraft.trim()
    if (!trimmed) return

    await createComment.mutateAsync({ taskId: task.id, input: { content: trimmed } })
    setCommentDraft('')
  }

  async function uploadAttachment(file: File) {
    if (!task) return
    if (file.size <= 0) return

    setAttachmentUploading(true)
    try {
      const form = new FormData()
      form.set('file', file)

      const response = await fetch(`/api/pm/tasks/${encodeURIComponent(task.id)}/attachments/upload`, {
        method: 'POST',
        body: form,
      })

      const body = (await response.json().catch(() => null)) as
        | { success: true; data: { fileName: string; fileUrl: string; fileType: string; fileSize: number } }
        | { success: false; message?: string }
        | null

      if (!response.ok || !body || !('success' in body) || !body.success) {
        throw new Error((body && 'message' in body && typeof body.message === 'string' ? body.message : null) || 'Upload failed')
      }

      await createAttachment.mutateAsync({
        taskId: task.id,
        input: body.data,
      })
    } finally {
      setAttachmentUploading(false)
    }
  }

  async function handleAddLabel() {
    if (!task) return
    const trimmed = labelDraft.trim()
    if (!trimmed) return
    await upsertLabel.mutateAsync({ taskId: task.id, input: { name: trimmed, color: labelColor } })
    setLabelDraft('')
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Assignee</span>
                <Select
                  value={task.assigneeId ?? 'unassigned'}
                  onValueChange={(value) => {
                    const nextAssigneeId = value === 'unassigned' ? null : value
                    const nextAgentId = task.agentId ?? null
                    saveField({
                      assigneeId: nextAssigneeId,
                      agentId: nextAgentId,
                      assignmentType: deriveAssignmentType({ assigneeId: nextAssigneeId, agentId: nextAgentId }),
                    })
                  }}
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
                          <span className="inline-flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              {m.user?.image ? <AvatarImage src={m.user.image} alt="" /> : null}
                              <AvatarFallback className="text-[10px]">
                                {initials(m.user?.name || m.user?.email)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{m.user?.name || m.user?.email || m.userId}</span>
                          </span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Agent</span>
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                    {task.assignmentType.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <Select
                  value={task.agentId ?? 'unassigned'}
                  onValueChange={(value) => {
                    const nextAgentId = value === 'unassigned' ? null : value
                    const nextAssigneeId = task.assigneeId ?? null
                    saveField({
                      assigneeId: nextAssigneeId,
                      agentId: nextAgentId,
                      assignmentType: deriveAssignmentType({ assigneeId: nextAssigneeId, agentId: nextAgentId }),
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {agents
                      .filter((agent) => agent.enabled)
                      .map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          <span className="inline-flex items-center gap-2">
                            <span className="text-base leading-none" aria-hidden="true">
                              {agent.avatar}
                            </span>
                            <span className="truncate">{agent.name}</span>
                            <Badge variant="outline" className="ml-1 h-5 px-1.5 text-[10px]">
                              AI
                            </Badge>
                          </span>
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
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Relations</span>
                  {task.isBlocked ? (
                    <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                      Blocked
                    </Badge>
                  ) : null}
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => setRelationOpen((v) => !v)}>
                  {relationOpen ? 'Cancel' : 'Add relation'}
                </Button>
              </div>

              {relationOpen ? (
                <div className="rounded-md border border-[rgb(var(--color-border-default))] p-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Type</span>
                      <Select value={relationType} onValueChange={(value) => setRelationType(value as TaskRelationType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_RELATION_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Target task</span>
                      <Input
                        value={relationSearch}
                        onChange={(e) => {
                          setRelationSearch(e.target.value)
                          setRelationTargetTaskId(null)
                        }}
                        placeholder="Search tasks…"
                      />
                    </div>
                  </div>

                  {relationSearch.trim() ? (
                    <div className="mt-3 max-h-[180px] overflow-auto rounded-md border border-[rgb(var(--color-border-default))]">
                      {relationSearchQuery.isLoading ? (
                        <div className="p-3 text-sm text-[rgb(var(--color-text-secondary))]">Searching…</div>
                      ) : relationSearchResults.length ? (
                        <ul className="divide-y divide-[rgb(var(--color-border-default))]">
                          {relationSearchResults.map((candidate) => (
                            <li key={candidate.id}>
                              <button
                                type="button"
                                className={cn(
                                  'flex w-full items-center justify-between gap-3 px-3 py-2 text-left',
                                  'hover:bg-[rgb(var(--color-bg-tertiary))] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary-500))]',
                                )}
                                onClick={() => {
                                  setRelationTargetTaskId(candidate.id)
                                  setRelationSearch(`#${candidate.taskNumber} ${candidate.title}`)
                                }}
                              >
                                <span className="truncate text-sm text-[rgb(var(--color-text-primary))]">
                                  #{candidate.taskNumber} {candidate.title}
                                </span>
                                <span className="text-xs text-[rgb(var(--color-text-secondary))]">
                                  {candidate.status.replace(/_/g, ' ')}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="p-3 text-sm text-[rgb(var(--color-text-secondary))]">No matches.</div>
                      )}
                    </div>
                  ) : null}

                  <div className="mt-3 flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void handleAddRelation()}
                      disabled={!relationTargetTaskId || createRelation.isPending}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              ) : null}

              {(() => {
                const outgoing = task.relations ?? []
                const outgoingKeys = new Set(outgoing.map((relation) => `${relation.targetTaskId}:${relation.relationType}`))

                const incomingUnique =
                  task.relatedTo?.filter((relation) => {
                    const inferred = TASK_RELATION_INVERSE[relation.relationType] ?? relation.relationType
                    const key = `${relation.sourceTaskId}:${inferred}`
                    return !outgoingKeys.has(key)
                  }) ?? []

                if (!outgoing.length && !incomingUnique.length) {
                  return <div className="text-sm text-[rgb(var(--color-text-secondary))]">No relations yet.</div>
                }

                return (
                  <div className="rounded-md border border-[rgb(var(--color-border-default))]">
                    <ul className="divide-y divide-[rgb(var(--color-border-default))]">
                      {outgoing.map((relation) => {
                        const related = relation.targetTask
                        const label =
                          TASK_RELATION_OPTIONS.find((option) => option.value === relation.relationType)?.label ??
                          relation.relationType.replace(/_/g, ' ')

                        return (
                          <li key={relation.id} className="flex items-center justify-between gap-3 px-3 py-2">
                            <button
                              type="button"
                              className={cn(
                                'min-w-0 flex-1 text-left',
                                'hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary-500))]',
                              )}
                              onClick={() => (related ? openTask(related.id) : null)}
                            >
                              <div className="truncate text-sm font-medium text-[rgb(var(--color-text-primary))]">
                                {label}:{' '}
                                {related ? `#${related.taskNumber} ${related.title}` : relation.targetTaskId}
                              </div>
                              {related ? (
                                <div className="mt-1 text-xs text-[rgb(var(--color-text-secondary))]">
                                  {related.status.replace(/_/g, ' ')}
                                </div>
                              ) : null}
                            </button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteRelation.mutate({ taskId: task.id, relationId: relation.id })}
                              disabled={deleteRelation.isPending}
                              aria-label="Remove relation"
                            >
                              <X className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </li>
                        )
                      })}

                      {incomingUnique.length ? (
                        <li className="px-3 py-2 text-xs font-medium text-[rgb(var(--color-text-secondary))]">
                          Incoming
                        </li>
                      ) : null}

                      {incomingUnique.map((relation) => {
                        const inferred = TASK_RELATION_INVERSE[relation.relationType] ?? relation.relationType
                        const related = relation.sourceTask
                        const label =
                          TASK_RELATION_OPTIONS.find((option) => option.value === inferred)?.label ??
                          inferred.replace(/_/g, ' ')

                        return (
                          <li key={relation.id} className="px-3 py-2">
                            <button
                              type="button"
                              className={cn(
                                'min-w-0 text-left',
                                'hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary-500))]',
                              )}
                              onClick={() => (related ? openTask(related.id) : null)}
                            >
                              <div className="truncate text-sm font-medium text-[rgb(var(--color-text-primary))]">
                                {label}:{' '}
                                {related ? `#${related.taskNumber} ${related.title}` : relation.sourceTaskId}
                              </div>
                              {related ? (
                                <div className="mt-1 text-xs text-[rgb(var(--color-text-secondary))]">
                                  {related.status.replace(/_/g, ' ')}
                                </div>
                              ) : null}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })()}
            </div>

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
                <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Labels</span>
                {upsertLabel.isPending || deleteLabel.isPending ? (
                  <span className="inline-flex items-center gap-2 text-xs text-[rgb(var(--color-text-secondary))]">
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                    Saving…
                  </span>
                ) : null}
              </div>

              <div className="flex items-start gap-2">
                <Input
                  value={labelDraft}
                  onChange={(e) => setLabelDraft(e.target.value)}
                  placeholder="Add label…"
                />
                <input
                  type="color"
                  value={labelColor}
                  onChange={(e) => setLabelColor(e.target.value)}
                  className="h-9 w-10 cursor-pointer rounded-md border border-[rgb(var(--color-border-default))] bg-transparent p-1"
                  aria-label="Label color"
                />
                <Button type="button" size="sm" onClick={() => void handleAddLabel()} disabled={!labelDraft.trim()}>
                  Add
                </Button>
              </div>

              {task.labels?.length ? (
                <div className="flex flex-wrap gap-2">
                  {task.labels.map((label) => (
                    <Badge
                      key={label.id}
                      variant="secondary"
                      className="inline-flex items-center gap-1"
                      style={{ borderColor: label.color, color: label.color }}
                    >
                      <span className="truncate">{label.name}</span>
                      <button
                        type="button"
                        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded hover:bg-[rgb(var(--color-bg-tertiary))]"
                        onClick={() => deleteLabel.mutate({ taskId: task.id, labelId: label.id })}
                        aria-label="Remove label"
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-[rgb(var(--color-text-secondary))]">No labels yet.</div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Attachments</span>
                {attachmentUploading || createAttachment.isPending || deleteAttachment.isPending ? (
                  <span className="inline-flex items-center gap-2 text-xs text-[rgb(var(--color-text-secondary))]">
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                    Uploading…
                  </span>
                ) : null}
              </div>

              <label
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 rounded-md border border-dashed border-[rgb(var(--color-border-default))] px-3 py-2',
                  'hover:bg-[rgb(var(--color-bg-tertiary))]',
                )}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const file = e.dataTransfer.files?.[0]
                  if (file) void uploadAttachment(file)
                }}
              >
                <span className="text-sm text-[rgb(var(--color-text-secondary))]">
                  Drag & drop a file or click to choose
                </span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void uploadAttachment(file)
                    e.currentTarget.value = ''
                  }}
                  disabled={attachmentUploading}
                />
                <Button type="button" size="sm" variant="outline" disabled={attachmentUploading}>
                  Choose
                </Button>
              </label>

              {task.attachments?.length ? (
                <div className="max-h-[180px] overflow-auto rounded-md border border-[rgb(var(--color-border-default))]">
                  <ul className="divide-y divide-[rgb(var(--color-border-default))]">
                    {task.attachments.map((attachment) => (
                      <li key={attachment.id} className="flex items-center justify-between gap-3 px-3 py-2">
                        <a
                          className={cn('min-w-0 flex-1 truncate text-sm text-[rgb(var(--color-text-primary))]', 'hover:underline')}
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {attachment.fileName}
                        </a>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            deleteAttachment.mutate({ taskId: task.id, attachmentId: attachment.id })
                          }
                          aria-label="Remove attachment"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-sm text-[rgb(var(--color-text-secondary))]">No attachments yet.</div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Comments</span>
                {createComment.isPending || updateComment.isPending || deleteComment.isPending ? (
                  <span className="inline-flex items-center gap-2 text-xs text-[rgb(var(--color-text-secondary))]">
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                    Saving…
                  </span>
                ) : null}
              </div>

              <div className="flex items-start gap-2">
                <Textarea
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder="Add a comment…"
                  className="min-h-[64px]"
                />
                <Button type="button" size="sm" onClick={() => void handleCreateComment()} disabled={!commentDraft.trim()}>
                  Post
                </Button>
              </div>

              {task.comments?.length ? (
                <div className="max-h-[220px] overflow-auto rounded-md border border-[rgb(var(--color-border-default))]">
                  <ul className="divide-y divide-[rgb(var(--color-border-default))]">
                    {task.comments.map((comment) => {
                      const isAuthor = !!currentUserId && comment.userId === currentUserId
                      const isEditing = commentEditingId === comment.id

                      return (
                        <li key={comment.id} className="p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-xs font-medium text-[rgb(var(--color-text-primary))]">
                                  {isAuthor ? 'You' : comment.userId}
                                </span>
                                <span className="text-xs text-[rgb(var(--color-text-secondary))]">
                                  {(() => {
                                    try {
                                      return format(parseISO(comment.createdAt), 'MMM d, HH:mm')
                                    } catch {
                                      return '—'
                                    }
                                  })()}
                                </span>
                              </div>

                              {isEditing ? (
                                <div className="mt-2">
                                  <Textarea
                                    value={commentEditingContent}
                                    onChange={(e) => setCommentEditingContent(e.target.value)}
                                    className="min-h-[72px]"
                                  />
                                  <div className="mt-2 flex items-center justify-end gap-2">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setCommentEditingId(null)
                                        setCommentEditingContent('')
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() =>
                                        updateComment.mutate({
                                          taskId: task.id,
                                          commentId: comment.id,
                                          input: { content: commentEditingContent },
                                        })
                                      }
                                      disabled={!commentEditingContent.trim()}
                                    >
                                      <Check className="h-4 w-4" aria-hidden="true" />
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-2 whitespace-pre-wrap text-sm text-[rgb(var(--color-text-primary))]">
                                  {comment.content}
                                </div>
                              )}
                            </div>

                            {isAuthor && !isEditing ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    setCommentEditingId(comment.id)
                                    setCommentEditingContent(comment.content)
                                  }}
                                  aria-label="Edit comment"
                                >
                                  <Pencil className="h-4 w-4" aria-hidden="true" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => deleteComment.mutate({ taskId: task.id, commentId: comment.id })}
                                  aria-label="Delete comment"
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : (
                <div className="text-sm text-[rgb(var(--color-text-secondary))]">No comments yet.</div>
              )}
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
