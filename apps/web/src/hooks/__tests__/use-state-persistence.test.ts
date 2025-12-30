/**
 * Unit Tests for State Persistence Hook
 *
 * Tests for useStatePersistence hook including:
 * - localStorage save/load
 * - Debouncing
 * - Stale state detection
 * - Cross-tab sync via BroadcastChannel
 * - SSR safety
 *
 * @see docs/modules/bm-dm/epics/epic-dm-04-tech-spec.md
 * Epic: DM-04 | Story: DM-04.5
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  useStatePersistence,
  clearPersistedDashboardState,
  hasPersistedDashboardState,
  PERSISTENCE_DEBOUNCE_MS,
  STATE_TTL_MS,
  BROADCAST_CHANNEL_NAME,
} from '../use-state-persistence';
import { useDashboardStateStore } from '@/stores/dashboard-state-store';
import { createInitialDashboardState, STATE_VERSION } from '@/lib/schemas/dashboard-state';
import { STORAGE_DASHBOARD_STATE, STORAGE_DASHBOARD_STATE_VERSION } from '@/lib/storage-keys';

// =============================================================================
// MOCKS
// =============================================================================

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

// Mock BroadcastChannel
class MockBroadcastChannel {
  static instances: MockBroadcastChannel[] = [];
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(name: string) {
    this.name = name;
    MockBroadcastChannel.instances.push(this);
  }

  postMessage(message: unknown) {
    // Broadcast to all other instances with the same name
    MockBroadcastChannel.instances
      .filter((instance) => instance !== this && instance.name === this.name)
      .forEach((instance) => {
        const event = new MessageEvent('message', { data: message });
        instance.eventListeners.get('message')?.forEach((listener) => listener(event));
        if (instance.onmessage) {
          instance.onmessage(event);
        }
      });
  }

  addEventListener(type: string, listener: Function) {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }

  removeEventListener(type: string, listener: Function) {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  close() {
    const index = MockBroadcastChannel.instances.indexOf(this);
    if (index > -1) {
      MockBroadcastChannel.instances.splice(index, 1);
    }
  }

  static reset() {
    MockBroadcastChannel.instances = [];
  }
}

// =============================================================================
// TEST SETUP
// =============================================================================

describe('useStatePersistence', () => {
  beforeEach(() => {
    // Reset mocks
    vi.useFakeTimers();
    localStorageMock.clear();
    MockBroadcastChannel.reset();

    // Setup window mocks
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    Object.defineProperty(window, 'BroadcastChannel', {
      value: MockBroadcastChannel,
      writable: true,
    });

    // Reset store
    useDashboardStateStore.getState().reset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ===========================================================================
  // LOCALSTORAGE SAVE/LOAD TESTS
  // ===========================================================================

  describe('localStorage save/load', () => {
    it('should load persisted state on mount', async () => {
      // Setup persisted state
      const persistedState = createInitialDashboardState({
        activeProject: 'test-project-123',
      });
      persistedState.timestamp = Date.now() - 1000; // 1 second ago
      persistedState.widgets.alerts = [
        {
          id: 'alert-1',
          type: 'info',
          title: 'Test Alert',
          message: 'Test message',
          timestamp: Date.now(),
          dismissable: true,
          dismissed: false,
        },
      ];

      localStorageMock.setItem(STORAGE_DASHBOARD_STATE, JSON.stringify(persistedState));
      localStorageMock.setItem(STORAGE_DASHBOARD_STATE_VERSION, String(STATE_VERSION));

      // Render hook
      renderHook(() => useStatePersistence({ debug: false }));

      // Verify state was restored
      await waitFor(() => {
        const state = useDashboardStateStore.getState();
        expect(state.activeProject).toBe('test-project-123');
        expect(state.widgets.alerts).toHaveLength(1);
        expect(state.widgets.alerts[0].title).toBe('Test Alert');
      });
    });

    it('should save state changes with debouncing', async () => {
      renderHook(() => useStatePersistence({ debounceMs: 100, debug: false }));

      // Trigger state change
      act(() => {
        useDashboardStateStore.getState().setActiveProject('project-1');
      });

      // Should not save immediately
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        STORAGE_DASHBOARD_STATE,
        expect.any(String)
      );

      // Advance timers past debounce
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Now should be saved
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          STORAGE_DASHBOARD_STATE,
          expect.stringContaining('project-1')
        );
      });
    });

    it('should not persist loading and error states', async () => {
      renderHook(() => useStatePersistence({ debounceMs: 50, debug: false }));

      // Set loading and error states
      act(() => {
        useDashboardStateStore.getState().setLoading(true, ['navi']);
        useDashboardStateStore.getState().setError('navi', 'Test error');
        useDashboardStateStore.getState().setActiveProject('project-1');
      });

      // Advance timers
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Verify saved state excludes transient data
      await waitFor(() => {
        const savedCall = localStorageMock.setItem.mock.calls.find(
          (call) => call[0] === STORAGE_DASHBOARD_STATE
        );
        expect(savedCall).toBeDefined();
        const savedState = JSON.parse(savedCall![1]);
        expect(savedState.loading.isLoading).toBe(false);
        expect(savedState.loading.loadingAgents).toEqual([]);
        expect(savedState.errors).toEqual({});
        expect(savedState.activeProject).toBe('project-1');
      });
    });
  });

  // ===========================================================================
  // DEBOUNCING TESTS
  // ===========================================================================

  describe('debouncing', () => {
    it('should coalesce rapid state changes', async () => {
      renderHook(() => useStatePersistence({ debounceMs: 100, debug: false }));

      // Rapid state changes
      act(() => {
        useDashboardStateStore.getState().setActiveProject('project-1');
      });
      act(() => {
        vi.advanceTimersByTime(20);
        useDashboardStateStore.getState().setActiveProject('project-2');
      });
      act(() => {
        vi.advanceTimersByTime(20);
        useDashboardStateStore.getState().setActiveProject('project-3');
      });

      // Advance past debounce
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Should only have one save with the final value
      await waitFor(() => {
        const saveCalls = localStorageMock.setItem.mock.calls.filter(
          (call) => call[0] === STORAGE_DASHBOARD_STATE
        );
        // Only the most recent state should be saved
        expect(saveCalls.length).toBe(1);
        const savedState = JSON.parse(saveCalls[0][1]);
        expect(savedState.activeProject).toBe('project-3');
      });
    });

    it('should use custom debounce interval', async () => {
      renderHook(() => useStatePersistence({ debounceMs: 500, debug: false }));

      act(() => {
        useDashboardStateStore.getState().setActiveProject('test');
      });

      // Should not save before debounce
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        STORAGE_DASHBOARD_STATE,
        expect.any(String)
      );

      // Should save after debounce
      act(() => {
        vi.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          STORAGE_DASHBOARD_STATE,
          expect.any(String)
        );
      });
    });
  });

  // ===========================================================================
  // STALE STATE DETECTION TESTS
  // ===========================================================================

  describe('stale state detection', () => {
    it('should discard state older than TTL', async () => {
      // Setup very old persisted state
      const oldState = createInitialDashboardState({
        activeProject: 'old-project',
      });
      oldState.timestamp = Date.now() - STATE_TTL_MS - 1000; // Older than TTL

      localStorageMock.setItem(STORAGE_DASHBOARD_STATE, JSON.stringify(oldState));
      localStorageMock.setItem(STORAGE_DASHBOARD_STATE_VERSION, String(STATE_VERSION));

      renderHook(() => useStatePersistence({ debug: false }));

      // Verify state was NOT restored (should remain null)
      await waitFor(() => {
        const state = useDashboardStateStore.getState();
        expect(state.activeProject).toBeNull();
      });

      // Verify old state was removed
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_DASHBOARD_STATE);
    });

    it('should keep state within TTL', async () => {
      const recentState = createInitialDashboardState({
        activeProject: 'recent-project',
      });
      recentState.timestamp = Date.now() - 1000; // 1 second ago

      localStorageMock.setItem(STORAGE_DASHBOARD_STATE, JSON.stringify(recentState));
      localStorageMock.setItem(STORAGE_DASHBOARD_STATE_VERSION, String(STATE_VERSION));

      renderHook(() => useStatePersistence({ debug: false }));

      await waitFor(() => {
        const state = useDashboardStateStore.getState();
        expect(state.activeProject).toBe('recent-project');
      });
    });

    it('should handle version mismatch', async () => {
      const state = createInitialDashboardState({
        activeProject: 'test',
      });
      state.timestamp = Date.now() - 1000;

      localStorageMock.setItem(STORAGE_DASHBOARD_STATE, JSON.stringify(state));
      // Wrong version
      localStorageMock.setItem(STORAGE_DASHBOARD_STATE_VERSION, String(STATE_VERSION + 1));

      renderHook(() => useStatePersistence({ debug: false }));

      await waitFor(() => {
        const currentState = useDashboardStateStore.getState();
        expect(currentState.activeProject).toBeNull();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_DASHBOARD_STATE);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_DASHBOARD_STATE_VERSION);
    });
  });

  // ===========================================================================
  // CROSS-TAB SYNC TESTS
  // ===========================================================================

  describe('cross-tab sync', () => {
    it('should create BroadcastChannel when enabled', () => {
      renderHook(() => useStatePersistence({ enableCrossTabSync: true, debug: false }));

      expect(MockBroadcastChannel.instances).toHaveLength(1);
      expect(MockBroadcastChannel.instances[0].name).toBe(BROADCAST_CHANNEL_NAME);
    });

    it('should not create BroadcastChannel when disabled', () => {
      renderHook(() => useStatePersistence({ enableCrossTabSync: false, debug: false }));

      expect(MockBroadcastChannel.instances).toHaveLength(0);
    });

    it('should receive state updates from other tabs', async () => {
      // Render hook in "Tab 1"
      renderHook(() => useStatePersistence({ enableCrossTabSync: true, debug: false }));

      // Tab 1 channel is created by the hook
      expect(MockBroadcastChannel.instances).toHaveLength(1);

      // Simulate "Tab 2" sending a state update
      const newState = createInitialDashboardState({
        activeProject: 'from-tab-2',
      });
      newState.timestamp = Date.now() + 1000; // Newer timestamp

      // Create "Tab 2" channel and post message
      const tab2Channel = new MockBroadcastChannel(BROADCAST_CHANNEL_NAME);
      tab2Channel.postMessage({
        type: 'state_update',
        timestamp: newState.timestamp,
        state: newState,
      });

      // Tab 1 should receive the update
      await waitFor(() => {
        const state = useDashboardStateStore.getState();
        expect(state.activeProject).toBe('from-tab-2');
      });
    });

    it('should broadcast state changes to other tabs', async () => {
      renderHook(() => useStatePersistence({ enableCrossTabSync: true, debounceMs: 50, debug: false }));

      // Create another tab's channel
      const otherTabChannel = new MockBroadcastChannel(BROADCAST_CHANNEL_NAME);
      const messageHandler = vi.fn();
      otherTabChannel.addEventListener('message', messageHandler);

      // Trigger state change
      act(() => {
        useDashboardStateStore.getState().setActiveProject('broadcast-test');
      });

      // Advance timers past debounce
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Other tab should receive the message
      await waitFor(() => {
        expect(messageHandler).toHaveBeenCalled();
        const message = messageHandler.mock.calls[0][0].data;
        expect(message.type).toBe('state_update');
        expect(message.state.activeProject).toBe('broadcast-test');
      });
    });

    it('should ignore stale updates from other tabs', async () => {
      // Setup initial state with recent timestamp
      const initialState = createInitialDashboardState({
        activeProject: 'current-project',
      });
      initialState.timestamp = Date.now();

      localStorageMock.setItem(STORAGE_DASHBOARD_STATE, JSON.stringify(initialState));
      localStorageMock.setItem(STORAGE_DASHBOARD_STATE_VERSION, String(STATE_VERSION));

      renderHook(() => useStatePersistence({ enableCrossTabSync: true, debug: false }));

      // Wait for initial load
      await waitFor(() => {
        expect(useDashboardStateStore.getState().activeProject).toBe('current-project');
      });

      // Simulate stale update from other tab (older timestamp)
      const staleState = createInitialDashboardState({
        activeProject: 'stale-project',
      });
      staleState.timestamp = Date.now() - 5000; // 5 seconds ago

      const otherTab = new MockBroadcastChannel(BROADCAST_CHANNEL_NAME);
      otherTab.postMessage({
        type: 'state_update',
        timestamp: staleState.timestamp,
        state: staleState,
      });

      // Should still have current project (stale update ignored)
      await vi.waitFor(() => {
        expect(useDashboardStateStore.getState().activeProject).toBe('current-project');
      });
    });
  });

  // ===========================================================================
  // SSR SAFETY TESTS
  // ===========================================================================

  describe('SSR safety', () => {
    it('should handle missing window gracefully', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR scenario
      delete global.window;

      expect(() => {
        clearPersistedDashboardState();
      }).not.toThrow();

      expect(hasPersistedDashboardState()).toBe(false);

      global.window = originalWindow;
    });
  });

  // ===========================================================================
  // UTILITY FUNCTION TESTS
  // ===========================================================================

  describe('clearPersistedDashboardState', () => {
    it('should remove persisted state', () => {
      localStorageMock.setItem(STORAGE_DASHBOARD_STATE, '{"test": true}');
      localStorageMock.setItem(STORAGE_DASHBOARD_STATE_VERSION, '1');

      clearPersistedDashboardState();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_DASHBOARD_STATE);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_DASHBOARD_STATE_VERSION);
    });

    it('should broadcast clear event to other tabs', () => {
      const otherTab = new MockBroadcastChannel(BROADCAST_CHANNEL_NAME);
      const messageHandler = vi.fn();
      otherTab.addEventListener('message', messageHandler);

      clearPersistedDashboardState();

      expect(messageHandler).toHaveBeenCalled();
      expect(messageHandler.mock.calls[0][0].data.type).toBe('state_cleared');
    });
  });

  describe('hasPersistedDashboardState', () => {
    it('should return true when valid state exists', () => {
      const state = createInitialDashboardState();
      state.timestamp = Date.now() - 1000;
      localStorageMock.setItem(STORAGE_DASHBOARD_STATE, JSON.stringify(state));

      expect(hasPersistedDashboardState()).toBe(true);
    });

    it('should return false when no state exists', () => {
      expect(hasPersistedDashboardState()).toBe(false);
    });

    it('should return false when state is stale', () => {
      const state = createInitialDashboardState();
      state.timestamp = Date.now() - STATE_TTL_MS - 1000;
      localStorageMock.setItem(STORAGE_DASHBOARD_STATE, JSON.stringify(state));

      expect(hasPersistedDashboardState()).toBe(false);
    });

    it('should return false when state is invalid', () => {
      localStorageMock.setItem(STORAGE_DASHBOARD_STATE, 'invalid json');

      expect(hasPersistedDashboardState()).toBe(false);
    });
  });

  // ===========================================================================
  // HOOK RETURN VALUE TESTS
  // ===========================================================================

  describe('hook return values', () => {
    it('should return clearPersistedState function', () => {
      const { result } = renderHook(() => useStatePersistence());

      expect(typeof result.current.clearPersistedState).toBe('function');
    });

    it('should return forceSave function', () => {
      const { result } = renderHook(() => useStatePersistence());

      expect(typeof result.current.forceSave).toBe('function');
    });

    it('should return isInitialized status', async () => {
      const { result } = renderHook(() => useStatePersistence());

      // After initialization
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });
    });

    it('forceSave should immediately save state', async () => {
      const { result } = renderHook(() => useStatePersistence({ debounceMs: 5000 }));

      act(() => {
        useDashboardStateStore.getState().setActiveProject('force-saved');
      });

      // Should not have saved yet (long debounce)
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        STORAGE_DASHBOARD_STATE,
        expect.stringContaining('force-saved')
      );

      // Force save
      act(() => {
        result.current.forceSave();
      });

      // Should now be saved
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          STORAGE_DASHBOARD_STATE,
          expect.stringContaining('force-saved')
        );
      });
    });
  });

  // ===========================================================================
  // DISABLED PERSISTENCE TESTS
  // ===========================================================================

  describe('disabled persistence', () => {
    it('should not load or save when disabled', async () => {
      const state = createInitialDashboardState({
        activeProject: 'should-not-load',
      });
      state.timestamp = Date.now() - 1000;
      localStorageMock.setItem(STORAGE_DASHBOARD_STATE, JSON.stringify(state));

      renderHook(() => useStatePersistence({ enabled: false }));

      // State should not be restored
      await waitFor(() => {
        expect(useDashboardStateStore.getState().activeProject).toBeNull();
      });

      // Trigger state change
      act(() => {
        useDashboardStateStore.getState().setActiveProject('should-not-save');
        vi.advanceTimersByTime(PERSISTENCE_DEBOUNCE_MS + 100);
      });

      // Should not save new state
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        STORAGE_DASHBOARD_STATE,
        expect.stringContaining('should-not-save')
      );
    });
  });
});
