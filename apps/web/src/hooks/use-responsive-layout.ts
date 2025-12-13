/**
 * useResponsiveLayout Hook
 *
 * Manages responsive layout behavior for medium-sized screens (1024-1280px).
 * Features:
 * - Breakpoint detection (mobile, tablet, medium, desktop, wide)
 * - Layout priority management (sidebar vs chat)
 * - Auto-collapse logic based on screen size and priority
 * - LocalStorage persistence for layout priority
 * - Debounced resize listener for performance
 *
 * Story 16-1: Implement Medium Screen Layout (1024-1280px)
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Breakpoint definitions
 */
const BREAKPOINTS = {
  mobile: 640,      // sm: 640px
  tablet: 768,      // md: 768px - Tablet range starts here
  tabletMax: 1024,  // lg: 1024px - Tablet range ends here
  medium: 1024,     // lg: 1024px
  mediumMax: 1280,  // xl: 1280px
  wide: 1536,       // 2xl: 1536px
} as const;

/**
 * Layout priority type
 */
export type LayoutPriority = 'sidebar' | 'chat';

/**
 * Breakpoint type
 */
export type Breakpoint = 'mobile' | 'tablet' | 'medium' | 'desktop' | 'wide';

/**
 * LocalStorage key for layout priority
 */
const LAYOUT_PRIORITY_KEY = 'hyvve-layout-priority';

/**
 * Get current breakpoint based on window width
 */
function getBreakpoint(width: number): Breakpoint {
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'mobile'; // Below 768px is mobile
  if (width < BREAKPOINTS.tabletMax) return 'tablet'; // 768-1024px is tablet
  if (width < BREAKPOINTS.mediumMax) return 'medium'; // 1024-1280px is medium
  if (width < BREAKPOINTS.wide) return 'desktop'; // 1280-1536px is desktop
  return 'wide'; // 1536px+ is wide
}

/**
 * Load layout priority from localStorage
 */
function loadLayoutPriority(): LayoutPriority {
  if (typeof window === 'undefined') return 'sidebar';

  try {
    const stored = localStorage.getItem(LAYOUT_PRIORITY_KEY);
    if (stored === 'sidebar' || stored === 'chat') {
      return stored;
    }
  } catch (error) {
    console.warn('Failed to load layout priority from localStorage:', error);
  }

  return 'sidebar'; // Default priority
}

/**
 * Save layout priority to localStorage
 */
function saveLayoutPriority(priority: LayoutPriority): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(LAYOUT_PRIORITY_KEY, priority);
  } catch (error) {
    console.warn('Failed to save layout priority to localStorage:', error);
  }
}

/**
 * Debounce utility
 */
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Hook interface
 */
export interface UseResponsiveLayout {
  /** Current breakpoint */
  breakpoint: Breakpoint;

  /** Is current screen in medium range (1024-1280px) */
  isMediumScreen: boolean;

  /** Is current screen in tablet range (768-1024px) */
  isTablet: boolean;

  /** Is current screen mobile (<768px) */
  isMobile: boolean;

  /** Is device using touch input (pointer: coarse) */
  isTouchDevice: boolean;

  /** Current layout priority (sidebar or chat) */
  layoutPriority: LayoutPriority;

  /** Set layout priority */
  setLayoutPriority: (priority: LayoutPriority) => void;

  /** Should auto-collapse sidebar (medium screen + chat priority) */
  shouldAutoCollapseSidebar: boolean;

  /** Should auto-collapse chat (medium screen + sidebar priority) */
  shouldAutoCollapseChat: boolean;

  /** Current window width (for debugging) */
  windowWidth: number;
}

/**
 * Custom hook for responsive layout management
 *
 * @returns Responsive layout state and actions
 */
export function useResponsiveLayout(): UseResponsiveLayout {
  // Initialize state
  const [windowWidth, setWindowWidth] = useState(() => {
    if (typeof window === 'undefined') return 1920;
    return window.innerWidth;
  });

  const [layoutPriority, setLayoutPriorityState] = useState<LayoutPriority>(() => {
    return loadLayoutPriority();
  });

  // Detect touch device using pointer: coarse media query
  const [isTouchDevice, setIsTouchDevice] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches;
  });

  // Calculate breakpoint flags
  const breakpoint = getBreakpoint(windowWidth);
  const isMediumScreen = breakpoint === 'medium';
  const isTablet = breakpoint === 'tablet';
  const isMobile = breakpoint === 'mobile';

  // Calculate auto-collapse flags
  const shouldAutoCollapseSidebar = isMediumScreen && layoutPriority === 'chat';
  const shouldAutoCollapseChat = isMediumScreen && layoutPriority === 'sidebar';

  /**
   * Set layout priority with localStorage persistence
   */
  const setLayoutPriority = useCallback((priority: LayoutPriority) => {
    setLayoutPriorityState(priority);
    saveLayoutPriority(priority);
  }, []);

  /**
   * Handle window resize with debouncing and touch detection
   */
  useEffect(() => {
    // Update width on mount
    setWindowWidth(window.innerWidth);

    // Update touch device detection on mount
    const touchMediaQuery = window.matchMedia('(pointer: coarse)');
    setIsTouchDevice(touchMediaQuery.matches);

    // Debounced resize handler
    const handleResize = debounce(() => {
      setWindowWidth(window.innerWidth);
    }, 150);

    // Touch device change handler
    const handleTouchChange = (e: MediaQueryListEvent) => {
      setIsTouchDevice(e.matches);
    };

    window.addEventListener('resize', handleResize);
    touchMediaQuery.addEventListener('change', handleTouchChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      touchMediaQuery.removeEventListener('change', handleTouchChange);
    };
  }, []);

  return {
    breakpoint,
    isMediumScreen,
    isTablet,
    isMobile,
    isTouchDevice,
    layoutPriority,
    setLayoutPriority,
    shouldAutoCollapseSidebar,
    shouldAutoCollapseChat,
    windowWidth,
  };
}
