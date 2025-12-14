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
import { safeJson } from '@/lib/utils/safe-json';

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
  const sessionTokenDirect = (session as { token?: string })?.token;
  const sessionTokenNested = (session as { session?: { token?: string } })?.session?.token;
  const direct = (session as { accessToken?: string })?.accessToken;
  const nested = (session as { session?: { accessToken?: string } })?.session?.accessToken;
  return direct || nested || sessionTokenDirect || sessionTokenNested || undefined;
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

      const body = await safeJson<{ data: AgentPreference[] }>(response);
      if (!response.ok) {
        throw new Error('Failed to fetch agent preferences');
      }

      if (!body?.data) throw new Error('Failed to fetch agent preferences');
      return body.data;
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

      const body = await safeJson<{ data: AvailableModel[] }>(response);
      if (!response.ok) {
        throw new Error('Failed to fetch available models');
      }

      if (!body?.data) throw new Error('Failed to fetch available models');
      return body.data;
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

      const body = await safeJson<Record<string, unknown>>(response);
      if (!response.ok) {
        throw new Error('Failed to update preference');
      }

      if (!body) throw new Error('Failed to update preference');
      return body;
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

      const body = await safeJson<Record<string, unknown>>(response);
      if (!response.ok) {
        throw new Error('Failed to reset preference');
      }

      if (!body) throw new Error('Failed to reset preference');
      return body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['agent-preferences', workspaceId],
      });
    },
  });
}
