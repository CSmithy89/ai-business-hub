/**
 * Dashboard Cache Tests
 *
 * Unit tests for dashboard cache configuration and key factories.
 *
 * @see docs/modules/bm-dm/stories/dm-08-2-dashboard-data-caching.md
 */

import { describe, it, expect } from 'vitest';
import {
  DASHBOARD_CACHE_CONFIG,
  DASHBOARD_LONG_CACHE_CONFIG,
  DASHBOARD_REALTIME_CACHE_CONFIG,
  DASHBOARD_QUERY_KEY,
  getDashboardQueryKey,
  getDashboardQueryKeyWithParams,
  getDashboardInvalidationKey,
  getAllDashboardInvalidationKey,
} from '../dashboard-cache';

describe('Dashboard Cache Configuration', () => {
  describe('DASHBOARD_CACHE_CONFIG', () => {
    it('should have correct stale time (10 seconds)', () => {
      expect(DASHBOARD_CACHE_CONFIG.staleTime).toBe(10_000);
    });

    it('should have correct gc time (60 seconds)', () => {
      expect(DASHBOARD_CACHE_CONFIG.gcTime).toBe(60_000);
    });

    it('should not refetch on window focus', () => {
      expect(DASHBOARD_CACHE_CONFIG.refetchOnWindowFocus).toBe(false);
    });

    it('should not refetch on mount', () => {
      expect(DASHBOARD_CACHE_CONFIG.refetchOnMount).toBe(false);
    });

    it('should only retry once', () => {
      expect(DASHBOARD_CACHE_CONFIG.retry).toBe(1);
    });
  });

  describe('DASHBOARD_LONG_CACHE_CONFIG', () => {
    it('should have longer stale time (60 seconds)', () => {
      expect(DASHBOARD_LONG_CACHE_CONFIG.staleTime).toBe(60_000);
    });

    it('should have longer gc time (5 minutes)', () => {
      expect(DASHBOARD_LONG_CACHE_CONFIG.gcTime).toBe(5 * 60_000);
    });
  });

  describe('DASHBOARD_REALTIME_CACHE_CONFIG', () => {
    it('should have shorter stale time (5 seconds)', () => {
      expect(DASHBOARD_REALTIME_CACHE_CONFIG.staleTime).toBe(5_000);
    });

    it('should refetch on window focus', () => {
      expect(DASHBOARD_REALTIME_CACHE_CONFIG.refetchOnWindowFocus).toBe(true);
    });

    it('should not retry', () => {
      expect(DASHBOARD_REALTIME_CACHE_CONFIG.retry).toBe(0);
    });
  });
});

describe('Cache Key Factories', () => {
  describe('getDashboardQueryKey', () => {
    it('should generate correct key structure', () => {
      const key = getDashboardQueryKey('ws_123', 'metrics');

      expect(key).toEqual([DASHBOARD_QUERY_KEY, 'ws_123', 'metrics']);
      expect(key[0]).toBe('dashboard');
    });

    it('should scope by workspace ID', () => {
      const key1 = getDashboardQueryKey('ws_123', 'metrics');
      const key2 = getDashboardQueryKey('ws_456', 'metrics');

      expect(key1[1]).toBe('ws_123');
      expect(key2[1]).toBe('ws_456');
      expect(key1).not.toEqual(key2);
    });

    it('should differentiate by data type', () => {
      const key1 = getDashboardQueryKey('ws_123', 'metrics');
      const key2 = getDashboardQueryKey('ws_123', 'activities');

      expect(key1[2]).toBe('metrics');
      expect(key2[2]).toBe('activities');
      expect(key1).not.toEqual(key2);
    });
  });

  describe('getDashboardQueryKeyWithParams', () => {
    it('should include params in key', () => {
      const params = { limit: 10, projectId: 'proj_123' };
      const key = getDashboardQueryKeyWithParams('ws_123', 'activities', params);

      expect(key).toEqual([DASHBOARD_QUERY_KEY, 'ws_123', 'activities', params]);
      expect(key[3]).toEqual({ limit: 10, projectId: 'proj_123' });
    });

    it('should differentiate by params', () => {
      const key1 = getDashboardQueryKeyWithParams('ws_123', 'activities', { limit: 10 });
      const key2 = getDashboardQueryKeyWithParams('ws_123', 'activities', { limit: 20 });

      expect(key1).not.toEqual(key2);
    });
  });

  describe('getDashboardInvalidationKey', () => {
    it('should return partial key for workspace', () => {
      const key = getDashboardInvalidationKey('ws_123');

      expect(key).toEqual([DASHBOARD_QUERY_KEY, 'ws_123']);
    });

    it('should be a prefix of specific query keys', () => {
      const invalidationKey = getDashboardInvalidationKey('ws_123');
      const specificKey = getDashboardQueryKey('ws_123', 'metrics');

      // Invalidation key should be a prefix
      expect(specificKey.slice(0, invalidationKey.length)).toEqual(invalidationKey);
    });
  });

  describe('getAllDashboardInvalidationKey', () => {
    it('should return base dashboard key', () => {
      const key = getAllDashboardInvalidationKey();

      expect(key).toEqual([DASHBOARD_QUERY_KEY]);
    });

    it('should be a prefix of all dashboard keys', () => {
      const baseKey = getAllDashboardInvalidationKey();
      const key1 = getDashboardQueryKey('ws_123', 'metrics');
      const key2 = getDashboardQueryKey('ws_456', 'activities');

      expect(key1[0]).toBe(baseKey[0]);
      expect(key2[0]).toBe(baseKey[0]);
    });
  });
});
