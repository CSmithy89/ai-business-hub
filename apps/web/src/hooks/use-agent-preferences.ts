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
import { NESTJS_API_URL } from '@/lib/api-config';

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

/**
 * Get workspace ID from session
 */
function useWorkspaceId(): string | undefined {
  const { data: session } = useSession();
  return (session?.session as { activeWorkspaceId?: string } | undefined)
    ?.activeWorkspaceId;
}

function getAccessToken(session: unknown): string | undefined {
  const direct = (session as { accessToken?: string })?.accessToken;
  const nested = (session as { session?: { accessToken?: string } })?.session?.accessToken;
  return direct || nested || undefined;
}

function getApiBase(): string {
  if (NESTJS_API_URL) {
    return NESTJS_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  throw new Error('NESTJS_API_URL is not configured');
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
      const base = getApiBase();

      const token = getAccessToken(session);
      const response = await fetch(
        new URL(
          `/workspaces/${encodeURIComponent(workspaceId)}/ai-providers/agents/preferences`,
          base
        ).toString(),
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
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
      const base = getApiBase();

      const token = getAccessToken(session);
      const response = await fetch(
        new URL(
          `/workspaces/${encodeURIComponent(workspaceId)}/ai-providers/agents/models`,
          base
        ).toString(),
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
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
      const base = getApiBase();

      const token = getAccessToken(session);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        new URL(
          `/workspaces/${encodeURIComponent(
            workspaceId
          )}/ai-providers/agents/${encodeURIComponent(agentId)}/preference`,
          base
        ).toString(),
        {
          method: 'PATCH',
          headers,
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
      const base = getApiBase();

      const token = getAccessToken(session);
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        new URL(
          `/workspaces/${encodeURIComponent(
            workspaceId
          )}/ai-providers/agents/${encodeURIComponent(agentId)}/preference`,
          base
        ).toString(),
        {
          method: 'DELETE',
          headers,
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
