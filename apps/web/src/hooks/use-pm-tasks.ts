'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSession } from '@/lib/auth-client'
import { NESTJS_API_URL } from '@/lib/api-config'
import { safeJson } from '@/lib/utils/safe-json'

function getBaseUrl(): string {
  if (!NESTJS_API_URL) throw new Error('NESTJS_API_URL is not configured')
  return NESTJS_API_URL.replace(/\/$/, '')
}

function getSessionToken(session: unknown): string | undefined {
  const direct = (session as { token?: string } | null)?.token
  const nested = (session as { session?: { token?: string } } | null)?.session?.token
  return direct || nested || undefined
}

export type TaskType =
  | 'EPIC'
  | 'STORY'
  | 'TASK'
  | 'SUBTASK'
  | 'BUG'
  | 'RESEARCH'
  | 'CONTENT'
  | 'AGENT_REVIEW'

export type TaskPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'

export type TaskStatus =
  | 'BACKLOG'
  | 'TODO'
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'AWAITING_APPROVAL'
  | 'DONE'
  | 'CANCELLED'

export type AssignmentType = 'HUMAN' | 'AGENT' | 'HYBRID'

export interface TaskListItem {
  id: string
  workspaceId: string
  projectId: string
  phaseId: string
  taskNumber: number
  title: string
  description: string | null
  type: TaskType
  priority: TaskPriority
  assignmentType: AssignmentType
  assigneeId: string | null
  agentId: string | null
  storyPoints: number | null
  status: TaskStatus
  dueDate: string | null
  startedAt: string | null
  completedAt: string | null
  parentId: string | null
  createdAt: string
  updatedAt: string
}

export interface TasksListResponse {
  data: TaskListItem[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export type TaskActivity = {
  id: string
  taskId: string
  userId: string
  type: string
  data: unknown
  createdAt: string
}

export type TaskRelationType =
  | 'BLOCKS'
  | 'BLOCKED_BY'
  | 'RELATES_TO'
  | 'DUPLICATES'
  | 'DUPLICATED_BY'
  | 'DEPENDS_ON'
  | 'DEPENDENCY_OF'
  | 'PARENT_OF'
  | 'CHILD_OF'

export type TaskRelationTaskSummary = {
  id: string
  taskNumber: number
  title: string
  status: TaskStatus
  type: TaskType
  priority: TaskPriority
}

export type TaskRelationOutgoing = {
  id: string
  sourceTaskId: string
  targetTaskId: string
  relationType: TaskRelationType
  createdAt: string
  createdBy: string
  targetTask?: TaskRelationTaskSummary
}

export type TaskRelationIncoming = {
  id: string
  sourceTaskId: string
  targetTaskId: string
  relationType: TaskRelationType
  createdAt: string
  createdBy: string
  sourceTask?: TaskRelationTaskSummary
}

export type TaskAttachment = {
  id: string
  taskId: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  uploadedBy: string
  uploadedAt: string
}

export type TaskComment = {
  id: string
  taskId: string
  userId: string
  content: string
  parentId: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type TaskLabel = {
  id: string
  taskId: string
  name: string
  color: string
}

export type TaskParentSummary = {
  id: string
  parentId: string | null
  taskNumber: number
  title: string
}

export type TaskChildSummary = {
  id: string
  taskNumber: number
  title: string
  status: TaskStatus
  type: TaskType
  priority: TaskPriority
  assigneeId: string | null
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

export type SubtasksSummary = {
  total: number
  done: number
  completionPercent: number
}

export interface TaskDetailResponse {
  data: TaskListItem & {
    activities: TaskActivity[]
    parent?: TaskParentSummary | null
    children: TaskChildSummary[]
    subtasks: SubtasksSummary
    relations: TaskRelationOutgoing[]
    relatedTo: TaskRelationIncoming[]
    isBlocked?: boolean
    labels: TaskLabel[]
    attachments: TaskAttachment[]
    comments: TaskComment[]
  }
}

export type ListTasksQuery = {
  projectId?: string
  phaseId?: string
  status?: TaskStatus
  type?: TaskType
  priority?: TaskPriority
  assignmentType?: AssignmentType
  assigneeId?: string
  parentId?: string
  label?: string
  search?: string
  page?: number
  limit?: number
}

export type UpdateTaskInput = Partial<{
  title: string
  description: string | null
  type: TaskType
  status: TaskStatus
  priority: TaskPriority
  assigneeId: string | null
  assignmentType: AssignmentType
  agentId: string | null
  dueDate: string | null
  storyPoints: number | null
  phaseId: string | null
}>

export type CreateTaskInput = {
  projectId: string
  phaseId: string
  title: string
  description?: string
  status?: TaskStatus
  type?: TaskType
  priority?: TaskPriority
  assignmentType?: AssignmentType
  assigneeId?: string | null
  agentId?: string | null
  storyPoints?: number | null
  dueDate?: string | null
  parentId?: string | null
}

export type CreateTaskRelationInput = {
  targetTaskId: string
  relationType: TaskRelationType
}

export type CreateTaskCommentInput = {
  content: string
  parentId?: string | null
}

export type UpdateTaskCommentInput = {
  content: string
}

export type CreateTaskAttachmentInput = {
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
}

export type UpsertTaskLabelInput = {
  name: string
  color?: string
}

async function fetchTasks(params: {
  workspaceId: string
  token?: string
  query: ListTasksQuery
}): Promise<TasksListResponse> {
  const base = getBaseUrl()

  const search = new URLSearchParams()
  search.set('workspaceId', params.workspaceId)

  const query = params.query
  if (query.projectId) search.set('projectId', query.projectId)
  if (query.phaseId) search.set('phaseId', query.phaseId)
  if (query.status) search.set('status', query.status)
  if (query.type) search.set('type', query.type)
  if (query.priority) search.set('priority', query.priority)
  if (query.assignmentType) search.set('assignmentType', query.assignmentType)
  if (query.assigneeId) search.set('assigneeId', query.assigneeId)
  if (query.parentId) search.set('parentId', query.parentId)
  if (query.search) search.set('search', query.search)
  if (query.label) search.set('label', query.label)
  if (query.page) search.set('page', String(query.page))
  if (query.limit) search.set('limit', String(query.limit))

  const response = await fetch(`${base}/pm/tasks?${search.toString()}`, {
    credentials: 'include',
    headers: params.token ? { Authorization: `Bearer ${params.token}` } : {},
    cache: 'no-store',
  })

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to fetch tasks')
  }

  if (!body || typeof body !== 'object' || !('data' in body) || !('meta' in body)) {
    throw new Error('Failed to fetch tasks')
  }

  return body as TasksListResponse
}

async function fetchTask(params: {
  workspaceId: string
  token?: string
  taskId: string
}): Promise<TaskDetailResponse> {
  const base = getBaseUrl()

  const search = new URLSearchParams()
  search.set('workspaceId', params.workspaceId)

  const response = await fetch(`${base}/pm/tasks/${encodeURIComponent(params.taskId)}?${search.toString()}`, {
    credentials: 'include',
    headers: params.token ? { Authorization: `Bearer ${params.token}` } : {},
    cache: 'no-store',
  })

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to fetch task')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('Failed to fetch task')
  }

  return body as TaskDetailResponse
}

async function createTaskComment(params: {
  workspaceId: string
  token?: string
  taskId: string
  input: CreateTaskCommentInput
}): Promise<TaskDetailResponse> {
  const base = getBaseUrl()

  const search = new URLSearchParams()
  search.set('workspaceId', params.workspaceId)

  const response = await fetch(`${base}/pm/tasks/${encodeURIComponent(params.taskId)}/comments?${search.toString()}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(params.token ? { Authorization: `Bearer ${params.token}` } : {}),
    },
    body: JSON.stringify(params.input),
    cache: 'no-store',
  })

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to create comment')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('Failed to create comment')
  }

  return body as TaskDetailResponse
}

async function updateTaskComment(params: {
  workspaceId: string
  token?: string
  taskId: string
  commentId: string
  input: UpdateTaskCommentInput
}): Promise<TaskDetailResponse> {
  const base = getBaseUrl()

  const search = new URLSearchParams()
  search.set('workspaceId', params.workspaceId)

  const response = await fetch(
    `${base}/pm/tasks/${encodeURIComponent(params.taskId)}/comments/${encodeURIComponent(params.commentId)}?${search.toString()}`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(params.token ? { Authorization: `Bearer ${params.token}` } : {}),
      },
      body: JSON.stringify(params.input),
      cache: 'no-store',
    },
  )

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to update comment')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('Failed to update comment')
  }

  return body as TaskDetailResponse
}

async function deleteTaskComment(params: {
  workspaceId: string
  token?: string
  taskId: string
  commentId: string
}): Promise<TaskDetailResponse> {
  const base = getBaseUrl()

  const search = new URLSearchParams()
  search.set('workspaceId', params.workspaceId)

  const response = await fetch(
    `${base}/pm/tasks/${encodeURIComponent(params.taskId)}/comments/${encodeURIComponent(params.commentId)}?${search.toString()}`,
    {
      method: 'DELETE',
      credentials: 'include',
      headers: params.token ? { Authorization: `Bearer ${params.token}` } : {},
      cache: 'no-store',
    },
  )

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to delete comment')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('Failed to delete comment')
  }

  return body as TaskDetailResponse
}

async function createTaskAttachment(params: {
  workspaceId: string
  token?: string
  taskId: string
  input: CreateTaskAttachmentInput
}): Promise<TaskDetailResponse> {
  const base = getBaseUrl()

  const search = new URLSearchParams()
  search.set('workspaceId', params.workspaceId)

  const response = await fetch(
    `${base}/pm/tasks/${encodeURIComponent(params.taskId)}/attachments?${search.toString()}`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(params.token ? { Authorization: `Bearer ${params.token}` } : {}),
      },
      body: JSON.stringify(params.input),
      cache: 'no-store',
    },
  )

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to attach file')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('Failed to attach file')
  }

  return body as TaskDetailResponse
}

async function deleteTaskAttachment(params: {
  workspaceId: string
  token?: string
  taskId: string
  attachmentId: string
}): Promise<TaskDetailResponse> {
  const base = getBaseUrl()

  const search = new URLSearchParams()
  search.set('workspaceId', params.workspaceId)

  const response = await fetch(
    `${base}/pm/tasks/${encodeURIComponent(params.taskId)}/attachments/${encodeURIComponent(params.attachmentId)}?${search.toString()}`,
    {
      method: 'DELETE',
      credentials: 'include',
      headers: params.token ? { Authorization: `Bearer ${params.token}` } : {},
      cache: 'no-store',
    },
  )

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to remove attachment')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('Failed to remove attachment')
  }

  return body as TaskDetailResponse
}

async function upsertTaskLabel(params: {
  workspaceId: string
  token?: string
  taskId: string
  input: UpsertTaskLabelInput
}): Promise<TaskDetailResponse> {
  const base = getBaseUrl()

  const search = new URLSearchParams()
  search.set('workspaceId', params.workspaceId)

  const response = await fetch(`${base}/pm/tasks/${encodeURIComponent(params.taskId)}/labels?${search.toString()}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(params.token ? { Authorization: `Bearer ${params.token}` } : {}),
    },
    body: JSON.stringify(params.input),
    cache: 'no-store',
  })

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to add label')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('Failed to add label')
  }

  return body as TaskDetailResponse
}

async function deleteTaskLabel(params: {
  workspaceId: string
  token?: string
  taskId: string
  labelId: string
}): Promise<TaskDetailResponse> {
  const base = getBaseUrl()

  const search = new URLSearchParams()
  search.set('workspaceId', params.workspaceId)

  const response = await fetch(
    `${base}/pm/tasks/${encodeURIComponent(params.taskId)}/labels/${encodeURIComponent(params.labelId)}?${search.toString()}`,
    {
      method: 'DELETE',
      credentials: 'include',
      headers: params.token ? { Authorization: `Bearer ${params.token}` } : {},
      cache: 'no-store',
    },
  )

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to remove label')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('Failed to remove label')
  }

  return body as TaskDetailResponse
}

async function createTaskRelation(params: {
  workspaceId: string
  token?: string
  taskId: string
  input: CreateTaskRelationInput
}): Promise<TaskDetailResponse> {
  const base = getBaseUrl()

  const search = new URLSearchParams()
  search.set('workspaceId', params.workspaceId)

  const response = await fetch(
    `${base}/pm/tasks/${encodeURIComponent(params.taskId)}/relations?${search.toString()}`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(params.token ? { Authorization: `Bearer ${params.token}` } : {}),
      },
      body: JSON.stringify(params.input),
      cache: 'no-store',
    },
  )

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to create relation')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('Failed to create relation')
  }

  return body as TaskDetailResponse
}

async function deleteTaskRelation(params: {
  workspaceId: string
  token?: string
  taskId: string
  relationId: string
}): Promise<TaskDetailResponse> {
  const base = getBaseUrl()

  const search = new URLSearchParams()
  search.set('workspaceId', params.workspaceId)

  const response = await fetch(
    `${base}/pm/tasks/${encodeURIComponent(params.taskId)}/relations/${encodeURIComponent(params.relationId)}?${search.toString()}`,
    {
      method: 'DELETE',
      credentials: 'include',
      headers: params.token ? { Authorization: `Bearer ${params.token}` } : {},
      cache: 'no-store',
    },
  )

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to delete relation')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('Failed to delete relation')
  }

  return body as TaskDetailResponse
}

async function updateTask(params: {
  workspaceId: string
  token?: string
  taskId: string
  input: UpdateTaskInput
}): Promise<TaskDetailResponse> {
  const base = getBaseUrl()

  const search = new URLSearchParams()
  search.set('workspaceId', params.workspaceId)

  const response = await fetch(`${base}/pm/tasks/${encodeURIComponent(params.taskId)}?${search.toString()}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(params.token ? { Authorization: `Bearer ${params.token}` } : {}),
    },
    body: JSON.stringify(params.input),
    cache: 'no-store',
  })

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to update task')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('Failed to update task')
  }

  return body as TaskDetailResponse
}

async function createTask(params: {
  workspaceId: string
  token?: string
  input: CreateTaskInput
}): Promise<{ data: TaskListItem }> {
  const base = getBaseUrl()

  const search = new URLSearchParams()
  search.set('workspaceId', params.workspaceId)

  const response = await fetch(`${base}/pm/tasks?${search.toString()}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(params.token ? { Authorization: `Bearer ${params.token}` } : {}),
    },
    body: JSON.stringify(params.input),
    cache: 'no-store',
  })

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to create task')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('Failed to create task')
  }

  return body as { data: TaskListItem }
}

export function usePmTasks(query: ListTasksQuery) {
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  const hasScope =
    !!query.projectId ||
    !!query.phaseId ||
    !!query.status ||
    !!query.type ||
    !!query.priority ||
    !!query.assignmentType ||
    !!query.assigneeId ||
    !!query.parentId ||
    !!query.label ||
    !!query.search

  return useQuery({
    queryKey: [
      'pm-tasks',
      workspaceId,
      query.projectId ?? null,
      query.phaseId ?? null,
      query.status ?? null,
      query.type ?? null,
      query.priority ?? null,
      query.assignmentType ?? null,
      query.assigneeId ?? null,
      query.parentId ?? null,
      query.label ?? null,
      query.search ?? null,
      query.page ?? null,
      query.limit ?? null,
    ],
    queryFn: () => fetchTasks({ workspaceId: workspaceId!, token, query }),
    enabled: !!workspaceId && hasScope,
    staleTime: 15000,
    refetchOnWindowFocus: true,
  })
}

export function usePmTask(taskId: string | null) {
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useQuery({
    queryKey: ['pm-task', workspaceId, taskId],
    queryFn: () => fetchTask({ workspaceId: workspaceId!, token, taskId: taskId! }),
    enabled: !!workspaceId && !!taskId,
    staleTime: 5000,
    refetchOnWindowFocus: true,
  })
}

export function useUpdatePmTask() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return updateTask({ workspaceId, token, taskId, input })
    },
    onSuccess: (result) => {
      toast.success('Saved')
      queryClient.invalidateQueries({ queryKey: ['pm-task', workspaceId, result.data.id] })
      queryClient.invalidateQueries({ queryKey: ['pm-tasks', workspaceId] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update task'
      toast.error(message)
    },
  })
}

export function useCreatePmTask() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: ({ input }: { input: CreateTaskInput }) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return createTask({ workspaceId, token, input })
    },
    onSuccess: (result) => {
      toast.success('Created')
      queryClient.invalidateQueries({ queryKey: ['pm-tasks', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['pm-task', workspaceId, result.data.id] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to create task'
      toast.error(message)
    },
  })
}

export function useCreatePmTaskRelation() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: CreateTaskRelationInput }) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return createTaskRelation({ workspaceId, token, taskId, input })
    },
    onSuccess: (result) => {
      toast.success('Relation added')
      queryClient.invalidateQueries({ queryKey: ['pm-task', workspaceId, result.data.id] })
      queryClient.invalidateQueries({ queryKey: ['pm-tasks', workspaceId] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to create relation'
      toast.error(message)
    },
  })
}

export function useDeletePmTaskRelation() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: ({ taskId, relationId }: { taskId: string; relationId: string }) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return deleteTaskRelation({ workspaceId, token, taskId, relationId })
    },
    onSuccess: (result) => {
      toast.success('Relation removed')
      queryClient.invalidateQueries({ queryKey: ['pm-task', workspaceId, result.data.id] })
      queryClient.invalidateQueries({ queryKey: ['pm-tasks', workspaceId] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to delete relation'
      toast.error(message)
    },
  })
}

export function useCreatePmTaskComment() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: CreateTaskCommentInput }) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return createTaskComment({ workspaceId, token, taskId, input })
    },
    onSuccess: (result) => {
      toast.success('Comment added')
      queryClient.invalidateQueries({ queryKey: ['pm-task', workspaceId, result.data.id] })
      queryClient.invalidateQueries({ queryKey: ['pm-tasks', workspaceId] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to create comment'
      toast.error(message)
    },
  })
}

export function useUpdatePmTaskComment() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: ({ taskId, commentId, input }: { taskId: string; commentId: string; input: UpdateTaskCommentInput }) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return updateTaskComment({ workspaceId, token, taskId, commentId, input })
    },
    onSuccess: (result) => {
      toast.success('Comment updated')
      queryClient.invalidateQueries({ queryKey: ['pm-task', workspaceId, result.data.id] })
      queryClient.invalidateQueries({ queryKey: ['pm-tasks', workspaceId] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update comment'
      toast.error(message)
    },
  })
}

export function useDeletePmTaskComment() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: ({ taskId, commentId }: { taskId: string; commentId: string }) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return deleteTaskComment({ workspaceId, token, taskId, commentId })
    },
    onSuccess: (result) => {
      toast.success('Comment deleted')
      queryClient.invalidateQueries({ queryKey: ['pm-task', workspaceId, result.data.id] })
      queryClient.invalidateQueries({ queryKey: ['pm-tasks', workspaceId] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to delete comment'
      toast.error(message)
    },
  })
}

export function useCreatePmTaskAttachment() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: CreateTaskAttachmentInput }) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return createTaskAttachment({ workspaceId, token, taskId, input })
    },
    onSuccess: (result) => {
      toast.success('Attached')
      queryClient.invalidateQueries({ queryKey: ['pm-task', workspaceId, result.data.id] })
      queryClient.invalidateQueries({ queryKey: ['pm-tasks', workspaceId] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to attach file'
      toast.error(message)
    },
  })
}

export function useDeletePmTaskAttachment() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: ({ taskId, attachmentId }: { taskId: string; attachmentId: string }) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return deleteTaskAttachment({ workspaceId, token, taskId, attachmentId })
    },
    onSuccess: (result) => {
      toast.success('Removed')
      queryClient.invalidateQueries({ queryKey: ['pm-task', workspaceId, result.data.id] })
      queryClient.invalidateQueries({ queryKey: ['pm-tasks', workspaceId] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to remove attachment'
      toast.error(message)
    },
  })
}

export function useUpsertPmTaskLabel() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpsertTaskLabelInput }) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return upsertTaskLabel({ workspaceId, token, taskId, input })
    },
    onSuccess: (result) => {
      toast.success('Label saved')
      queryClient.invalidateQueries({ queryKey: ['pm-task', workspaceId, result.data.id] })
      queryClient.invalidateQueries({ queryKey: ['pm-tasks', workspaceId] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to add label'
      toast.error(message)
    },
  })
}

export function useDeletePmTaskLabel() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: ({ taskId, labelId }: { taskId: string; labelId: string }) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return deleteTaskLabel({ workspaceId, token, taskId, labelId })
    },
    onSuccess: (result) => {
      toast.success('Label removed')
      queryClient.invalidateQueries({ queryKey: ['pm-task', workspaceId, result.data.id] })
      queryClient.invalidateQueries({ queryKey: ['pm-tasks', workspaceId] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to remove label'
      toast.error(message)
    },
  })
}
