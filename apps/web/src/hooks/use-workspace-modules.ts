'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'
import { apiGet, apiPatch } from '@/lib/api-client'

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
  const body = await response.json()

  if (!response.ok) {
    throw new Error(body.message || body.error || 'Failed to fetch modules')
  }

  return (body as ModulesListResponse).data
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

  const body = await response.json()
  if (!response.ok) {
    throw new Error(body.message || body.error || 'Failed to update module')
  }

  return (body as ModuleResponse).data
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

