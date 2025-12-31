/**
 * Dashboard Cache Configuration
 *
 * Centralized cache configuration for dashboard-related React Query hooks.
 * Provides consistent cache behavior across all dashboard data fetching.
 *
 * Features:
 * - Short stale time (10s) to balance freshness vs request frequency
 * - Longer cache time (60s) for quick re-mounts
 * - Workspace-scoped cache keys for multi-tenant isolation
 * - Deduplication via React Query's built-in request batching
 *
 * Environment Variables (optional):
 * - NEXT_PUBLIC_DASHBOARD_STALE_TIME_MS: Override default stale time
 * - NEXT_PUBLIC_DASHBOARD_GC_TIME_MS: Override default gc time
 *
 * @see docs/modules/bm-dm/stories/dm-08-2-dashboard-data-caching.md
 */

import type { UseQueryOptions } from '@tanstack/react-query';

// =============================================================================
// ENVIRONMENT CONFIGURATION
// =============================================================================

/**
 * Parse an optional positive integer from environment variable.
 * Returns undefined if the value is not set or invalid.
 */
function parseEnvInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = parseInt(value, 10);
  return !isNaN(parsed) && parsed > 0 ? parsed : undefined;
}

/** Default stale time in ms (10 seconds) */
const DEFAULT_STALE_TIME = 10_000;

/** Default gc time in ms (60 seconds) */
const DEFAULT_GC_TIME = 60_000;

// =============================================================================
// CACHE CONFIGURATION
// =============================================================================

/**
 * Default cache configuration for dashboard queries.
 *
 * - staleTime: 10s - Data is considered fresh for 10 seconds (env configurable)
 * - gcTime: 60s - Keep cached data for 60s after component unmounts (env configurable)
 * - refetchOnWindowFocus: false - Don't refetch when tab becomes active
 * - refetchOnMount: false - Use cached data on re-mount if not stale
 * - retry: 1 - Only retry once on failure
 */
export const DASHBOARD_CACHE_CONFIG = {
  /** Time in ms before data is considered stale */
  staleTime:
    parseEnvInt(process.env.NEXT_PUBLIC_DASHBOARD_STALE_TIME_MS) ??
    DEFAULT_STALE_TIME,

  /** Time in ms to keep data in cache after unmount */
  gcTime:
    parseEnvInt(process.env.NEXT_PUBLIC_DASHBOARD_GC_TIME_MS) ?? DEFAULT_GC_TIME,

  /** Don't refetch when window regains focus */
  refetchOnWindowFocus: false,

  /** Don't refetch on mount if data exists */
  refetchOnMount: false,

  /** Only retry failed requests once */
  retry: 1,
} as const satisfies Partial<UseQueryOptions>;

/**
 * More aggressive cache config for less frequently changing data.
 * Use for data that changes infrequently (e.g., workspace settings).
 */
export const DASHBOARD_LONG_CACHE_CONFIG = {
  staleTime: 60_000, // 1 minute
  gcTime: 5 * 60_000, // 5 minutes
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  retry: 1,
} as const satisfies Partial<UseQueryOptions>;

/**
 * Real-time cache config for frequently updating data.
 * Use for data that should be fresher (e.g., active tasks, live metrics).
 */
export const DASHBOARD_REALTIME_CACHE_CONFIG = {
  staleTime: 5_000, // 5 seconds
  gcTime: 30_000, // 30 seconds
  refetchOnWindowFocus: true,
  refetchOnMount: true,
  retry: 0, // No retry for real-time data
} as const satisfies Partial<UseQueryOptions>;

// =============================================================================
// CACHE KEY FACTORIES
// =============================================================================

/**
 * Dashboard query key prefix.
 */
export const DASHBOARD_QUERY_KEY = 'dashboard' as const;

/**
 * Generate a cache key for dashboard queries.
 *
 * Keys are scoped by workspace for multi-tenant isolation.
 * This ensures users in different workspaces don't share cached data.
 *
 * @param workspaceId - The workspace ID for cache scoping
 * @param dataType - The type of data being fetched
 * @returns Tuple cache key for React Query
 *
 * @example
 * ```typescript
 * // Basic usage
 * const key = getDashboardQueryKey('ws_123', 'project-status');
 * // ['dashboard', 'ws_123', 'project-status']
 *
 * // In useQuery
 * useQuery({
 *   queryKey: getDashboardQueryKey(workspaceId, 'metrics'),
 *   queryFn: fetchMetrics,
 *   ...DASHBOARD_CACHE_CONFIG,
 * });
 * ```
 */
export function getDashboardQueryKey(
  workspaceId: string,
  dataType: DashboardDataType
) {
  return [DASHBOARD_QUERY_KEY, workspaceId, dataType] as const;
}

/**
 * Generate a cache key with additional parameters.
 *
 * Use when you need to include filters or pagination in the cache key.
 *
 * @param workspaceId - The workspace ID for cache scoping
 * @param dataType - The type of data being fetched
 * @param params - Additional parameters to include in the key
 * @returns Tuple cache key for React Query
 *
 * @example
 * ```typescript
 * const key = getDashboardQueryKeyWithParams('ws_123', 'activities', {
 *   limit: 10,
 *   projectId: 'proj_456',
 * });
 * // ['dashboard', 'ws_123', 'activities', { limit: 10, projectId: 'proj_456' }]
 * ```
 */
export function getDashboardQueryKeyWithParams<T extends Record<string, unknown>>(
  workspaceId: string,
  dataType: DashboardDataType,
  params: T
) {
  return [DASHBOARD_QUERY_KEY, workspaceId, dataType, params] as const;
}

// =============================================================================
// TYPES
// =============================================================================

/**
 * Supported dashboard data types for cache key generation.
 * Defined as const array for type safety and runtime iteration.
 */
export const DASHBOARD_DATA_TYPES = [
  'project-status',
  'metrics',
  'activities',
  'alerts',
  'tasks',
  'team',
  'overview',
  'summary',
] as const;

/**
 * Type derived from DASHBOARD_DATA_TYPES const array.
 * Ensures cache keys are constrained to valid data types.
 */
export type DashboardDataType = (typeof DASHBOARD_DATA_TYPES)[number];

// =============================================================================
// CACHE INVALIDATION HELPERS
// =============================================================================

/**
 * Get the base query key for invalidating all dashboard queries for a workspace.
 *
 * @param workspaceId - The workspace ID
 * @returns Partial key that matches all dashboard queries for the workspace
 *
 * @example
 * ```typescript
 * // Invalidate all dashboard data for a workspace
 * queryClient.invalidateQueries({
 *   queryKey: getDashboardInvalidationKey('ws_123'),
 * });
 * ```
 */
export function getDashboardInvalidationKey(workspaceId: string) {
  return [DASHBOARD_QUERY_KEY, workspaceId] as const;
}

/**
 * Get the base query key for invalidating ALL dashboard queries.
 *
 * @returns Partial key that matches all dashboard queries
 *
 * @example
 * ```typescript
 * // Invalidate all dashboard data (e.g., on logout)
 * queryClient.invalidateQueries({
 *   queryKey: getAllDashboardInvalidationKey(),
 * });
 * ```
 */
export function getAllDashboardInvalidationKey() {
  return [DASHBOARD_QUERY_KEY] as const;
}
