/**
 * UI State Store
 *
 * Manages global UI state for the dashboard layout including:
 * - Sidebar collapse/expand state
 * - Chat panel open/close and width state
 * - Mobile menu state
 *
 * State persists in localStorage via Zustand persist middleware.
 *
 * SSR/Hydration: Uses skipHydration to prevent hydration mismatches.
 * Components should use useUIStoreHydrated() to check if store is ready.
 */

import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * LocalStorage key for persisting UI state.
 * Changing this will reset all users' UI preferences.
 */
export const UI_STORE_KEY = 'hyvve-ui-state' as const;

interface UIState {
  // Sidebar state
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Chat panel state
  chatPanelOpen: boolean;
  chatPanelWidth: number; // 320-480px
  toggleChatPanel: () => void;
  setChatPanelWidth: (width: number) => void;

  // Mobile state
  mobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;

  // Command palette state
  isCommandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Default state
      sidebarCollapsed: false,
      chatPanelOpen: true,
      chatPanelWidth: 380,
      mobileMenuOpen: false,

      // Sidebar actions
      toggleSidebar: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // Chat panel actions
      toggleChatPanel: () =>
        set((state) => ({
          chatPanelOpen: !state.chatPanelOpen,
        })),
      setChatPanelWidth: (width) =>
        set({
          // Clamp between 320px and 480px
          chatPanelWidth: Math.max(320, Math.min(480, width)),
        }),

      // Mobile actions
      toggleMobileMenu: () =>
        set((state) => ({
          mobileMenuOpen: !state.mobileMenuOpen,
        })),
      openMobileMenu: () => set({ mobileMenuOpen: true }),
      closeMobileMenu: () => set({ mobileMenuOpen: false }),

      // Command palette actions
      isCommandPaletteOpen: false,
      openCommandPalette: () => set({ isCommandPaletteOpen: true }),
      closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
      toggleCommandPalette: () =>
        set((state) => ({
          isCommandPaletteOpen: !state.isCommandPaletteOpen,
        })),
    }),
    {
      name: UI_STORE_KEY,
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        chatPanelWidth: state.chatPanelWidth,
        chatPanelOpen: state.chatPanelOpen,
      }),
      // Skip automatic hydration to prevent SSR mismatches
      // Call useUIStore.persist.rehydrate() manually after mount
      skipHydration: true,
    }
  )
);

/**
 * Hook to check if the UI store has been hydrated from localStorage.
 * Use this to prevent hydration mismatches with persisted state.
 *
 * @example
 * ```tsx
 * const isHydrated = useUIStoreHydrated();
 * const { sidebarCollapsed } = useUIStore();
 *
 * // Use default until hydrated to prevent mismatch
 * const actualCollapsed = isHydrated ? sidebarCollapsed : false;
 * ```
 */
export function useUIStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Rehydrate the store on mount
    useUIStore.persist.rehydrate();

    // Mark as hydrated after rehydration completes
    const unsubFinishHydration = useUIStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // Check if already hydrated (in case rehydrate was sync)
    if (useUIStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return () => {
      unsubFinishHydration();
    };
  }, []);

  return hydrated;
}
