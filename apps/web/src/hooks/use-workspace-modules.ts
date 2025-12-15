'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'
import { apiGet, apiPatch } from '@/lib/api-client'
import { safeJson } from '@/lib/utils/safe-json'

export type WorkspaceModuleCategoryId = 'onboarding' | 'operations' | 'growth' | 'intelligence'

export interface WorkspaceModuleCategory {
  id: WorkspaceModuleCategoryId
  name: string
}

export interface WorkspaceModule {
  id: string
  name: string
  description: string
  category: WorkspaceModuleCategoryId
  isCore: boolean
  enabled: boolean
  config: Record<string, unknown>
  enabledAt: string | null
  disabledAt?: string | null
}

interface ModulesListResponse {
  success: true
  data: {
    modules: WorkspaceModule[]
    categories: WorkspaceModuleCategory[]
  }
}

interface ModuleResponse {
  success: true
  data: WorkspaceModule
}

function getActiveWorkspaceId(session: unknown): string | null {
  const activeWorkspaceId = (session as { session?: { activeWorkspaceId?: string } } | null)?.session
    ?.activeWorkspaceId
  return activeWorkspaceId ?? null
}

async function fetchWorkspaceModules(workspaceId: string): Promise<ModulesListResponse['data']> {
  const response = await apiGet(`/api/workspaces/${encodeURIComponent(workspaceId)}/modules`)
  const body = await safeJson<Record<string, unknown>>(response)

  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    const error =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : undefined
    throw new Error(message || error || 'Failed to fetch modules')
  }

  const data = (body as ModulesListResponse | null)?.data
  if (!data || !Array.isArray(data.modules) || !Array.isArray(data.categories)) {
    throw new Error('Invalid modules response')
  }
  return data
}

async function updateWorkspaceModule(
  workspaceId: string,
  moduleId: string,
  payload: { enabled?: boolean; config?: Record<string, unknown> }
): Promise<WorkspaceModule> {
  const response = await apiPatch(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/modules/${encodeURIComponent(moduleId)}`,
    payload
  )

  const body = await safeJson<Record<string, unknown>>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    const error =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : undefined
    throw new Error(message || error || 'Failed to update module')
  }

  const data = (body as ModuleResponse | null)?.data
  if (!data || typeof data !== 'object' || typeof data.id !== 'string') {
    throw new Error('Invalid module response')
  }
  return data
}

export function useWorkspaceModules() {
  const { data: session } = useSession()
  const workspaceId = getActiveWorkspaceId(session) // nullable

  return useQuery({
    queryKey: ['workspace-modules', workspaceId],
    queryFn: () => fetchWorkspaceModules(workspaceId!),
    enabled: !!workspaceId,
  })
}

export function useWorkspaceModuleMutations() {
  const { data: session } = useSession()
  const workspaceId = getActiveWorkspaceId(session)
  const queryClient = useQueryClient()

  const updateModule = useMutation({
    mutationFn: async (input: { moduleId: string; enabled?: boolean; config?: Record<string, unknown> }) => {
      if (!workspaceId) throw new Error('No active workspace')
      return updateWorkspaceModule(workspaceId, input.moduleId, {
        enabled: input.enabled,
        config: input.config,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workspace-modules', workspaceId] })
    },
  })

  return {
    updateModule,
  }
}
