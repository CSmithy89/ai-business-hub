/**
 * UI State Store
 *
 * Manages global UI state for the dashboard layout including:
 * - Sidebar collapse/expand state
 * - Chat panel open/close and width state
 * - Mobile menu state
 *
 * State persists in localStorage via Zustand persist middleware
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
    }),
    {
      name: 'hyvve-ui-state',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        chatPanelWidth: state.chatPanelWidth,
        chatPanelOpen: state.chatPanelOpen,
      }),
    }
  )
);
