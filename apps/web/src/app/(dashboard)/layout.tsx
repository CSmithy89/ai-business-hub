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
import {
  ErrorBoundary,
  HeaderErrorFallback,
  SidebarErrorFallback,
  ChatPanelErrorFallback,
  MainContentErrorFallback,
} from '@/components/ui/error-boundary';
import { useUIStore } from '@/stores/ui';
import { LAYOUT } from '@/lib/layout-constants';
import { SkipLink } from '@/components/ui/skip-link';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarCollapsed, chatPanelOpen, chatPanelWidth } = useUIStore();

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      {/* Skip link for keyboard accessibility - Tab to reveal */}
      <SkipLink targetId="main-content" />

      {/* Fixed Header - 60px height */}
      <ErrorBoundary fallback={<HeaderErrorFallback />}>
        <Header />
      </ErrorBoundary>

      {/* Main content area - below header */}
      <div
        className="flex h-full w-full"
        style={{ paddingTop: LAYOUT.HEADER_HEIGHT }}
      >
        {/* Left Sidebar - collapsible */}
        <ErrorBoundary fallback={<SidebarErrorFallback />}>
          <Sidebar />
        </ErrorBoundary>

        {/*
          Main Content Area - flexible width
          Layout constants: See @/lib/layout-constants.ts
          - SIDEBAR_COLLAPSED_WIDTH: 64px (ml-16)
          - SIDEBAR_EXPANDED_WIDTH: 256px (ml-64)

          Responsive breakpoints (mobile-first):
          - Base/Mobile (<640px): min-w-0, no sidebar margins
          - Tablet (≥768px): md:min-w-[400px]
          - Desktop (≥1280px): xl:min-w-[600px]
        */}
        <main
          id="main-content"
          className={`
            flex-1 overflow-y-auto
            bg-[rgb(var(--color-bg-primary))]
            transition-all duration-300 ease-in-out
            ${sidebarCollapsed ? 'ml-16' : 'ml-64'}
            min-w-0
            md:min-w-[400px]
            xl:min-w-[600px]
            max-sm:ml-0 max-sm:mr-0
          `}
          style={{
            marginRight: chatPanelOpen
              ? (chatPanelWidth ?? LAYOUT.CHAT_DEFAULT_WIDTH)
              : 0,
          }}
        >
          <ErrorBoundary fallback={<MainContentErrorFallback />}>
            <div className="p-8 sm:p-4">{children}</div>
          </ErrorBoundary>
        </main>

        {/* Right Chat Panel - collapsible and resizable */}
        <ErrorBoundary fallback={<ChatPanelErrorFallback />}>
          <ChatPanel />
        </ErrorBoundary>
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
