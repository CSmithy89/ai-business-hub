/**
 * useChatPosition Hook
 *
 * Custom hook for managing chat panel position state and responsive behavior.
 * Features:
 * - Position switching (right, bottom, floating, collapsed)
 * - Responsive auto-collapse on small screens
 * - Keyboard shortcut support (Ctrl+Shift+C)
 * - Mobile full-screen modal mode
 *
 * Story 15.12: Implement Chat Panel Position Options
 */

import { useEffect, useCallback } from 'react';
import { useUIStore, type ChatPanelPosition } from '@/stores/ui';

/**
 * Breakpoints for responsive behavior
 */
const BREAKPOINTS = {
  mobile: 768, // Full-screen modal mode
  tablet: 1024, // Auto-collapse
};

/**
 * Hook for managing chat panel position
 *
 * @returns Object containing position state and actions
 */
export function useChatPosition() {
  const {
    chatPanelPosition,
    chatPanelPreviousPosition,
    chatPanelWidth,
    chatPanelHeight,
    floatingPosition,
    setChatPanelPosition,
    setChatPanelWidth,
    setChatPanelHeight,
    setFloatingPosition,
    toggleChatPanel,
    collapseChatPanel,
    expandChatPanel,
  } = useUIStore();

  /**
   * Check if we're on mobile (< 768px)
   */
  const isMobile = typeof window !== 'undefined' && window.innerWidth < BREAKPOINTS.mobile;

  /**
   * Check if we should auto-collapse (< 1024px)
   */
  const shouldAutoCollapse = typeof window !== 'undefined' && window.innerWidth < BREAKPOINTS.tablet;

  /**
   * Cycle through positions: right -> bottom -> floating -> collapsed -> right
   */
  const cyclePosition = useCallback(() => {
    const positions: ChatPanelPosition[] = ['right', 'bottom', 'floating', 'collapsed'];
    const currentIndex = positions.indexOf(chatPanelPosition);
    const nextIndex = (currentIndex + 1) % positions.length;
    setChatPanelPosition(positions[nextIndex]);
  }, [chatPanelPosition, setChatPanelPosition]);

  /**
   * Handle keyboard shortcut (Ctrl+Shift+C)
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+C to toggle collapse
      if (event.ctrlKey && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        toggleChatPanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleChatPanel]);

  /**
   * Auto-collapse on small screens
   */
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      // Auto-collapse on screens < 1024px
      if (width < BREAKPOINTS.tablet && chatPanelPosition !== 'collapsed') {
        collapseChatPanel();
      }
    };

    // Initial check
    if (shouldAutoCollapse && chatPanelPosition !== 'collapsed') {
      collapseChatPanel();
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [chatPanelPosition, collapseChatPanel, shouldAutoCollapse]);

  return {
    // State
    position: chatPanelPosition,
    previousPosition: chatPanelPreviousPosition,
    width: chatPanelWidth,
    height: chatPanelHeight,
    floatingPosition,

    // Computed
    isCollapsed: chatPanelPosition === 'collapsed',
    isFloating: chatPanelPosition === 'floating',
    isBottom: chatPanelPosition === 'bottom',
    isRight: chatPanelPosition === 'right',
    isMobile,
    shouldAutoCollapse,

    // Actions
    setPosition: setChatPanelPosition,
    setWidth: setChatPanelWidth,
    setHeight: setChatPanelHeight,
    setFloatingPosition,
    toggle: toggleChatPanel,
    collapse: collapseChatPanel,
    expand: expandChatPanel,
    cycle: cyclePosition,
  };
}
