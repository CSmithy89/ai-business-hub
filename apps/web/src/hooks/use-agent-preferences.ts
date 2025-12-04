/**
 * Agent Preferences Hook
 *
 * React Query hooks for managing agent model preferences.
 *
 * @module hooks
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/lib/auth-client';

/**
 * Agent definition
 */
export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'module';
  defaultProvider: string;
  defaultModel: string;
}

/**
 * Agent preference
 */
export interface AgentPreference {
  agent: AgentDefinition;
  currentProviderId: string | null;
  currentModel: string | null;
  isCustom: boolean;
}

/**
 * Available model for selection
 */
export interface AvailableModel {
  provider: string;
  providerId: string;
  model: string;
  costPer1MTokens: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Get workspace ID from session
 */
function useWorkspaceId(): string | undefined {
  const { data: session } = useSession();
  return (session?.session as { activeWorkspaceId?: string } | undefined)
    ?.activeWorkspaceId;
}

/**
 * Hook for fetching agent preferences
 */
export function useAgentPreferences() {
  const { data: session } = useSession();
  const workspaceId = useWorkspaceId();

  return useQuery<AgentPreference[]>({
    queryKey: ['agent-preferences', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const response = await fetch(
        `${API_BASE}/workspaces/${workspaceId}/ai-providers/agents/preferences`,
        {
          headers: {
            Authorization: `Bearer ${(session as { accessToken?: string })?.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch agent preferences');
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!workspaceId && !!session,
  });
}

/**
 * Hook for fetching available models
 */
export function useAvailableModels() {
  const { data: session } = useSession();
  const workspaceId = useWorkspaceId();

  return useQuery<AvailableModel[]>({
    queryKey: ['available-models', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const response = await fetch(
        `${API_BASE}/workspaces/${workspaceId}/ai-providers/agents/models`,
        {
          headers: {
            Authorization: `Bearer ${(session as { accessToken?: string })?.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch available models');
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!workspaceId && !!session,
  });
}

/**
 * Hook for updating agent preference
 */
export function useUpdateAgentPreference() {
  const { data: session } = useSession();
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agentId,
      providerId,
      model,
    }: {
      agentId: string;
      providerId: string;
      model: string;
    }) => {
      if (!workspaceId) throw new Error('No workspace');

      const response = await fetch(
        `${API_BASE}/workspaces/${workspaceId}/ai-providers/agents/${agentId}/preference`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(session as { accessToken?: string })?.accessToken}`,
          },
          body: JSON.stringify({ providerId, model }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update preference');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['agent-preferences', workspaceId],
      });
    },
  });
}

/**
 * Hook for resetting agent preference to default
 */
export function useResetAgentPreference() {
  const { data: session } = useSession();
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentId: string) => {
      if (!workspaceId) throw new Error('No workspace');

      const response = await fetch(
        `${API_BASE}/workspaces/${workspaceId}/ai-providers/agents/${agentId}/preference`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${(session as { accessToken?: string })?.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reset preference');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['agent-preferences', workspaceId],
      });
    },
  });
}
