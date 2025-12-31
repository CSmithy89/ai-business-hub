/**
 * Dashboard Sync Hook Tests
 *
 * Tests for the dashboard state synchronization hook.
 *
 * Story: DM-11.1 - Redis State Persistence
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDashboardSync } from '../use-dashboard-sync';
import { useDashboardStateStore } from '@/stores/dashboard-state-store';

// Track API calls
const mockSaveDashboardState = vi.fn().mockResolvedValue({ success: true, serverVersion: 1 });
const mockGetDashboardState = vi.fn().mockResolvedValue(null);
const mockDeleteDashboardState = vi.fn().mockResolvedValue({ success: true });

// Mock @/lib/auth-client
vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn(() => ({ data: { user: { id: 'user-123' } }, isPending: false })),
}));

// Mock the API module to prevent actual fetch calls
vi.mock('@/lib/api/dashboard-state', () => ({
  saveDashboardState: (...args: unknown[]) => mockSaveDashboardState(...args),
  getDashboardState: (...args: unknown[]) => mockGetDashboardState(...args),
  deleteDashboardState: (...args: unknown[]) => mockDeleteDashboardState(...args),
}));

// Import mocked useSession
import { useSession } from '@/lib/auth-client';
const mockedUseSession = vi.mocked(useSession);

describe('useDashboardSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Reset store state
    act(() => {
      useDashboardStateStore.getState().reset();
    });

    // Default to unauthenticated to prevent auto-restore
    mockedUseSession.mockReturnValue({
      data: null,
      isPending: false,
      error: null,
    } as ReturnType<typeof useSession>);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should return sync state', () => {
    const { result } = renderHook(() => useDashboardSync());

    expect(result.current.isSyncing).toBe(false);
    expect(result.current.lastSyncedAt).toBeNull();
    expect(result.current.syncError).toBeNull();
    expect(typeof result.current.syncNow).toBe('function');
    expect(typeof result.current.restoreNow).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  it('should call syncNow when invoked', async () => {
    const { result } = renderHook(() => useDashboardSync());

    await act(async () => {
      await result.current.syncNow();
    });

    // Verify the API was called
    expect(mockSaveDashboardState).toHaveBeenCalled();
  });

  it('should call restoreNow when invoked', async () => {
    const { result } = renderHook(() => useDashboardSync());

    await act(async () => {
      await result.current.restoreNow();
    });

    // Verify the API was called
    expect(mockGetDashboardState).toHaveBeenCalled();
  });

  it('should clear sync error when clearError is called', () => {
    // Set an error first
    act(() => {
      useDashboardStateStore.setState({ syncError: 'Test error' });
    });

    const { result } = renderHook(() => useDashboardSync());

    expect(result.current.syncError).toBe('Test error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.syncError).toBeNull();
  });

  it('should restore from server on authentication', async () => {
    // Start unauthenticated
    mockedUseSession.mockReturnValue({
      data: null,
      isPending: false,
      error: null,
    } as ReturnType<typeof useSession>);

    const { rerender } = renderHook(() => useDashboardSync());

    // Verify no restore called when unauthenticated
    expect(mockGetDashboardState).not.toHaveBeenCalled();

    // Change to authenticated
    mockedUseSession.mockReturnValue({
      data: { user: { id: 'user-123' } },
      isPending: false,
      error: null,
    } as ReturnType<typeof useSession>);

    rerender();

    // Allow async effects to complete
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // Verify restore was triggered
    expect(mockGetDashboardState).toHaveBeenCalled();
  });

  it('should only restore once per auth session', async () => {
    // Set to authenticated from the start
    mockedUseSession.mockReturnValue({
      data: { user: { id: 'user-123' } },
      isPending: false,
      error: null,
    } as ReturnType<typeof useSession>);

    // Already authenticated on first render
    const { rerender } = renderHook(() => useDashboardSync());

    // Allow first restore to complete
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // Should have been called once
    expect(mockGetDashboardState).toHaveBeenCalledTimes(1);

    // Rerender multiple times
    rerender();
    rerender();
    rerender();

    // Allow any pending operations
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // Should still only have been called once (not on rerenders)
    expect(mockGetDashboardState).toHaveBeenCalledTimes(1);
  });

  it('should not sync when unauthenticated', async () => {
    mockedUseSession.mockReturnValue({
      data: null,
      isPending: false,
      error: null,
    } as ReturnType<typeof useSession>);

    renderHook(() => useDashboardSync());

    // Make a state change
    act(() => {
      useDashboardStateStore.getState().setActiveProject('project-1');
    });

    // Advance timers past debounce
    await act(async () => {
      vi.advanceTimersByTime(5000);
      await vi.runAllTimersAsync();
    });

    // Should not have synced (unauthenticated)
    expect(mockSaveDashboardState).not.toHaveBeenCalled();
  });

  it('should reflect isSyncing state', () => {
    act(() => {
      useDashboardStateStore.setState({ isSyncing: true });
    });

    const { result } = renderHook(() => useDashboardSync());

    expect(result.current.isSyncing).toBe(true);

    act(() => {
      useDashboardStateStore.setState({ isSyncing: false });
    });

    expect(result.current.isSyncing).toBe(false);
  });

  it('should reflect lastSyncedAt state', () => {
    const timestamp = Date.now();

    act(() => {
      useDashboardStateStore.setState({ lastSyncedAt: timestamp });
    });

    const { result } = renderHook(() => useDashboardSync());

    expect(result.current.lastSyncedAt).toBe(timestamp);
  });
});
