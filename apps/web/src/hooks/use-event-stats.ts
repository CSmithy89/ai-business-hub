'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * API base URL for the NestJS backend
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Event stats response from API
 */
export interface EventStatsResponse {
  mainStream: {
    length: number;
    firstEntryId: string | null;
    lastEntryId: string | null;
  };
  dlq: {
    length: number;
  };
  consumerGroup: {
    name: string;
    pending: number;
    consumers: number;
    lag: number;
  };
  throughput: {
    last24h: number;
    lastHour: number;
  };
}

/**
 * DLQ event structure
 */
export interface DLQEvent {
  streamId: string;
  event: {
    id: string;
    type: string;
    source: string;
    timestamp: string;
    correlationId?: string;
    tenantId: string;
    userId: string;
    data: Record<string, unknown>;
  };
  error: string;
  errorStack?: string;
  movedAt: string;
  attempts: number;
}

/**
 * DLQ events response from API
 */
export interface DLQEventsResponse {
  events: DLQEvent[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Fetch event stats
 */
async function fetchEventStats(): Promise<EventStatsResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/events/stats`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch event stats: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch DLQ events
 */
async function fetchDLQEvents(
  page: number = 1,
  limit: number = 50
): Promise<DLQEventsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const response = await fetch(
    `${API_BASE_URL}/admin/events/dlq?${params.toString()}`,
    {
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch DLQ events: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Retry a DLQ event
 */
async function retryDLQEvent(
  eventId: string
): Promise<{ success: boolean; newEventId: string; message: string }> {
  const response = await fetch(
    `${API_BASE_URL}/admin/events/dlq/${eventId}/retry`,
    {
      method: 'POST',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to retry event: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete a DLQ event
 */
async function deleteDLQEvent(
  eventId: string
): Promise<{ success: boolean }> {
  const response = await fetch(
    `${API_BASE_URL}/admin/events/dlq/${eventId}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to delete event: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Hook for fetching event stats with auto-refresh
 */
export function useEventStats(refetchInterval: number = 5000) {
  return useQuery({
    queryKey: ['event-stats'],
    queryFn: fetchEventStats,
    refetchInterval,
  });
}

/**
 * Hook for fetching DLQ events
 */
export function useDLQEvents(page: number = 1, limit: number = 50) {
  return useQuery({
    queryKey: ['dlq-events', page, limit],
    queryFn: () => fetchDLQEvents(page, limit),
    refetchInterval: 5000,
  });
}

/**
 * Hook for retrying a DLQ event
 */
export function useRetryDLQEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: retryDLQEvent,
    onSuccess: () => {
      // Invalidate both event stats and DLQ events
      queryClient.invalidateQueries({ queryKey: ['event-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dlq-events'] });
    },
  });
}

/**
 * Hook for deleting a DLQ event
 */
export function useDeleteDLQEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDLQEvent,
    onSuccess: () => {
      // Invalidate both event stats and DLQ events
      queryClient.invalidateQueries({ queryKey: ['event-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dlq-events'] });
    },
  });
}
