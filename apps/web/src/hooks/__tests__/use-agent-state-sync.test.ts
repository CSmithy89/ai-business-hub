/**
 * Agent State Sync Hook Tests
 *
 * Unit tests for the CopilotKit to Zustand bridge hook.
 * Tests debouncing, stale state detection, and loading state handling.
 *
 * @see docs/modules/bm-dm/epics/epic-dm-04-tech-spec.md
 * Epic: DM-04 | Story: DM-04.2
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDashboardStateStore } from '@/stores/dashboard-state-store';
import {
  useAgentStateSync,
  DASHBOARD_AGENT_NAME,
  UPDATE_DEBOUNCE_MS,
} from '../use-agent-state-sync';
import { createInitialDashboardState } from '@/lib/schemas/dashboard-state';

// Mock CopilotKit
let mockRenderCallback: ((args: { state: unknown; status: string }) => null) | null = null;

vi.mock('@copilotkit/react-core', () => ({
  useCoAgentStateRender: vi.fn(({ render }) => {
    mockRenderCallback = render;
  }),
}));

// Reset store and mocks before each test
beforeEach(() => {
  vi.useFakeTimers();
  act(() => {
    useDashboardStateStore.getState().reset();
  });
  mockRenderCallback = null;
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('useAgentStateSync', () => {
  // ===========================================================================
  // INITIALIZATION TESTS
  // ===========================================================================

  describe('initialization', () => {
    it('exports correct constants', () => {
      expect(DASHBOARD_AGENT_NAME).toBe('dashboard_gateway');
      expect(UPDATE_DEBOUNCE_MS).toBe(100);
    });

    it('subscribes to agent state on mount', () => {
      renderHook(() => useAgentStateSync());
      expect(mockRenderCallback).not.toBeNull();
    });

    it('returns initial sync result', () => {
      const { result } = renderHook(() => useAgentStateSync());

      expect(result.current.isActive).toBe(false);
      expect(result.current.lastSyncTimestamp).toBeNull();
    });
  });

  // ===========================================================================
  // STATE UPDATE TESTS
  // ===========================================================================

  describe('state updates', () => {
    it('updates store with valid state after debounce', async () => {
      renderHook(() => useAgentStateSync());

      const validState = createInitialDashboardState({
        workspaceId: 'test-workspace',
        activeProject: 'project-1',
      });

      // Simulate agent state emission
      act(() => {
        mockRenderCallback?.({ state: validState, status: 'complete' });
      });

      // State should not be updated immediately (debounced)
      expect(useDashboardStateStore.getState().activeProject).toBeNull();

      // Advance past debounce interval
      act(() => {
        vi.advanceTimersByTime(UPDATE_DEBOUNCE_MS + 10);
      });

      // Now state should be updated
      expect(useDashboardStateStore.getState().activeProject).toBe('project-1');
      expect(useDashboardStateStore.getState().workspaceId).toBe('test-workspace');
    });

    it('rejects invalid state data', async () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      renderHook(() => useAgentStateSync());

      // Simulate invalid state emission
      act(() => {
        mockRenderCallback?.({ state: { invalid: 'data' }, status: 'complete' });
      });

      act(() => {
        vi.advanceTimersByTime(UPDATE_DEBOUNCE_MS + 10);
      });

      // State should remain unchanged
      expect(useDashboardStateStore.getState().activeProject).toBeNull();
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid state received')
      );

      consoleWarn.mockRestore();
    });
  });

  // ===========================================================================
  // DEBOUNCING TESTS
  // ===========================================================================

  describe('debouncing', () => {
    it('debounces rapid state updates', async () => {
      renderHook(() => useAgentStateSync());

      const state1 = createInitialDashboardState({ activeProject: 'project-1' });
      const state2 = createInitialDashboardState({ activeProject: 'project-2' });
      const state3 = createInitialDashboardState({ activeProject: 'project-3' });

      // Rapid fire state emissions
      act(() => {
        mockRenderCallback?.({ state: state1, status: 'complete' });
      });

      act(() => {
        vi.advanceTimersByTime(30);
        mockRenderCallback?.({ state: state2, status: 'complete' });
      });

      act(() => {
        vi.advanceTimersByTime(30);
        mockRenderCallback?.({ state: state3, status: 'complete' });
      });

      // Only the last state should be applied after full debounce
      act(() => {
        vi.advanceTimersByTime(UPDATE_DEBOUNCE_MS + 10);
      });

      expect(useDashboardStateStore.getState().activeProject).toBe('project-3');
    });

    it('respects custom debounce interval', async () => {
      const customDebounce = 200;
      renderHook(() => useAgentStateSync({ debounceMs: customDebounce }));

      const validState = createInitialDashboardState({ activeProject: 'test' });

      act(() => {
        mockRenderCallback?.({ state: validState, status: 'complete' });
      });

      // Not enough time with custom debounce
      act(() => {
        vi.advanceTimersByTime(UPDATE_DEBOUNCE_MS + 10);
      });

      expect(useDashboardStateStore.getState().activeProject).toBeNull();

      // Full custom debounce interval
      act(() => {
        vi.advanceTimersByTime(customDebounce);
      });

      expect(useDashboardStateStore.getState().activeProject).toBe('test');
    });
  });

  // ===========================================================================
  // STALE STATE TESTS
  // ===========================================================================

  describe('stale state detection', () => {
    it('skips stale state updates based on timestamp', async () => {
      renderHook(() => useAgentStateSync());

      const now = Date.now();
      const newerState = {
        ...createInitialDashboardState({ activeProject: 'newer' }),
        timestamp: now + 1000,
      };
      const olderState = {
        ...createInitialDashboardState({ activeProject: 'older' }),
        timestamp: now,
      };

      // First, apply newer state
      act(() => {
        mockRenderCallback?.({ state: newerState, status: 'complete' });
      });

      act(() => {
        vi.advanceTimersByTime(UPDATE_DEBOUNCE_MS + 10);
      });

      expect(useDashboardStateStore.getState().activeProject).toBe('newer');

      // Then try to apply older state (should be skipped)
      act(() => {
        mockRenderCallback?.({ state: olderState, status: 'complete' });
      });

      act(() => {
        vi.advanceTimersByTime(UPDATE_DEBOUNCE_MS + 10);
      });

      // Should still be 'newer'
      expect(useDashboardStateStore.getState().activeProject).toBe('newer');
    });
  });

  // ===========================================================================
  // LOADING STATE TESTS
  // ===========================================================================

  describe('loading state', () => {
    it('sets loading state immediately on inProgress status', async () => {
      renderHook(() => useAgentStateSync());

      act(() => {
        mockRenderCallback?.({ state: null, status: 'inProgress' });
      });

      // Loading should be set immediately (no debounce)
      const loading = useDashboardStateStore.getState().loading;
      expect(loading.isLoading).toBe(true);
      expect(loading.loadingAgents).toContain(DASHBOARD_AGENT_NAME);
    });

    it('clears loading state on complete status', async () => {
      renderHook(() => useAgentStateSync());

      // Set loading
      act(() => {
        mockRenderCallback?.({ state: null, status: 'inProgress' });
      });

      expect(useDashboardStateStore.getState().loading.isLoading).toBe(true);

      // Clear loading
      act(() => {
        mockRenderCallback?.({ state: null, status: 'complete' });
      });

      expect(useDashboardStateStore.getState().loading.isLoading).toBe(false);
    });

    it('clears loading state on idle status', async () => {
      renderHook(() => useAgentStateSync());

      act(() => {
        mockRenderCallback?.({ state: null, status: 'inProgress' });
      });

      act(() => {
        mockRenderCallback?.({ state: null, status: 'idle' });
      });

      expect(useDashboardStateStore.getState().loading.isLoading).toBe(false);
    });
  });

  // ===========================================================================
  // DEBUG MODE TESTS
  // ===========================================================================

  describe('debug mode', () => {
    it('logs state updates in debug mode', async () => {
      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

      renderHook(() => useAgentStateSync({ debug: true }));

      const validState = createInitialDashboardState();

      act(() => {
        mockRenderCallback?.({ state: validState, status: 'complete' });
      });

      expect(consoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[AgentStateSync] Received state update'),
        expect.anything()
      );

      consoleLog.mockRestore();
    });
  });

  // ===========================================================================
  // CLEANUP TESTS
  // ===========================================================================

  describe('cleanup', () => {
    it('clears debounce timer on unmount', async () => {
      const { unmount } = renderHook(() => useAgentStateSync());

      const validState = createInitialDashboardState({ activeProject: 'test' });

      act(() => {
        mockRenderCallback?.({ state: validState, status: 'complete' });
      });

      // Unmount before debounce completes
      unmount();

      act(() => {
        vi.advanceTimersByTime(UPDATE_DEBOUNCE_MS + 10);
      });

      // State should NOT be updated since unmount cleared the timer
      expect(useDashboardStateStore.getState().activeProject).toBeNull();
    });
  });
});

describe('useAgentStateWidget', () => {
  // Note: This is a convenience wrapper that combines useAgentStateSync with a selector.
  // Most functionality is tested via useAgentStateSync tests.

  it('is exported from the module', async () => {
    const { useAgentStateWidget } = await import('../use-agent-state-sync');
    expect(useAgentStateWidget).toBeDefined();
  });
});
