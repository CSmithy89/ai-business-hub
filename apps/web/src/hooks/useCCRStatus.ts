/**
 * CCR Status Hook
 *
 * Monitors CCR (Claude Code Router) connection status and provider health.
 * Provides real-time updates via polling and reconnection controls.
 *
 * @module hooks
 * @story DM-01.7
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DM_CONSTANTS } from '@/lib/dm-constants';

/**
 * Provider health status
 */
export type ProviderHealthStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

/**
 * Individual provider status
 */
export interface ProviderStatus {
  id: string;
  name: string;
  provider: string;
  status: ProviderHealthStatus;
  latency?: number;
  lastSuccess?: string;
  errorCount?: number;
}

/**
 * CCR connection status
 */
export interface CCRStatus {
  connected: boolean;
  mode: 'auto' | 'manual' | 'cost-optimized' | 'performance';
  providers: ProviderStatus[];
  lastChecked: string;
  uptime?: number;
  totalRequests?: number;
  failedRequests?: number;
}

// Query keys
const CCR_STATUS_KEY = ['ccr-status'];

/**
 * Mock fetch for CCR status (will be replaced with real API)
 */
async function fetchCCRStatus(): Promise<CCRStatus> {
  // TODO: Replace with actual API call when DM-02 backend is ready
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Simulate occasional status changes
  const random = Math.random();
  const isConnected = random > 0.1; // 90% chance connected

  return {
    connected: isConnected,
    mode: 'auto',
    providers: [
      {
        id: 'claude-primary',
        name: 'Claude (Primary)',
        provider: 'anthropic',
        status: random > 0.05 ? 'healthy' : 'degraded',
        latency: Math.floor(150 + Math.random() * 100),
        lastSuccess: new Date().toISOString(),
        errorCount: 0,
      },
      {
        id: 'openai-fallback',
        name: 'OpenAI (Fallback)',
        provider: 'openai',
        status: random > 0.1 ? 'healthy' : (random > 0.05 ? 'degraded' : 'down'),
        latency: Math.floor(200 + Math.random() * 150),
        lastSuccess: new Date(Date.now() - 60000).toISOString(),
        errorCount: random > 0.8 ? 1 : 0,
      },
      {
        id: 'deepseek-budget',
        name: 'DeepSeek (Budget)',
        provider: 'deepseek',
        status: 'unknown',
        latency: undefined,
        lastSuccess: undefined,
        errorCount: 0,
      },
    ],
    lastChecked: new Date().toISOString(),
    uptime: 99.9,
    totalRequests: 1234,
    failedRequests: 2,
  };
}

/**
 * Mock reconnect function
 */
async function reconnectCCR(): Promise<CCRStatus> {
  // TODO: Replace with actual API call
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    connected: true,
    mode: 'auto',
    providers: [
      {
        id: 'claude-primary',
        name: 'Claude (Primary)',
        provider: 'anthropic',
        status: 'healthy',
        latency: 145,
        lastSuccess: new Date().toISOString(),
        errorCount: 0,
      },
      {
        id: 'openai-fallback',
        name: 'OpenAI (Fallback)',
        provider: 'openai',
        status: 'healthy',
        latency: 220,
        lastSuccess: new Date().toISOString(),
        errorCount: 0,
      },
      {
        id: 'deepseek-budget',
        name: 'DeepSeek (Budget)',
        provider: 'deepseek',
        status: 'unknown',
        latency: undefined,
        lastSuccess: undefined,
        errorCount: 0,
      },
    ],
    lastChecked: new Date().toISOString(),
    uptime: 99.9,
    totalRequests: 1234,
    failedRequests: 2,
  };
}

/**
 * Hook for fetching CCR status with polling
 */
export function useCCRStatus() {
  return useQuery({
    queryKey: CCR_STATUS_KEY,
    queryFn: fetchCCRStatus,
    refetchInterval: DM_CONSTANTS.CCR.STATUS_POLL_INTERVAL_MS,
    staleTime: DM_CONSTANTS.CCR.STATUS_POLL_INTERVAL_MS / 2,
  });
}

/**
 * Hook for triggering CCR reconnection
 */
export function useReconnectCCR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reconnectCCR,
    onSuccess: (data) => {
      queryClient.setQueryData(CCR_STATUS_KEY, data);
    },
  });
}

/**
 * Get status color class
 */
export function getStatusColor(status: ProviderHealthStatus): string {
  const colors: Record<ProviderHealthStatus, string> = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    down: 'bg-red-500',
    unknown: 'bg-gray-400',
  };
  return colors[status];
}

/**
 * Get status text color class
 */
export function getStatusTextColor(status: ProviderHealthStatus): string {
  const colors: Record<ProviderHealthStatus, string> = {
    healthy: 'text-green-600',
    degraded: 'text-yellow-600',
    down: 'text-red-600',
    unknown: 'text-gray-500',
  };
  return colors[status];
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: ProviderHealthStatus): string {
  const labels: Record<ProviderHealthStatus, string> = {
    healthy: 'Healthy',
    degraded: 'Degraded',
    down: 'Down',
    unknown: 'Unknown',
  };
  return labels[status];
}

/**
 * Format latency for display
 */
export function formatLatency(latency?: number): string {
  if (latency === undefined) return '-';
  return `${latency}ms`;
}

/**
 * Format timestamp for display
 */
export function formatLastChecked(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return date.toLocaleDateString();
}
