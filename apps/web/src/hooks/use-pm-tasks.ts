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
  if (query.search) search.set('search', query.search)
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

  return useQuery({
    queryKey: ['pm-tasks', workspaceId, query],
    queryFn: () => fetchTasks({ workspaceId: workspaceId!, token, query }),
    enabled: !!workspaceId && !!query.projectId,
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
