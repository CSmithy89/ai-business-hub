/**
 * CCR Routing Hook
 *
 * Manages CCR (Claude Code Router) routing configuration state.
 * Provides CRUD operations for routing rules and fallback chains.
 *
 * @module hooks
 * @story DM-01.6
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Routing mode determines how requests are distributed
 */
export type RoutingMode = 'auto' | 'cost-optimized' | 'performance' | 'manual';

/**
 * Provider status for routing decisions
 */
export type ProviderStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

/**
 * Individual provider in the routing chain
 */
export interface RoutingProvider {
  id: string;
  name: string;
  provider: string;
  model: string;
  priority: number;
  enabled: boolean;
  status?: ProviderStatus;
}

/**
 * Per-agent routing override
 */
export interface AgentRoutingOverride {
  agentId: string;
  agentName: string;
  preferredProviderId: string | null;
  fallbackEnabled: boolean;
}

/**
 * Complete CCR routing configuration
 */
export interface CCRRoutingConfig {
  mode: RoutingMode;
  autoFailover: boolean;
  fallbackChain: RoutingProvider[];
  agentOverrides: AgentRoutingOverride[];
  updatedAt: string;
}

/**
 * Input for updating routing configuration
 */
export interface UpdateRoutingConfigInput {
  mode?: RoutingMode;
  autoFailover?: boolean;
  fallbackChain?: RoutingProvider[];
}

/**
 * Input for updating agent override
 */
export interface UpdateAgentOverrideInput {
  agentId: string;
  preferredProviderId: string | null;
  fallbackEnabled: boolean;
}

// Query keys
const ROUTING_CONFIG_KEY = ['ccr-routing-config'];
const AVAILABLE_PROVIDERS_KEY = ['ccr-available-providers'];

/**
 * Mock fetch for routing config (will be replaced with real API)
 */
async function fetchRoutingConfig(): Promise<CCRRoutingConfig> {
  // TODO: Replace with actual API call when DM-02 backend is ready
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    mode: 'auto',
    autoFailover: true,
    fallbackChain: [
      {
        id: 'claude-primary',
        name: 'Claude (Primary)',
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        priority: 1,
        enabled: true,
        status: 'healthy',
      },
      {
        id: 'openai-fallback',
        name: 'OpenAI (Fallback)',
        provider: 'openai',
        model: 'gpt-4o',
        priority: 2,
        enabled: true,
        status: 'healthy',
      },
      {
        id: 'deepseek-budget',
        name: 'DeepSeek (Budget)',
        provider: 'deepseek',
        model: 'deepseek-chat',
        priority: 3,
        enabled: false,
        status: 'unknown',
      },
    ],
    agentOverrides: [
      {
        agentId: 'navi',
        agentName: 'Navi (Navigator)',
        preferredProviderId: null,
        fallbackEnabled: true,
      },
      {
        agentId: 'sage',
        agentName: 'Sage (Strategist)',
        preferredProviderId: null,
        fallbackEnabled: true,
      },
      {
        agentId: 'chrono',
        agentName: 'Chrono (Timeline)',
        preferredProviderId: null,
        fallbackEnabled: true,
      },
    ],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Mock fetch for available providers
 */
async function fetchAvailableProviders(): Promise<RoutingProvider[]> {
  // TODO: Replace with actual API call
  await new Promise((resolve) => setTimeout(resolve, 300));

  return [
    {
      id: 'claude-primary',
      name: 'Claude (Primary)',
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      priority: 1,
      enabled: true,
      status: 'healthy',
    },
    {
      id: 'openai-fallback',
      name: 'OpenAI (Fallback)',
      provider: 'openai',
      model: 'gpt-4o',
      priority: 2,
      enabled: true,
      status: 'healthy',
    },
    {
      id: 'deepseek-budget',
      name: 'DeepSeek (Budget)',
      provider: 'deepseek',
      model: 'deepseek-chat',
      priority: 3,
      enabled: false,
      status: 'unknown',
    },
    {
      id: 'gemini-alt',
      name: 'Gemini (Alternative)',
      provider: 'google',
      model: 'gemini-pro',
      priority: 4,
      enabled: false,
      status: 'unknown',
    },
  ];
}

/**
 * Mock update for routing config
 */
async function updateRoutingConfig(
  input: UpdateRoutingConfigInput
): Promise<CCRRoutingConfig> {
  // TODO: Replace with actual API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  const current = await fetchRoutingConfig();
  return {
    ...current,
    ...input,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Mock update for agent override
 */
async function updateAgentOverride(
  input: UpdateAgentOverrideInput
): Promise<AgentRoutingOverride> {
  // TODO: Replace with actual API call
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    agentId: input.agentId,
    agentName: `Agent ${input.agentId}`,
    preferredProviderId: input.preferredProviderId,
    fallbackEnabled: input.fallbackEnabled,
  };
}

/**
 * Hook for fetching CCR routing configuration
 */
export function useCCRRoutingConfig() {
  return useQuery({
    queryKey: ROUTING_CONFIG_KEY,
    queryFn: fetchRoutingConfig,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook for fetching available providers
 */
export function useAvailableRoutingProviders() {
  return useQuery({
    queryKey: AVAILABLE_PROVIDERS_KEY,
    queryFn: fetchAvailableProviders,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook for updating routing configuration
 */
export function useUpdateRoutingConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRoutingConfig,
    onSuccess: (data) => {
      queryClient.setQueryData(ROUTING_CONFIG_KEY, data);
    },
  });
}

/**
 * Hook for updating agent routing override
 */
export function useUpdateAgentOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAgentOverride,
    onSuccess: (data) => {
      queryClient.setQueryData(ROUTING_CONFIG_KEY, (old: CCRRoutingConfig | undefined) => {
        if (!old) return old;
        return {
          ...old,
          agentOverrides: old.agentOverrides.map((override) =>
            override.agentId === data.agentId ? data : override
          ),
          updatedAt: new Date().toISOString(),
        };
      });
    },
  });
}

/**
 * Get human-readable routing mode label
 */
export function getRoutingModeLabel(mode: RoutingMode): string {
  const labels: Record<RoutingMode, string> = {
    auto: 'Automatic',
    'cost-optimized': 'Cost Optimized',
    performance: 'Performance',
    manual: 'Manual',
  };
  return labels[mode];
}

/**
 * Get routing mode description
 */
export function getRoutingModeDescription(mode: RoutingMode): string {
  const descriptions: Record<RoutingMode, string> = {
    auto: 'Automatically select the best provider based on availability and task requirements',
    'cost-optimized': 'Prefer lower-cost providers while maintaining quality thresholds',
    performance: 'Prefer faster, more capable models regardless of cost',
    manual: 'Manually specify provider for each request',
  };
  return descriptions[mode];
}
