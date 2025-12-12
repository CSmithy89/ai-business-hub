'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'
import { NESTJS_API_URL } from '@/lib/api-config'

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

async function fetchProviders(workspaceId: string): Promise<ProvidersListResponse> {
  const base = getBaseUrl();
  const response = await fetch(
    `${base}/api/workspaces/${encodeURIComponent(workspaceId)}/ai-providers`,
    {
      credentials: 'include',
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch providers' }))
    throw new Error(error.message || 'Failed to fetch providers')
  }

  return response.json()
}

/**
 * Create a new provider
 */
async function createProvider(
  workspaceId: string,
  data: CreateProviderRequest
): Promise<ProviderResponse> {
  const base = getBaseUrl();
  const response = await fetch(
    `${base}/api/workspaces/${encodeURIComponent(workspaceId)}/ai-providers`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create provider' }))
    throw new Error(error.message || 'Failed to create provider')
  }

  return response.json()
}

/**
 * Update a provider
 */
async function updateProvider(
  workspaceId: string,
  providerId: string,
  data: UpdateProviderRequest
): Promise<ProviderResponse> {
  const base = getBaseUrl();
  const response = await fetch(
    `${base}/api/workspaces/${encodeURIComponent(
      workspaceId
    )}/ai-providers/${encodeURIComponent(providerId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update provider' }))
    throw new Error(error.message || 'Failed to update provider')
  }

  return response.json()
}

/**
 * Delete a provider
 */
async function deleteProvider(workspaceId: string, providerId: string): Promise<void> {
  const base = getBaseUrl();
  const response = await fetch(
    `${base}/api/workspaces/${encodeURIComponent(
      workspaceId
    )}/ai-providers/${encodeURIComponent(providerId)}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete provider' }))
    throw new Error(error.message || 'Failed to delete provider')
  }
}

/**
 * Test a provider's API key
 */
async function testProvider(
  workspaceId: string,
  providerId: string
): Promise<TestProviderResponse> {
  const base = getBaseUrl();
  const response = await fetch(
    `${base}/api/workspaces/${encodeURIComponent(
      workspaceId
    )}/ai-providers/${encodeURIComponent(providerId)}/test`,
    {
      method: 'POST',
      credentials: 'include',
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to test provider' }))
    throw new Error(error.message || 'Failed to test provider')
  }

  return response.json()
}

/**
 * Hook to fetch all AI providers for the current workspace
 */
export function useAIProviders() {
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId

  return useQuery({
    queryKey: ['ai-providers', workspaceId],
    queryFn: () => fetchProviders(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true,
  })
}

/**
 * Hook to get mutation functions for AI provider operations
 */
export function useAIProviderMutations() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId

  const createMutation = useMutation({
    mutationFn: (data: CreateProviderRequest) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return createProvider(workspaceId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers', workspaceId] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ providerId, data }: { providerId: string; data: UpdateProviderRequest }) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return updateProvider(workspaceId, providerId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers', workspaceId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (providerId: string) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return deleteProvider(workspaceId, providerId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers', workspaceId] })
    },
  })

  const testMutation = useMutation({
    mutationFn: (providerId: string) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return testProvider(workspaceId, providerId)
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
