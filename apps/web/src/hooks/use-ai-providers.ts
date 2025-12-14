'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'
import { NESTJS_API_URL } from '@/lib/api-config'
import { toast } from 'sonner'
import { safeJson } from '@/lib/utils/safe-json'

/**
 * AI Provider types
 */
export type AIProviderType = 'claude' | 'openai' | 'gemini' | 'deepseek' | 'openrouter'

/**
 * Provider response from API (excludes encrypted key)
 */
export interface AIProvider {
  id: string
  provider: AIProviderType
  defaultModel: string
  isValid: boolean
  lastValidatedAt: string | null
  validationError: string | null
  maxTokensPerDay: number
  tokensUsedToday: number
  createdAt: string
  updatedAt: string
}

/**
 * Response type for list providers endpoint
 */
export interface ProvidersListResponse {
  data: AIProvider[]
}

/**
 * Response type for single provider endpoint
 */
export interface ProviderResponse {
  data: AIProvider
}

/**
 * Response type for test provider endpoint
 */
export interface TestProviderResponse {
  valid: boolean
  error?: string
  latency: number
  model: string
}

/**
 * Request body for creating a provider
 */
export interface CreateProviderRequest {
  provider: AIProviderType
  apiKey: string
  defaultModel: string
  maxTokensPerDay?: number
}

/**
 * Request body for updating a provider
 */
export interface UpdateProviderRequest {
  apiKey?: string
  defaultModel?: string
  maxTokensPerDay?: number
}

/**
 * Provider display info with emoji icons
 */
export const PROVIDER_INFO: Record<AIProviderType, {
  name: string
  description: string
  models: string[]
  icon: string
  color: string
}> = {
  claude: {
    name: 'Claude (Anthropic)',
    description: 'Advanced AI from Anthropic - Recommended for strategy and content',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    icon: '🧠',
    color: '#D97706', // Amber for Claude/Anthropic
  },
  openai: {
    name: 'OpenAI',
    description: 'GPT models from OpenAI - General-purpose AI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1', 'o1-mini'],
    icon: '🤖',
    color: '#10A37F', // OpenAI green
  },
  gemini: {
    name: 'Google Gemini',
    description: 'AI from Google DeepMind - Great for research',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
    icon: '💎',
    color: '#4285F4', // Google blue
  },
  deepseek: {
    name: 'DeepSeek',
    description: 'Cost-effective AI models - Budget-friendly option',
    models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
    icon: '🔮',
    color: '#7C3AED', // Purple
  },
  openrouter: {
    name: 'OpenRouter',
    description: 'Access 100+ models with one API key - Maximum flexibility',
    models: ['anthropic/claude-3-5-sonnet', 'openai/gpt-4o', 'google/gemini-pro', 'meta-llama/llama-3-70b'],
    icon: '🌐',
    color: '#06B6D4', // Cyan
  },
}

/**
 * Fetch all providers for the current workspace
 */
function getBaseUrl(): string {
  if (!NESTJS_API_URL) throw new Error('NESTJS_API_URL is not configured');
  return NESTJS_API_URL.replace(/\/$/, '');
}

function getSessionToken(session: unknown): string | undefined {
  const direct = (session as { token?: string } | null)?.token
  const nested = (session as { session?: { token?: string } } | null)?.session?.token
  return direct || nested || undefined
}

async function fetchProviders(
  base: string,
  workspaceId: string,
  token?: string
): Promise<ProvidersListResponse> {
  const response = await fetch(
    `${base}/workspaces/${encodeURIComponent(workspaceId)}/ai-providers`,
    {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  )

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to fetch providers')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) throw new Error('Failed to fetch providers')
  return body as ProvidersListResponse
}

/**
 * Create a new provider
 */
async function createProvider(
  base: string,
  workspaceId: string,
  data: CreateProviderRequest,
  token?: string
): Promise<ProviderResponse> {
  const response = await fetch(
    `${base}/workspaces/${encodeURIComponent(workspaceId)}/ai-providers`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    }
  )

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to create provider')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) throw new Error('Failed to create provider')
  return body as ProviderResponse
}

/**
 * Update a provider
 */
async function updateProvider(
  base: string,
  workspaceId: string,
  providerId: string,
  data: UpdateProviderRequest,
  token?: string
): Promise<ProviderResponse> {
  const response = await fetch(
    `${base}/workspaces/${encodeURIComponent(
      workspaceId
    )}/ai-providers/${encodeURIComponent(providerId)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    }
  )

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to update provider')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) throw new Error('Failed to update provider')
  return body as ProviderResponse
}

/**
 * Delete a provider
 */
async function deleteProvider(
  base: string,
  workspaceId: string,
  providerId: string,
  token?: string
): Promise<void> {
  const response = await fetch(
    `${base}/workspaces/${encodeURIComponent(
      workspaceId
    )}/ai-providers/${encodeURIComponent(providerId)}`,
    {
      method: 'DELETE',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  )

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to delete provider')
  }
}

/**
 * Test a provider's API key
 */
async function testProvider(
  base: string,
  workspaceId: string,
  providerId: string,
  token?: string
): Promise<TestProviderResponse> {
  const response = await fetch(
    `${base}/workspaces/${encodeURIComponent(
      workspaceId
    )}/ai-providers/${encodeURIComponent(providerId)}/test`,
    {
      method: 'POST',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  )

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to test provider')
  }

  if (!body || typeof body !== 'object') throw new Error('Failed to test provider')
  return body as TestProviderResponse
}

/**
 * Hook to fetch all AI providers for the current workspace
 */
export function useAIProviders() {
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)
  const base = getBaseUrl()

  return useQuery({
    queryKey: ['ai-providers', workspaceId],
    queryFn: () => fetchProviders(base, workspaceId!, token),
    enabled: !!workspaceId,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true,
  })
}

/**
 * Hook to get mutation functions for AI provider operations with optimistic updates
 *
 * Story 16.6: Implement Optimistic UI Updates
 * - Provider updates show immediately in UI
 * - Rollback on error with toast notification
 * - Create/Delete operations show instant feedback
 */
export function useAIProviderMutations() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)
  const base = getBaseUrl()

  // Optimistic create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateProviderRequest) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return createProvider(base, workspaceId, data, token)
    },

    onMutate: async (newProvider) => {
      await queryClient.cancelQueries({ queryKey: ['ai-providers', workspaceId] })
      const previousData = queryClient.getQueryData<ProvidersListResponse>(['ai-providers', workspaceId])

      if (previousData?.data) {
        const optimisticProvider: AIProvider = {
          id: `temp-${Date.now()}`,
          provider: newProvider.provider,
          defaultModel: newProvider.defaultModel,
          isValid: false,
          lastValidatedAt: null,
          validationError: null,
          maxTokensPerDay: newProvider.maxTokensPerDay || 100000,
          tokensUsedToday: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        queryClient.setQueryData<ProvidersListResponse>(['ai-providers', workspaceId], {
          ...previousData,
          data: [...previousData.data, optimisticProvider],
        })
      }

      return { previousData }
    },

    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['ai-providers', workspaceId], context.previousData)
      }
      toast.error('Failed to add provider')
    },

    onSuccess: () => {
      toast.success('Provider added successfully')
      queryClient.invalidateQueries({ queryKey: ['ai-providers', workspaceId] })
    },
  })

  // Optimistic update mutation
  const updateMutation = useMutation({
    mutationFn: ({ providerId, data }: { providerId: string; data: UpdateProviderRequest }) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return updateProvider(base, workspaceId, providerId, data, token)
    },

    onMutate: async ({ providerId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['ai-providers', workspaceId] })
      const previousData = queryClient.getQueryData<ProvidersListResponse>(['ai-providers', workspaceId])

      if (previousData?.data) {
        queryClient.setQueryData<ProvidersListResponse>(['ai-providers', workspaceId], {
          ...previousData,
          data: previousData.data.map((provider) =>
            provider.id === providerId
              ? { ...provider, ...data, updatedAt: new Date().toISOString() }
              : provider
          ),
        })
      }

      return { previousData }
    },

    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['ai-providers', workspaceId], context.previousData)
      }
      toast.error('Failed to update provider')
    },

    onSuccess: () => {
      toast.success('Provider updated')
      queryClient.invalidateQueries({ queryKey: ['ai-providers', workspaceId] })
    },
  })

  // Optimistic delete mutation
  const deleteMutation = useMutation({
    mutationFn: (providerId: string) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return deleteProvider(base, workspaceId, providerId, token)
    },

    onMutate: async (providerId) => {
      await queryClient.cancelQueries({ queryKey: ['ai-providers', workspaceId] })
      const previousData = queryClient.getQueryData<ProvidersListResponse>(['ai-providers', workspaceId])

      if (previousData?.data) {
        queryClient.setQueryData<ProvidersListResponse>(['ai-providers', workspaceId], {
          ...previousData,
          data: previousData.data.filter((provider) => provider.id !== providerId),
        })
      }

      return { previousData }
    },

    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['ai-providers', workspaceId], context.previousData)
      }
      toast.error('Failed to remove provider')
    },

    onSuccess: () => {
      toast.success('Provider removed')
      queryClient.invalidateQueries({ queryKey: ['ai-providers', workspaceId] })
    },
  })

  // Test mutation (no optimistic update needed - shows loading state)
  const testMutation = useMutation({
    mutationFn: (providerId: string) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return testProvider(base, workspaceId, providerId, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers', workspaceId] })
    },
  })

  return {
    createProvider: createMutation.mutate,
    createProviderAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    updateProvider: updateMutation.mutate,
    updateProviderAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    deleteProvider: deleteMutation.mutate,
    deleteProviderAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,

    testProvider: testMutation.mutate,
    testProviderAsync: testMutation.mutateAsync,
    isTesting: testMutation.isPending,
    testError: testMutation.error,
    testResult: testMutation.data,
  }
}
