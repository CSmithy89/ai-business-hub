/**
 * Platform Detection Hook
 *
 * Detects the user's operating system for platform-specific UI/UX.
 * Primary use case: showing correct keyboard shortcut modifiers
 * (⌘ for Mac, Ctrl for Windows/Linux).
 *
 * Epic: 07 - UI Shell
 * Technical Debt: Create usePlatform() hook for Mac/Windows detection
 */

'use client';

import { useState, useEffect } from 'react';

export type Platform = 'mac' | 'windows' | 'linux' | 'unknown';

interface PlatformInfo {
  /** Detected platform */
  platform: Platform;
  /** True if running on macOS */
  isMac: boolean;
  /** True if running on Windows */
  isWindows: boolean;
  /** True if running on Linux */
  isLinux: boolean;
  /** Primary modifier key symbol (⌘ for Mac, Ctrl for others) */
  modKey: string;
  /** Primary modifier key name ('Cmd' for Mac, 'Ctrl' for others) */
  modKeyName: string;
}

/**
 * Detects platform from navigator.userAgent
 */
function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') {
    return 'unknown';
  }

  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('mac')) {
    return 'mac';
  }
  if (userAgent.includes('win')) {
    return 'windows';
  }
  if (userAgent.includes('linux')) {
    return 'linux';
  }

  return 'unknown';
}

/**
 * Hook for detecting the user's operating system.
 *
 * @returns Platform information including modifier key symbols
 *
 * @example
 * ```tsx
 * const { isMac, modKey } = usePlatform();
 *
 * // Display: "⌘K" on Mac, "Ctrl+K" on Windows/Linux
 * <span>{modKey}+K</span>
 *
 * // Or for more control:
 * <span>{isMac ? '⌘' : 'Ctrl+'}K</span>
 * ```
 */
export function usePlatform(): PlatformInfo {
  const [platform, setPlatform] = useState<Platform>('unknown');

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  const isMac = platform === 'mac';
  const isWindows = platform === 'windows';
  const isLinux = platform === 'linux';

  return {
    platform,
    isMac,
    isWindows,
    isLinux,
    modKey: isMac ? '⌘' : 'Ctrl',
    modKeyName: isMac ? 'Cmd' : 'Ctrl',
  };
}

/**
 * Non-hook version for use outside React components.
 * Note: Returns 'unknown' during SSR.
 */
export function getPlatform(): Platform {
  return detectPlatform();
}

/**
 * Get modifier key symbol without using a hook.
 * Useful for static content or non-component code.
 */
export function getModifierKey(): { symbol: string; name: string } {
  const platform = detectPlatform();
  const isMac = platform === 'mac';
  return {
    symbol: isMac ? '⌘' : 'Ctrl',
    name: isMac ? 'Cmd' : 'Ctrl',
  };
}
