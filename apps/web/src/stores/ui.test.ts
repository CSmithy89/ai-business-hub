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
});
