/**
 * Dashboard Layout Component
 *
 * Three-panel responsive layout for the HYVVE dashboard:
 * - Header (fixed, 60px height)
 * - Sidebar (left, 64px collapsed / 256px expanded)
 * - Main content (center, flexible)
 * - Chat panel (right/bottom/floating/collapsed)
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
 * Story: 15-12 - Implement Chat Panel Position Options
 */

'use client';

import { ReactNode, useState } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/shell/Header';
import { Sidebar } from '@/components/shell/Sidebar';
import { MobileSidebar, MobileSidebarTrigger } from '@/components/layout/MobileSidebar';
import { ChatBottomSheet, ChatBottomSheetTrigger } from '@/components/layout/ChatBottomSheet';
import { CommandPalette } from '@/components/command';
import { KeyboardShortcuts } from '@/components/keyboard';
import { MobileDrawer, MobileBottomNav, ChatFullScreen, ChatFullScreenFAB } from '@/components/mobile';
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
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { DemoModeBanner } from '@/components/demo-mode-banner';
import { DashboardSlots } from '@/components/slots';

// Lazy load ChatPanel to reduce initial bundle size (~75KB gzipped: react-markdown, remark-gfm, dompurify)
const ChatPanel = dynamic(
  () => import('@/components/shell/ChatPanel').then((mod) => mod.ChatPanel),
  {
    ssr: false,
    loading: () => null, // No loading indicator - panel appears when ready
  }
);

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarCollapsed, chatPanelOpen, chatPanelWidth, chatPanelHeight, chatPanelPosition } = useUIStore();

  // Responsive layout hook for medium screen and tablet behavior (Story 16.1, 16.2)
  const {
    shouldAutoCollapseSidebar,
    shouldAutoCollapseChat,
    isTablet,
    isMobile,
  } = useResponsiveLayout();

  // Tablet-specific drawer states
  const [tabletSidebarOpen, setTabletSidebarOpen] = useState(false);
  const [tabletChatOpen, setTabletChatOpen] = useState(false);

  // Mobile-specific states
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  // Determine if sidebar should be collapsed based on responsive rules
  // Priority: user manual collapse > auto-collapse for medium screen
  const effectiveSidebarCollapsed = sidebarCollapsed || shouldAutoCollapseSidebar;

  // Determine if chat should be hidden based on responsive rules
  // At medium screen with sidebar priority, auto-collapse chat
  const effectiveChatHidden = shouldAutoCollapseChat || chatPanelPosition === 'collapsed';

  // Calculate main content margin based on chat panel position
  // Uses isMobile from responsive hook (hydration-safe) instead of direct window check
  const getMainContentMarginRight = () => {
    // On mobile screens, return 0 to let CSS handle responsive margins
    if (isMobile) return 0;

    // If chat is hidden by responsive rules or collapsed, no margin
    if (effectiveChatHidden) return 0;

    if (!chatPanelOpen) return 0;
    if (chatPanelPosition === 'right') return chatPanelWidth ?? LAYOUT.CHAT_DEFAULT_WIDTH;
    return 0; // No margin for bottom, floating, or collapsed
  };

  // Calculate main content margin bottom for bottom panel
  // Uses isMobile from responsive hook (hydration-safe) instead of direct window check
  const getMainContentMarginBottom = () => {
    // On mobile screens, return 0 to let CSS handle responsive margins
    if (isMobile) return 0;

    // If chat is hidden by responsive rules, no margin
    if (effectiveChatHidden) return 0;

    if (!chatPanelOpen || chatPanelPosition !== 'bottom') return 0;
    return chatPanelHeight ?? 250;
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      {/* Skip link for keyboard accessibility - Tab to reveal */}
      <SkipLink targetId="main-content" />

      {/* Demo Mode Banner - Story 16.8 */}
      <DemoModeBanner />

      {/* Fixed Header - 60px height */}
      <ErrorBoundary fallback={<HeaderErrorFallback />}>
        <Header>
          {/* Tablet: Hamburger menu trigger in header */}
          {isTablet && (
            <MobileSidebarTrigger onClick={() => setTabletSidebarOpen(true)} />
          )}
        </Header>
      </ErrorBoundary>

      {/* Main content area - below header */}
      <div
        className="flex h-full w-full"
        style={{ paddingTop: LAYOUT.HEADER_HEIGHT }}
      >
        {/* Desktop/Medium: Left Sidebar - collapsible */}
        {!isTablet && !isMobile && (
          <ErrorBoundary fallback={<SidebarErrorFallback />}>
            <Sidebar isAutoCollapsed={shouldAutoCollapseSidebar} />
          </ErrorBoundary>
        )}

        {/* Tablet: Mobile Sidebar Drawer */}
        {isTablet && (
          <MobileSidebar
            open={tabletSidebarOpen}
            onOpenChange={setTabletSidebarOpen}
          />
        )}

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
            ${!isTablet && !isMobile ? (effectiveSidebarCollapsed ? 'ml-16' : 'ml-64') : 'ml-0'}
            min-w-0
            md:min-w-[400px]
            xl:min-w-[600px]
            max-sm:ml-0 max-sm:mr-0
          `}
          style={{
            marginRight: isTablet ? 0 : getMainContentMarginRight(),
            marginBottom: isTablet ? 0 : getMainContentMarginBottom(),
          }}
        >
          <ErrorBoundary fallback={<MainContentErrorFallback />}>
            <div className="p-8 sm:p-4">{children}</div>
          </ErrorBoundary>
        </main>

        {/* Slot System - Registers widget tool handler with CopilotKit */}
        <DashboardSlots />

        {/* Desktop/Medium: Right Chat Panel - collapsible and resizable */}
        {!isTablet && !isMobile && (
          <ErrorBoundary fallback={<ChatPanelErrorFallback />}>
            <ChatPanel />
          </ErrorBoundary>
        )}

        {/* Tablet: Chat Bottom Sheet */}
        {isTablet && (
          <>
            <ChatBottomSheet
              open={tabletChatOpen}
              onOpenChange={setTabletChatOpen}
            />
            <ChatBottomSheetTrigger
              onClick={() => setTabletChatOpen(true)}
              unreadCount={2}
            />
          </>
        )}

        {/* Mobile: Chat Full Screen */}
        {isMobile && (
          <>
            <ChatFullScreen
              open={mobileChatOpen}
              onOpenChange={setMobileChatOpen}
            />
            <ChatFullScreenFAB
              onClick={() => setMobileChatOpen(true)}
              unreadCount={0}
            />
          </>
        )}
      </div>

      {/* Command Palette - Global keyboard shortcut (Cmd/Ctrl+K) */}
      <CommandPalette />

      {/* Global Keyboard Shortcuts - Handles Cmd+K, Cmd+B, Cmd+/, etc. */}
      <KeyboardShortcuts />

      {/* Mobile Navigation Components - Only on mobile (<768px) */}
      {isMobile && (
        <>
          <MobileDrawer />
          <MobileBottomNav />
        </>
      )}
    </div>
  );
}
