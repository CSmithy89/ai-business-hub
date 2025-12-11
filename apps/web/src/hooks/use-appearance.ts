/**
 * useAppearance Hook
 *
 * Custom hook for managing appearance/theme settings.
 * Supports light, dark, and system theme modes.
 * Integrates with next-themes and persists preferences.
 *
 * Story 15.26: Implement Appearance Settings Page
 */

'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState, useCallback } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Sidebar density options
 */
export type SidebarDensity = 'comfortable' | 'compact';

/**
 * Font size options
 */
export type FontSize = 'small' | 'medium' | 'large';

/**
 * Base font sizes in pixels
 */
export const FONT_SIZE_VALUES: Record<FontSize, number> = {
  small: 14,
  medium: 16,
  large: 18,
};

/**
 * Appearance preferences store
 */
interface AppearanceState {
  sidebarDensity: SidebarDensity;
  fontSize: FontSize;
  setSidebarDensity: (density: SidebarDensity) => void;
  setFontSize: (size: FontSize) => void;
  resetToDefaults: () => void;
}

/**
 * Default appearance settings
 */
const DEFAULT_SETTINGS = {
  sidebarDensity: 'comfortable' as SidebarDensity,
  fontSize: 'medium' as FontSize,
};

/**
 * Zustand store for appearance settings with localStorage persistence
 */
export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      setSidebarDensity: (density) => set({ sidebarDensity: density }),
      setFontSize: (size) => set({ fontSize: size }),
      resetToDefaults: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'hyvve-appearance-settings',
    }
  )
);

/**
 * Hook for managing appearance settings
 */
export function useAppearance() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();
  const { sidebarDensity, fontSize, setSidebarDensity, setFontSize, resetToDefaults } =
    useAppearanceStore();
  const [mounted, setMounted] = useState(false);

  // Wait for mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply font size to document root
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.style.fontSize = `${FONT_SIZE_VALUES[fontSize]}px`;
  }, [fontSize, mounted]);

  // Apply sidebar density class to document
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.remove('density-comfortable', 'density-compact');
    document.documentElement.classList.add(`density-${sidebarDensity}`);
  }, [sidebarDensity, mounted]);

  /**
   * Reset all appearance settings to defaults
   */
  const handleResetToDefaults = useCallback(() => {
    resetToDefaults();
    setTheme('light');
  }, [resetToDefaults, setTheme]);

  return {
    // Theme
    theme: mounted ? theme : 'light',
    setTheme,
    resolvedTheme: mounted ? resolvedTheme : 'light',
    systemTheme,
    isSystemTheme: theme === 'system',

    // Density
    sidebarDensity,
    setSidebarDensity,

    // Font size
    fontSize,
    setFontSize,
    fontSizePx: FONT_SIZE_VALUES[fontSize],

    // State
    mounted,

    // Actions
    resetToDefaults: handleResetToDefaults,
  };
}
