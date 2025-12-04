/**
 * Dashboard Layout Component
 *
 * Three-panel responsive layout for the HYVVE dashboard:
 * - Header (fixed, 60px height)
 * - Sidebar (left, 64px collapsed / 256px expanded)
 * - Main content (center, flexible)
 * - Chat panel (right, 320-480px adjustable)
 *
 * Responsive breakpoints:
 * - Mobile (<640px): Single panel with overlays
 * - Tablet (640-1024px): Two panels
 * - Desktop (>1024px): Three panels
 *
 * State managed via Zustand store with localStorage persistence.
 *
 * Epic: 07 - UI Shell
 * Story: 07-1 - Create Dashboard Layout Component
 */

'use client';

import { ReactNode } from 'react';
import { Header } from '@/components/shell/Header';
import { Sidebar } from '@/components/shell/Sidebar';
import { ChatPanel } from '@/components/shell/ChatPanel';
import { CommandPalette } from '@/components/command';
import { KeyboardShortcuts } from '@/components/keyboard';
import { MobileDrawer, MobileBottomNav } from '@/components/mobile';
import { useUIStore } from '@/stores/ui';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarCollapsed, chatPanelOpen, chatPanelWidth } = useUIStore();

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      {/* Fixed Header - 60px height */}
      <Header />

      {/* Main content area - below header */}
      <div className="flex h-full w-full pt-[60px]">
        {/* Left Sidebar - collapsible */}
        <Sidebar />

        {/* Main Content Area - flexible width */}
        <main
          className={`
            flex-1 overflow-y-auto
            bg-[rgb(var(--color-bg-primary))]
            transition-all duration-300 ease-in-out
            ${sidebarCollapsed ? 'ml-16' : 'ml-64'}
            ${chatPanelOpen ? `mr-[${chatPanelWidth}px]` : 'mr-0'}
            min-w-[600px]

            /* Tablet: Reduce minimum width */
            lg:min-w-[400px]

            /* Mobile: Full width, no margins */
            sm:ml-0 sm:mr-0 sm:min-w-0
          `}
          style={{
            marginRight: chatPanelOpen ? `${chatPanelWidth}px` : '0',
          }}
        >
          <div className="p-8 sm:p-4">{children}</div>
        </main>

        {/* Right Chat Panel - collapsible and resizable */}
        <ChatPanel />
      </div>

      {/* Command Palette - Global keyboard shortcut (Cmd/Ctrl+K) */}
      <CommandPalette />

      {/* Global Keyboard Shortcuts - Handles Cmd+K, Cmd+B, Cmd+/, etc. */}
      <KeyboardShortcuts />

      {/* Mobile Navigation Components */}
      <MobileDrawer />
      <MobileBottomNav />
    </div>
  );
}
