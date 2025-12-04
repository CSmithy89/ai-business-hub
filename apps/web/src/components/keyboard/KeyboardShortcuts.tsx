/**
 * Global Keyboard Shortcuts Component
 *
 * Manages all keyboard shortcuts across the HYVVE dashboard.
 * Shortcuts are triggered via a single global event listener.
 *
 * Features:
 * - Platform detection (Mac vs Windows/Linux)
 * - Focus context checking (skip shortcuts in input fields)
 * - Help overlay (? key)
 * - Navigation shortcuts (Cmd+D, Cmd+,)
 * - UI control shortcuts (Cmd+K, Cmd+B, Cmd+/)
 *
 * Epic: 07 - UI Shell
 * Story: 07-8 - Implement Keyboard Shortcuts
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyboardHelpOverlay } from './KeyboardHelpOverlay';
import { useUIStore } from '@/stores/ui';

/**
 * Check if the current focus is in an input-like element
 */
function isInputFocused(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  const tagName = activeElement.tagName.toLowerCase();
  const isContentEditable =
    activeElement.getAttribute('contenteditable') === 'true';

  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    isContentEditable
  );
}

/**
 * Detect if the current platform is Mac
 */
function isMacPlatform(): boolean {
  if (typeof window === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

/**
 * Global Keyboard Shortcuts Component
 *
 * Add this component to the dashboard layout to enable keyboard shortcuts
 */
export function KeyboardShortcuts() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);
  const [isMac, setIsMac] = useState(false);

  // Use ref to access showHelp in event handler without re-registering listener
  const showHelpRef = useRef(showHelp);
  showHelpRef.current = showHelp;

  // Detect platform on mount
  useEffect(() => {
    setIsMac(isMacPlatform());
  }, []);

  // Memoized handler to avoid recreating on every render
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if focus is in an input field
      if (isInputFocused()) {
        return;
      }

      const isModifier = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      // Help overlay (? - Shift+/ on most keyboards)
      if ((key === '?' || (key === '/' && event.shiftKey)) && !isModifier) {
        event.preventDefault();
        setShowHelp(true);
        return;
      }

      // Close help overlay (Esc) - use ref to get current value
      if (key === 'escape' && showHelpRef.current) {
        event.preventDefault();
        setShowHelp(false);
        return;
      }

      // Only handle shortcuts with modifier key
      if (!isModifier) return;

      // Cmd/Ctrl + K: Command Palette
      if (key === 'k') {
        event.preventDefault();
        useUIStore.getState().toggleCommandPalette();
        return;
      }

      // Cmd/Ctrl + B: Toggle Sidebar
      if (key === 'b') {
        event.preventDefault();
        useUIStore.getState().toggleSidebar();
        return;
      }

      // Cmd/Ctrl + /: Toggle Chat Panel
      if (key === '/') {
        event.preventDefault();
        useUIStore.getState().toggleChatPanel();
        return;
      }

      // Cmd/Ctrl + D: Go to Dashboard
      if (key === 'd') {
        event.preventDefault();
        router.push('/dashboard');
        return;
      }

      // Cmd/Ctrl + ,: Go to Settings
      if (key === ',') {
        event.preventDefault();
        router.push('/settings');
        return;
      }
    },
    [router]
  );

  // Register event listener once (router is stable)
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <KeyboardHelpOverlay
      open={showHelp}
      onOpenChange={setShowHelp}
      isMac={isMac}
    />
  );
}
