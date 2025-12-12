/**
 * UI State Store
 *
 * Manages global UI state for the dashboard layout including:
 * - Sidebar collapse/expand state
 * - Chat panel open/close, width, and position state
 * - Mobile menu state
 *
 * State persists in localStorage via Zustand persist middleware.
 *
 * SSR/Hydration: Uses skipHydration to prevent hydration mismatches.
 * Components should use useUIStoreHydrated() to check if store is ready.
 *
 * Story 15.12: Added chat panel position options
 */

import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * LocalStorage key for persisting UI state.
 * Changing this will reset all users' UI preferences.
 */
export const UI_STORE_KEY = 'hyvve-ui-state' as const;

/**
 * Chat panel position options
 * Story 15.12: Implement Chat Panel Position Options
 */
export type ChatPanelPosition = 'right' | 'bottom' | 'floating' | 'collapsed';

/**
 * Floating panel coordinates for drag positioning
 */
export interface FloatingPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  isPinned: boolean;
}

interface UIState {
  // Sidebar state
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Chat panel state
  chatPanelOpen: boolean;
  chatPanelWidth: number; // 300-600px for right panel
  chatPanelHeight: number; // 150-400px for bottom panel
  chatPanelPosition: ChatPanelPosition;
  chatPanelPreviousPosition: ChatPanelPosition; // For restoring from collapsed
  floatingPosition: FloatingPosition;
  toggleChatPanel: () => void;
  setChatPanelWidth: (width: number) => void;
  setChatPanelHeight: (height: number) => void;
  setChatPanelPosition: (position: ChatPanelPosition) => void;
  setFloatingPosition: (position: Partial<FloatingPosition>) => void;
  collapseChatPanel: () => void;
  expandChatPanel: () => void;

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

/**
 * Default floating position for the chat panel
 */
const DEFAULT_FLOATING_POSITION: FloatingPosition = {
  x: 100,
  y: 100,
  width: 400,
  height: 500,
  isPinned: false,
};

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Default state
      sidebarCollapsed: false,
      chatPanelOpen: true,
      chatPanelWidth: 380,
      chatPanelHeight: 250,
      chatPanelPosition: 'right' as ChatPanelPosition,
      chatPanelPreviousPosition: 'right' as ChatPanelPosition,
      floatingPosition: DEFAULT_FLOATING_POSITION,
      mobileMenuOpen: false,

      // Sidebar actions
      toggleSidebar: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // Chat panel actions
      toggleChatPanel: () => {
        const state = get();
        if (state.chatPanelPosition === 'collapsed') {
          // Restore to previous position
          set({
            chatPanelPosition: state.chatPanelPreviousPosition,
            chatPanelOpen: true,
          });
        } else {
          // Collapse
          set({
            chatPanelPreviousPosition: state.chatPanelPosition,
            chatPanelPosition: 'collapsed',
            chatPanelOpen: false,
          });
        }
      },
      setChatPanelWidth: (width) =>
        set({
          // Clamp between 300px and 600px
          chatPanelWidth: Math.max(300, Math.min(600, width)),
        }),
      setChatPanelHeight: (height) =>
        set({
          // Clamp between 150px and 400px
          chatPanelHeight: Math.max(150, Math.min(400, height)),
        }),
      setChatPanelPosition: (position) => {
        const state = get();
        if (position === 'collapsed') {
          set({
            chatPanelPreviousPosition: state.chatPanelPosition !== 'collapsed'
              ? state.chatPanelPosition
              : state.chatPanelPreviousPosition,
            chatPanelPosition: 'collapsed',
            chatPanelOpen: false,
          });
        } else {
          set({
            chatPanelPosition: position,
            chatPanelOpen: true,
          });
        }
      },
      setFloatingPosition: (position) =>
        set((state) => ({
          floatingPosition: {
            ...state.floatingPosition,
            ...position,
            // Clamp minimum sizes
            width: Math.max(300, position.width ?? state.floatingPosition.width),
            height: Math.max(400, position.height ?? state.floatingPosition.height),
          },
        })),
      collapseChatPanel: () => {
        const state = get();
        if (state.chatPanelPosition !== 'collapsed') {
          set({
            chatPanelPreviousPosition: state.chatPanelPosition,
            chatPanelPosition: 'collapsed',
            chatPanelOpen: false,
          });
        }
      },
      expandChatPanel: () => {
        const state = get();
        set({
          chatPanelPosition: state.chatPanelPreviousPosition || 'right',
          chatPanelOpen: true,
        });
      },

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
        chatPanelHeight: state.chatPanelHeight,
        chatPanelOpen: state.chatPanelOpen,
        chatPanelPosition: state.chatPanelPosition,
        chatPanelPreviousPosition: state.chatPanelPreviousPosition,
        floatingPosition: state.floatingPosition,
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
