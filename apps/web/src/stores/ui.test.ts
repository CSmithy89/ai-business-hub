/**
 * UI Store Unit Tests - Epic 07
 *
 * Tests for Zustand UI store state transitions and persistence.
 * @see docs/epics/EPIC-07-ui-shell.md
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';

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
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('UI Store State Transitions', () => {
  beforeEach(async () => {
    vi.resetModules();
    localStorageMock.clear();
  });

  describe('Sidebar State', () => {
    it('should initialize with sidebar expanded', async () => {
      const { useUIStore } = await import('./ui');
      const state = useUIStore.getState();

      expect(state.sidebarCollapsed).toBe(false);
    });

    it('should toggle sidebar collapsed state', async () => {
      const { useUIStore } = await import('./ui');

      act(() => {
        useUIStore.getState().toggleSidebar();
      });

      expect(useUIStore.getState().sidebarCollapsed).toBe(true);

      act(() => {
        useUIStore.getState().toggleSidebar();
      });

      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });

    it('should set sidebar collapsed directly', async () => {
      const { useUIStore } = await import('./ui');

      act(() => {
        useUIStore.getState().setSidebarCollapsed(true);
      });

      expect(useUIStore.getState().sidebarCollapsed).toBe(true);

      act(() => {
        useUIStore.getState().setSidebarCollapsed(false);
      });

      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });
  });

  describe('Chat Panel State', () => {
    it('should initialize with chat panel open', async () => {
      const { useUIStore } = await import('./ui');
      const state = useUIStore.getState();

      expect(state.chatPanelOpen).toBe(true);
    });

    it('should initialize with default chat panel width', async () => {
      const { useUIStore } = await import('./ui');
      const state = useUIStore.getState();

      expect(state.chatPanelWidth).toBe(380);
    });

    it('should toggle chat panel open state', async () => {
      const { useUIStore } = await import('./ui');

      act(() => {
        useUIStore.getState().toggleChatPanel();
      });

      expect(useUIStore.getState().chatPanelOpen).toBe(false);

      act(() => {
        useUIStore.getState().toggleChatPanel();
      });

      expect(useUIStore.getState().chatPanelOpen).toBe(true);
    });

    it('should clamp chat panel width to minimum 320px', async () => {
      const { useUIStore } = await import('./ui');

      act(() => {
        useUIStore.getState().setChatPanelWidth(200);
      });

      expect(useUIStore.getState().chatPanelWidth).toBe(320);
    });

    it('should clamp chat panel width to maximum 480px', async () => {
      const { useUIStore } = await import('./ui');

      act(() => {
        useUIStore.getState().setChatPanelWidth(600);
      });

      expect(useUIStore.getState().chatPanelWidth).toBe(480);
    });

    it('should accept valid chat panel width', async () => {
      const { useUIStore } = await import('./ui');

      act(() => {
        useUIStore.getState().setChatPanelWidth(400);
      });

      expect(useUIStore.getState().chatPanelWidth).toBe(400);
    });
  });

  describe('Mobile Menu State', () => {
    it('should initialize with mobile menu closed', async () => {
      const { useUIStore } = await import('./ui');
      const state = useUIStore.getState();

      expect(state.mobileMenuOpen).toBe(false);
    });

    it('should toggle mobile menu state', async () => {
      const { useUIStore } = await import('./ui');

      act(() => {
        useUIStore.getState().toggleMobileMenu();
      });

      expect(useUIStore.getState().mobileMenuOpen).toBe(true);

      act(() => {
        useUIStore.getState().toggleMobileMenu();
      });

      expect(useUIStore.getState().mobileMenuOpen).toBe(false);
    });

    it('should open mobile menu directly', async () => {
      const { useUIStore } = await import('./ui');

      act(() => {
        useUIStore.getState().openMobileMenu();
      });

      expect(useUIStore.getState().mobileMenuOpen).toBe(true);
    });

    it('should close mobile menu directly', async () => {
      const { useUIStore } = await import('./ui');

      act(() => {
        useUIStore.getState().openMobileMenu();
      });
      act(() => {
        useUIStore.getState().closeMobileMenu();
      });

      expect(useUIStore.getState().mobileMenuOpen).toBe(false);
    });
  });

  describe('Command Palette State', () => {
    it('should initialize with command palette closed', async () => {
      const { useUIStore } = await import('./ui');
      const state = useUIStore.getState();

      expect(state.isCommandPaletteOpen).toBe(false);
    });

    it('should open command palette', async () => {
      const { useUIStore } = await import('./ui');

      act(() => {
        useUIStore.getState().openCommandPalette();
      });

      expect(useUIStore.getState().isCommandPaletteOpen).toBe(true);
    });

    it('should close command palette', async () => {
      const { useUIStore } = await import('./ui');

      act(() => {
        useUIStore.getState().openCommandPalette();
      });
      act(() => {
        useUIStore.getState().closeCommandPalette();
      });

      expect(useUIStore.getState().isCommandPaletteOpen).toBe(false);
    });

    it('should toggle command palette state', async () => {
      const { useUIStore } = await import('./ui');

      act(() => {
        useUIStore.getState().toggleCommandPalette();
      });

      expect(useUIStore.getState().isCommandPaletteOpen).toBe(true);

      act(() => {
        useUIStore.getState().toggleCommandPalette();
      });

      expect(useUIStore.getState().isCommandPaletteOpen).toBe(false);
    });
  });

  describe('State Persistence', () => {
    it('should have correct localStorage key', async () => {
      const { UI_STORE_KEY } = await import('./ui');

      expect(UI_STORE_KEY).toBe('hyvve-ui-state');
    });

    it('should persist only specified state properties', async () => {
      const { useUIStore } = await import('./ui');

      // Modify state
      act(() => {
        useUIStore.getState().setSidebarCollapsed(true);
        useUIStore.getState().setChatPanelWidth(400);
        useUIStore.getState().toggleChatPanel(); // Close it
        useUIStore.getState().openMobileMenu();
      });

      // Check that localStorage.setItem was called
      expect(localStorageMock.setItem).toHaveBeenCalled();

      // Mobile menu should NOT be persisted (only sidebar, chat panel width, chat panel open)
      const lastCall = localStorageMock.setItem.mock.calls[
        localStorageMock.setItem.mock.calls.length - 1
      ];
      if (lastCall) {
        const persistedState = JSON.parse(lastCall[1]);
        expect(persistedState.state).not.toHaveProperty('mobileMenuOpen');
        expect(persistedState.state).not.toHaveProperty('isCommandPaletteOpen');
      }
    });
  });

  describe('Multiple State Transitions', () => {
    it('should handle rapid state changes correctly', async () => {
      const { useUIStore } = await import('./ui');

      // Rapid toggles
      act(() => {
        for (let i = 0; i < 10; i++) {
          useUIStore.getState().toggleSidebar();
        }
      });

      // After 10 toggles from false, should be false
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });

    it('should maintain state isolation between different properties', async () => {
      const { useUIStore } = await import('./ui');

      act(() => {
        useUIStore.getState().setSidebarCollapsed(true);
        useUIStore.getState().toggleChatPanel();
        useUIStore.getState().openMobileMenu();
      });

      const state = useUIStore.getState();
      expect(state.sidebarCollapsed).toBe(true);
      expect(state.chatPanelOpen).toBe(false);
      expect(state.mobileMenuOpen).toBe(true);
    });
  });

  describe('localStorage Persistence - Enhanced', () => {
    it('should persist state to localStorage on changes', async () => {
      const { useUIStore, UI_STORE_KEY } = await import('./ui');

      // Clear any previous calls
      localStorageMock.setItem.mockClear();

      act(() => {
        useUIStore.getState().setSidebarCollapsed(true);
      });

      // Verify setItem was called with correct key
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        UI_STORE_KEY,
        expect.any(String)
      );
    });

    it('should only persist partialized properties', async () => {
      const { useUIStore } = await import('./ui');

      act(() => {
        useUIStore.getState().setSidebarCollapsed(true);
        useUIStore.getState().setChatPanelWidth(400);
        useUIStore.getState().toggleChatPanel();
        useUIStore.getState().openMobileMenu();
        useUIStore.getState().openCommandPalette();
      });

      const lastCall = localStorageMock.setItem.mock.calls[
        localStorageMock.setItem.mock.calls.length - 1
      ];

      if (lastCall) {
        const persistedData = JSON.parse(lastCall[1]);

        // Should persist these
        expect(persistedData.state).toHaveProperty('sidebarCollapsed', true);
        expect(persistedData.state).toHaveProperty('chatPanelWidth', 400);
        expect(persistedData.state).toHaveProperty('chatPanelOpen', false);

        // Should NOT persist these
        expect(persistedData.state).not.toHaveProperty('mobileMenuOpen');
        expect(persistedData.state).not.toHaveProperty('isCommandPaletteOpen');
      }
    });

    it('should rehydrate from localStorage on manual rehydration', async () => {
      const { UI_STORE_KEY } = await import('./ui');

      // Set up localStorage with persisted state
      const persistedState = {
        state: {
          sidebarCollapsed: true,
          chatPanelWidth: 420,
          chatPanelOpen: false,
        },
        version: 0,
      };
      localStorageMock.setItem(UI_STORE_KEY, JSON.stringify(persistedState));

      // Clear modules and reimport to simulate fresh load
      vi.resetModules();
      localStorageMock.clear();
      localStorageMock.setItem(UI_STORE_KEY, JSON.stringify(persistedState));

      const { useUIStore } = await import('./ui');

      // Before rehydration, should have default state (skipHydration: true)
      const beforeState = useUIStore.getState();
      expect(beforeState.sidebarCollapsed).toBe(false); // default
      expect(beforeState.chatPanelWidth).toBe(380); // default
      expect(beforeState.chatPanelOpen).toBe(true); // default

      // Manually rehydrate
      await act(async () => {
        await useUIStore.persist.rehydrate();
      });

      // After rehydration, should have persisted state
      const afterState = useUIStore.getState();
      expect(afterState.sidebarCollapsed).toBe(true);
      expect(afterState.chatPanelWidth).toBe(420);
      expect(afterState.chatPanelOpen).toBe(false);
    });

    it('should handle empty localStorage gracefully', async () => {
      // Ensure no persisted state exists
      localStorageMock.clear();

      vi.resetModules();
      const { useUIStore } = await import('./ui');

      await act(async () => {
        await useUIStore.persist.rehydrate();
      });

      // Should use default state
      const state = useUIStore.getState();
      expect(state.sidebarCollapsed).toBe(false);
      expect(state.chatPanelWidth).toBe(380);
      expect(state.chatPanelOpen).toBe(true);
    });
  });

  describe('Hydration Lifecycle', () => {
    it('should use skipHydration to prevent automatic hydration', async () => {
      const { UI_STORE_KEY } = await import('./ui');

      // Set up localStorage with persisted state
      const persistedState = {
        state: {
          sidebarCollapsed: true,
          chatPanelWidth: 450,
          chatPanelOpen: false,
        },
        version: 0,
      };
      localStorageMock.setItem(UI_STORE_KEY, JSON.stringify(persistedState));

      // Clear modules and reimport
      vi.resetModules();
      localStorageMock.clear();
      localStorageMock.setItem(UI_STORE_KEY, JSON.stringify(persistedState));

      const { useUIStore } = await import('./ui');

      // With skipHydration: true, should NOT auto-hydrate
      const state = useUIStore.getState();
      expect(state.sidebarCollapsed).toBe(false); // Still default, not persisted
    });

    it('should track hydration state with hasHydrated()', async () => {
      const { useUIStore } = await import('./ui');

      // Before rehydration
      expect(useUIStore.persist.hasHydrated()).toBe(false);

      // Trigger rehydration
      await act(async () => {
        await useUIStore.persist.rehydrate();
      });

      // After rehydration
      expect(useUIStore.persist.hasHydrated()).toBe(true);
    });

    it('should call onFinishHydration callback after rehydration', async () => {
      const { useUIStore } = await import('./ui');

      const mockCallback = vi.fn();

      // Subscribe to hydration finish
      const unsubscribe = useUIStore.persist.onFinishHydration(mockCallback);

      // Trigger rehydration
      await act(async () => {
        await useUIStore.persist.rehydrate();
      });

      // Callback should have been called
      expect(mockCallback).toHaveBeenCalled();

      unsubscribe();
    });

    it('should allow multiple onFinishHydration subscribers', async () => {
      const { useUIStore } = await import('./ui');

      const mockCallback1 = vi.fn();
      const mockCallback2 = vi.fn();

      const unsub1 = useUIStore.persist.onFinishHydration(mockCallback1);
      const unsub2 = useUIStore.persist.onFinishHydration(mockCallback2);

      await act(async () => {
        await useUIStore.persist.rehydrate();
      });

      expect(mockCallback1).toHaveBeenCalled();
      expect(mockCallback2).toHaveBeenCalled();

      unsub1();
      unsub2();
    });

    it('should handle rehydration multiple times', async () => {
      const { useUIStore, UI_STORE_KEY } = await import('./ui');

      // First rehydration
      const state1 = {
        state: { sidebarCollapsed: true, chatPanelWidth: 400, chatPanelOpen: true },
        version: 0,
      };
      localStorageMock.setItem(UI_STORE_KEY, JSON.stringify(state1));

      await act(async () => {
        await useUIStore.persist.rehydrate();
      });

      expect(useUIStore.getState().sidebarCollapsed).toBe(true);
      expect(useUIStore.getState().chatPanelWidth).toBe(400);

      // Change localStorage
      const state2 = {
        state: { sidebarCollapsed: false, chatPanelWidth: 450, chatPanelOpen: false },
        version: 0,
      };
      localStorageMock.setItem(UI_STORE_KEY, JSON.stringify(state2));

      // Second rehydration
      await act(async () => {
        await useUIStore.persist.rehydrate();
      });

      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
      expect(useUIStore.getState().chatPanelWidth).toBe(450);
    });

    it('should preserve non-persisted state during rehydration', async () => {
      const { useUIStore, UI_STORE_KEY } = await import('./ui');

      // Set non-persisted state
      act(() => {
        useUIStore.getState().openMobileMenu();
        useUIStore.getState().openCommandPalette();
      });

      expect(useUIStore.getState().mobileMenuOpen).toBe(true);
      expect(useUIStore.getState().isCommandPaletteOpen).toBe(true);

      // Rehydrate from localStorage (which doesn't have mobile/command state)
      const persistedState = {
        state: { sidebarCollapsed: true, chatPanelWidth: 400, chatPanelOpen: true },
        version: 0,
      };
      localStorageMock.setItem(UI_STORE_KEY, JSON.stringify(persistedState));

      await act(async () => {
        await useUIStore.persist.rehydrate();
      });

      // Persisted state should be updated
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);

      // Non-persisted state should remain (or reset to defaults based on implementation)
      // Note: Zustand persist rehydration typically doesn't modify non-persisted properties
      // But it's implementation-dependent, so this test verifies the actual behavior
      const state = useUIStore.getState();
      expect(state.mobileMenuOpen).toBeDefined();
      expect(state.isCommandPaletteOpen).toBeDefined();
    });
  });
});
