/**
 * Suggestions Hook
 *
 * Story: PM-12.1 - Agent UI Components
 *
 * React Query hook for managing PM agent suggestions.
 * Handles fetching, accepting, rejecting, and snoozing suggestions.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSessionToken, useSession } from '@/lib/auth-client';
import { NESTJS_API_URL } from '@/lib/api-config';
import { safeJson } from '@/lib/utils/safe-json';
import type { Suggestion } from '@/components/pm/agents/SuggestionCard';

// ============================================================================
// Types
// ============================================================================

export type SuggestionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'SNOOZED' | 'EXPIRED';

interface SuggestionsQueryParams {
  status?: SuggestionStatus;
  type?: string;
  agentName?: string;
}

interface ActionResponse {
  success: boolean;
  suggestion: Suggestion;
}

// ============================================================================
// API Functions
// ============================================================================

function getBaseUrl(): string {
  if (!NESTJS_API_URL) throw new Error('NESTJS_API_URL is not configured');
  return NESTJS_API_URL.replace(/\/$/, '');
}

async function fetchSuggestions(params: {
  projectId: string;
  filters?: SuggestionsQueryParams;
  token?: string;
}): Promise<Suggestion[]> {
  const queryParams = new URLSearchParams();
  queryParams.append('projectId', params.projectId);

  if (params.filters?.status) {
    queryParams.append('status', params.filters.status);
  }
  if (params.filters?.type) {
    queryParams.append('type', params.filters.type);
  }
  if (params.filters?.agentName) {
    queryParams.append('agentName', params.filters.agentName);
  }

  const url = `${getBaseUrl()}/pm/agents/suggestions?${queryParams}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(params.token && { Authorization: `Bearer ${params.token}` }),
    },
  });

  if (!response.ok) {
    // Return empty array for 404 (no suggestions yet)
    if (response.status === 404) {
      return [];
    }
    const body = await safeJson<unknown>(response);
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : `Failed to fetch suggestions: ${response.statusText}`;
    throw new Error(message);
  }

  const data = await safeJson<Suggestion[] | { suggestions: Suggestion[] }>(response);
  if (!data) return [];

  return Array.isArray(data) ? data : data.suggestions || [];
}

async function acceptSuggestion(params: {
  suggestionId: string;
  token?: string;
}): Promise<ActionResponse> {
  const url = `${getBaseUrl()}/pm/agents/suggestions/${params.suggestionId}/accept`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(params.token && { Authorization: `Bearer ${params.token}` }),
    },
  });

  if (!response.ok) {
    const body = await safeJson<unknown>(response);
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : `Failed to accept suggestion: ${response.statusText}`;
    throw new Error(message);
  }

  return response.json();
}

async function rejectSuggestion(params: {
  suggestionId: string;
  reason?: string;
  token?: string;
}): Promise<ActionResponse> {
  const url = `${getBaseUrl()}/pm/agents/suggestions/${params.suggestionId}/reject`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(params.token && { Authorization: `Bearer ${params.token}` }),
    },
    body: JSON.stringify({ reason: params.reason }),
  });

  if (!response.ok) {
    const body = await safeJson<unknown>(response);
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : `Failed to reject suggestion: ${response.statusText}`;
    throw new Error(message);
  }

  return response.json();
}

async function snoozeSuggestion(params: {
  suggestionId: string;
  hours: number;
  token?: string;
}): Promise<ActionResponse> {
  const url = `${getBaseUrl()}/pm/agents/suggestions/${params.suggestionId}/snooze`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(params.token && { Authorization: `Bearer ${params.token}` }),
    },
    body: JSON.stringify({ hours: params.hours }),
  });

  if (!response.ok) {
    const body = await safeJson<unknown>(response);
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : `Failed to snooze suggestion: ${response.statusText}`;
    throw new Error(message);
  }

  return response.json();
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing PM agent suggestions.
 *
 * Provides:
 * - `suggestions` - All fetched suggestions
 * - `pendingSuggestions` - Suggestions with PENDING status
 * - `resolvedSuggestions` - Suggestions with ACCEPTED, REJECTED, or EXPIRED status
 * - `snoozedSuggestions` - Suggestions with SNOOZED status
 * - `isLoading` - Loading state
 * - `isError` - Error state
 * - `error` - Error object if any
 * - `acceptMutation` - Mutation for accepting a suggestion
 * - `rejectMutation` - Mutation for rejecting a suggestion
 * - `snoozeMutation` - Mutation for snoozing a suggestion
 *
 * @param projectId - The project ID to fetch suggestions for
 * @param filters - Optional filters for status, type, or agent
 *
 * @example
 * ```tsx
 * const {
 *   pendingSuggestions,
 *   acceptMutation,
 *   rejectMutation,
 *   snoozeMutation,
 * } = useSuggestions('proj_123');
 *
 * // Accept a suggestion
 * acceptMutation.mutate('suggestion_id');
 *
 * // Snooze for 4 hours
 * snoozeMutation.mutate({ suggestionId: 'suggestion_id', hours: 4 });
 * ```
 */
export function useSuggestions(projectId: string, filters?: SuggestionsQueryParams) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const token = getSessionToken(session);

  // Fetch suggestions query
  const {
    data: suggestions,
    isLoading,
    isError,
    error,
  } = useQuery<Suggestion[]>({
    queryKey: ['pm-suggestions', projectId, filters],
    queryFn: () => fetchSuggestions({ projectId, filters, token }),
    enabled: !!token && !!projectId,
    // Refetch every minute to check for expired suggestions
    refetchInterval: 60000,
  });

  // Derive filtered suggestions
  const pendingSuggestions = suggestions?.filter((s) => s.status === 'PENDING') || [];
  const snoozedSuggestions = suggestions?.filter((s) => s.status === 'SNOOZED') || [];
  const resolvedSuggestions = suggestions?.filter(
    (s) => s.status === 'ACCEPTED' || s.status === 'REJECTED' || s.status === 'EXPIRED'
  ) || [];

  // Sort pending by confidence (highest first)
  const sortedPendingSuggestions = [...pendingSuggestions].sort(
    (a, b) => b.confidence - a.confidence
  );

  // Accept mutation
  const acceptMutation = useMutation({
    mutationFn: (suggestionId: string) => acceptSuggestion({ suggestionId, token }),
    onMutate: async (suggestionId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['pm-suggestions', projectId] });

      const previous = queryClient.getQueryData<Suggestion[]>(['pm-suggestions', projectId, filters]);

      queryClient.setQueryData<Suggestion[]>(
        ['pm-suggestions', projectId, filters],
        (old) =>
          old?.map((s) =>
            s.id === suggestionId ? { ...s, status: 'ACCEPTED' as const } : s
          ) || []
      );

      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm-suggestions', projectId] });
      toast.success('Suggestion accepted');
    },
    onError: (err, _, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(['pm-suggestions', projectId, filters], context.previous);
      }
      const message = err instanceof Error ? err.message : 'Failed to accept suggestion';
      toast.error('Failed to accept suggestion', { description: message });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (params: { suggestionId: string; reason?: string }) =>
      rejectSuggestion({ ...params, token }),
    onMutate: async ({ suggestionId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['pm-suggestions', projectId] });

      const previous = queryClient.getQueryData<Suggestion[]>(['pm-suggestions', projectId, filters]);

      queryClient.setQueryData<Suggestion[]>(
        ['pm-suggestions', projectId, filters],
        (old) =>
          old?.map((s) =>
            s.id === suggestionId ? { ...s, status: 'REJECTED' as const } : s
          ) || []
      );

      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm-suggestions', projectId] });
      toast.success('Suggestion rejected');
    },
    onError: (err, _, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(['pm-suggestions', projectId, filters], context.previous);
      }
      const message = err instanceof Error ? err.message : 'Failed to reject suggestion';
      toast.error('Failed to reject suggestion', { description: message });
    },
  });

  // Snooze mutation
  const snoozeMutation = useMutation({
    mutationFn: (params: { suggestionId: string; hours: number }) =>
      snoozeSuggestion({ ...params, token }),
    onMutate: async ({ suggestionId, hours }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['pm-suggestions', projectId] });

      const previous = queryClient.getQueryData<Suggestion[]>(['pm-suggestions', projectId, filters]);

      const snoozedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

      queryClient.setQueryData<Suggestion[]>(
        ['pm-suggestions', projectId, filters],
        (old) =>
          old?.map((s) =>
            s.id === suggestionId
              ? { ...s, status: 'SNOOZED' as const, snoozedUntil }
              : s
          ) || []
      );

      return { previous };
    },
    onSuccess: (_, { hours }) => {
      queryClient.invalidateQueries({ queryKey: ['pm-suggestions', projectId] });
      toast.success(`Suggestion snoozed for ${hours} hour${hours !== 1 ? 's' : ''}`);
    },
    onError: (err, _, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(['pm-suggestions', projectId, filters], context.previous);
      }
      const message = err instanceof Error ? err.message : 'Failed to snooze suggestion';
      toast.error('Failed to snooze suggestion', { description: message });
    },
  });

  return {
    suggestions,
    pendingSuggestions,
    sortedPendingSuggestions,
    snoozedSuggestions,
    resolvedSuggestions,
    pendingCount: pendingSuggestions.length,
    isLoading,
    isError,
    error,
    acceptMutation,
    rejectMutation,
    snoozeMutation,
  };
}

/**
 * Hook for counting pending suggestions (lightweight)
 */
export function usePendingSuggestionCount(projectId: string) {
  const { data: session } = useSession();
  const token = getSessionToken(session);

  const { data } = useQuery({
    queryKey: ['pm-suggestions-count', projectId],
    queryFn: async () => {
      const suggestions = await fetchSuggestions({
        projectId,
        filters: { status: 'PENDING' },
        token,
      });
      return suggestions.length;
    },
    enabled: !!token && !!projectId,
    refetchInterval: 60000, // Every minute
  });

  return data || 0;
}
