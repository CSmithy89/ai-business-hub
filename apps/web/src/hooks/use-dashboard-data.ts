/**
 * Dashboard Data Hook
 *
 * React Query hook for fetching dashboard data with caching.
 * Provides a consistent pattern for dashboard data fetching with:
 * - Workspace-scoped cache keys
 * - Optimized stale/cache times
 * - Request deduplication
 * - Prefetching support
 *
 * @see docs/modules/bm-dm/stories/dm-08-2-dashboard-data-caching.md
 */

'use client';

import { useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import {
  DASHBOARD_CACHE_CONFIG,
  getDashboardQueryKey,
  getDashboardQueryKeyWithParams,
  getDashboardInvalidationKey,
  type DashboardDataType,
} from '@/lib/cache/dashboard-cache';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Options for useDashboardData hook.
 */
export interface UseDashboardDataOptions<TData = unknown, TError = Error> {
  /** Enable the query (default: true) */
  enabled?: boolean;
  /** Override the default stale time */
  staleTime?: number;
  /** Additional query options */
  queryOptions?: Partial<Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>>;
}

/**
 * Return type for useDashboardData hook.
 */
export interface UseDashboardDataResult<TData = unknown, TError = Error> {
  /** The fetched data */
  data: TData | undefined;
  /** Whether the initial fetch is loading */
  isLoading: boolean;
  /** Whether the query is fetching (including background refetch) */
  isFetching: boolean;
  /** Any error from the query */
  error: TError | null;
  /** Whether data is stale */
  isStale: boolean;
  /** Refetch the data */
  refetch: () => Promise<void>;
  /** Invalidate and refetch */
  invalidate: () => Promise<void>;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * Hook for fetching dashboard data with caching.
 *
 * Uses React Query with optimized cache settings for dashboard data.
 * Cache keys are automatically scoped by workspace ID.
 *
 * @param workspaceId - The current workspace ID for cache scoping
 * @param dataType - The type of dashboard data to fetch
 * @param fetcher - Function to fetch the data
 * @param options - Optional configuration
 * @returns Query result with data, loading states, and utilities
 *
 * @example
 * ```tsx
 * function DashboardMetrics({ workspaceId }: { workspaceId: string }) {
 *   const { data, isLoading, error } = useDashboardData(
 *     workspaceId,
 *     'metrics',
 *     async () => {
 *       const res = await fetch(`/api/dashboard/${workspaceId}/metrics`);
 *       return res.json();
 *     }
 *   );
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <Error message={error.message} />;
 *   return <MetricsDisplay data={data} />;
 * }
 * ```
 */
export function useDashboardData<TData = unknown, TError = Error>(
  workspaceId: string,
  dataType: DashboardDataType,
  fetcher: () => Promise<TData>,
  options: UseDashboardDataOptions<TData, TError> = {}
): UseDashboardDataResult<TData, TError> {
  const { enabled = true, staleTime, queryOptions } = options;
  const queryClient = useQueryClient();

  const queryKey = getDashboardQueryKey(workspaceId, dataType);

  const query = useQuery<TData, TError>({
    queryKey,
    queryFn: fetcher,
    enabled: enabled && !!workspaceId,
    ...DASHBOARD_CACHE_CONFIG,
    ...(staleTime !== undefined && { staleTime }),
    ...queryOptions,
  });

  const refetch = async () => {
    await query.refetch();
  };

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey });
  };

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    isStale: query.isStale,
    refetch,
    invalidate,
  };
}

/**
 * Hook for fetching dashboard data with additional parameters.
 *
 * Use when you need to include filters, pagination, or other
 * parameters in the cache key.
 *
 * @example
 * ```tsx
 * const { data } = useDashboardDataWithParams(
 *   workspaceId,
 *   'activities',
 *   { limit: 10, projectId: 'proj_123' },
 *   async (params) => {
 *     const res = await fetch(`/api/activities?${new URLSearchParams(params)}`);
 *     return res.json();
 *   }
 * );
 * ```
 */
export function useDashboardDataWithParams<
  TData = unknown,
  TError = Error,
  TParams extends Record<string, unknown> = Record<string, unknown>,
>(
  workspaceId: string,
  dataType: DashboardDataType,
  params: TParams,
  fetcher: (params: TParams) => Promise<TData>,
  options: UseDashboardDataOptions<TData, TError> = {}
): UseDashboardDataResult<TData, TError> {
  const { enabled = true, staleTime, queryOptions } = options;
  const queryClient = useQueryClient();

  const queryKey = getDashboardQueryKeyWithParams(workspaceId, dataType, params);

  const query = useQuery<TData, TError>({
    queryKey,
    queryFn: () => fetcher(params),
    enabled: enabled && !!workspaceId,
    ...DASHBOARD_CACHE_CONFIG,
    ...(staleTime !== undefined && { staleTime }),
    ...queryOptions,
  });

  const refetch = async () => {
    await query.refetch();
  };

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey });
  };

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    isStale: query.isStale,
    refetch,
    invalidate,
  };
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook to get dashboard cache utilities.
 *
 * Provides methods for prefetching and invalidating dashboard data.
 *
 * @example
 * ```tsx
 * function DashboardLayout({ workspaceId }: { workspaceId: string }) {
 *   const { prefetch, invalidateAll } = useDashboardCache(workspaceId);
 *
 *   useEffect(() => {
 *     // Prefetch metrics when layout mounts
 *     prefetch('metrics', fetchMetrics);
 *   }, []);
 *
 *   return <Outlet />;
 * }
 * ```
 */
export function useDashboardCache(workspaceId: string) {
  const queryClient = useQueryClient();

  /**
   * Prefetch dashboard data.
   */
  const prefetch = async <TData>(
    dataType: DashboardDataType,
    fetcher: () => Promise<TData>
  ) => {
    await queryClient.prefetchQuery({
      queryKey: getDashboardQueryKey(workspaceId, dataType),
      queryFn: fetcher,
      ...DASHBOARD_CACHE_CONFIG,
    });
  };

  /**
   * Invalidate specific dashboard data type.
   */
  const invalidate = async (dataType: DashboardDataType) => {
    await queryClient.invalidateQueries({
      queryKey: getDashboardQueryKey(workspaceId, dataType),
    });
  };

  /**
   * Invalidate all dashboard data for this workspace.
   */
  const invalidateAll = async () => {
    await queryClient.invalidateQueries({
      queryKey: getDashboardInvalidationKey(workspaceId),
    });
  };

  /**
   * Set cached data directly (useful for optimistic updates).
   */
  const setData = <TData>(dataType: DashboardDataType, data: TData) => {
    queryClient.setQueryData(getDashboardQueryKey(workspaceId, dataType), data);
  };

  /**
   * Get cached data directly.
   */
  const getData = <TData>(dataType: DashboardDataType): TData | undefined => {
    return queryClient.getQueryData(getDashboardQueryKey(workspaceId, dataType));
  };

  return {
    prefetch,
    invalidate,
    invalidateAll,
    setData,
    getData,
  };
}
