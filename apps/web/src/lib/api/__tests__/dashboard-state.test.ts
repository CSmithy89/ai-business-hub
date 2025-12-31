/**
 * Dashboard State API Client Tests
 *
 * Tests for the dashboard state persistence API client.
 *
 * Story: DM-11.1 - Redis State Persistence
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  saveDashboardState,
  getDashboardState,
  deleteDashboardState,
} from '../dashboard-state';
import type { DashboardState } from '@/lib/schemas/dashboard-state';

// Mock the api-client module
vi.mock('@/lib/api-client', () => ({
  apiPost: vi.fn(),
  apiGet: vi.fn(),
  apiDelete: vi.fn(),
}));

// Import mocked functions
import { apiPost, apiGet, apiDelete } from '@/lib/api-client';

const mockedApiPost = vi.mocked(apiPost);
const mockedApiGet = vi.mocked(apiGet);
const mockedApiDelete = vi.mocked(apiDelete);

describe('Dashboard State API Client', () => {
  const mockDashboardState: DashboardState = {
    version: 1,
    timestamp: Date.now(),
    activeProject: null,
    widgets: {
      projectStatus: null,
      metrics: null,
      activity: null,
      alerts: [],
    },
    loading: {
      isLoading: false,
      loadingAgents: [],
    },
    errors: {},
    activeTasks: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('saveDashboardState', () => {
    it('should save state successfully', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          serverVersion: 1,
        }),
      };
      mockedApiPost.mockResolvedValue(mockResponse as unknown as Response);

      const result = await saveDashboardState(mockDashboardState, 1);

      expect(result).toEqual({
        success: true,
        serverVersion: 1,
      });
      expect(mockedApiPost).toHaveBeenCalledWith('/api/dashboard/state', {
        version: 1,
        state: mockDashboardState,
        checksum: undefined,
      });
    });

    it('should return conflict resolution when server has newer version', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: false,
          serverVersion: 2,
          conflictResolution: 'server',
        }),
      };
      mockedApiPost.mockResolvedValue(mockResponse as unknown as Response);

      const result = await saveDashboardState(mockDashboardState, 1);

      expect(result?.conflictResolution).toBe('server');
    });

    it('should return null on API error', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      };
      mockedApiPost.mockResolvedValue(mockResponse as unknown as Response);

      const result = await saveDashboardState(mockDashboardState, 1);

      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalled();
    });

    it('should return null on network error', async () => {
      mockedApiPost.mockRejectedValue(new Error('Network error'));

      const result = await saveDashboardState(mockDashboardState, 1);

      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalled();
    });

    it('should include checksum when provided', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          serverVersion: 1,
        }),
      };
      mockedApiPost.mockResolvedValue(mockResponse as unknown as Response);

      await saveDashboardState(mockDashboardState, 1, 'abc123');

      expect(mockedApiPost).toHaveBeenCalledWith('/api/dashboard/state', {
        version: 1,
        state: mockDashboardState,
        checksum: 'abc123',
      });
    });
  });

  describe('getDashboardState', () => {
    it('should get state successfully', async () => {
      const stateResponse = {
        version: 1,
        state: mockDashboardState,
        lastModified: '2024-01-01T00:00:00.000Z',
      };
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(stateResponse),
      };
      mockedApiGet.mockResolvedValue(mockResponse as unknown as Response);

      const result = await getDashboardState();

      expect(result).toEqual(stateResponse);
      expect(mockedApiGet).toHaveBeenCalledWith('/api/dashboard/state');
    });

    it('should return null on 404 (no state exists)', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      mockedApiGet.mockResolvedValue(mockResponse as unknown as Response);

      const result = await getDashboardState();

      expect(result).toBeNull();
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should return null on API error', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      };
      mockedApiGet.mockResolvedValue(mockResponse as unknown as Response);

      const result = await getDashboardState();

      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalled();
    });

    it('should return null on network error', async () => {
      mockedApiGet.mockRejectedValue(new Error('Network error'));

      const result = await getDashboardState();

      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('deleteDashboardState', () => {
    it('should delete state successfully', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      };
      mockedApiDelete.mockResolvedValue(mockResponse as unknown as Response);

      const result = await deleteDashboardState();

      expect(result).toEqual({ success: true });
      expect(mockedApiDelete).toHaveBeenCalledWith('/api/dashboard/state');
    });

    it('should return success false on API error', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      };
      mockedApiDelete.mockResolvedValue(mockResponse as unknown as Response);

      const result = await deleteDashboardState();

      expect(result).toEqual({ success: false });
      expect(console.warn).toHaveBeenCalled();
    });

    it('should return success false on network error', async () => {
      mockedApiDelete.mockRejectedValue(new Error('Network error'));

      const result = await deleteDashboardState();

      expect(result).toEqual({ success: false });
      expect(console.warn).toHaveBeenCalled();
    });
  });
});
