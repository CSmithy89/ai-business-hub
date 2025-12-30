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
 * - Vim-style sequences (g then d, g then a, etc.)
 *
 * Epic: 07 - UI Shell
 * Story: 07-8 - Implement Keyboard Shortcuts
 * Story: 16-16 - Comprehensive Keyboard Shortcuts
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyboardHelpOverlay } from './KeyboardHelpOverlay';
import { useUIStore } from '@/stores/ui';

// Sequence timeout in ms (how long to wait for next key in sequence)
const SEQUENCE_TIMEOUT = 500;

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

  // Track pending key sequence (for vim-style g then x shortcuts)
  const pendingKeyRef = useRef<string | null>(null);
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use ref to access showHelp in event handler without re-registering listener
  const showHelpRef = useRef(showHelp);
  showHelpRef.current = showHelp;

  // Clear pending sequence
  const clearPendingSequence = useCallback(() => {
    pendingKeyRef.current = null;
    if (sequenceTimeoutRef.current) {
      clearTimeout(sequenceTimeoutRef.current);
      sequenceTimeoutRef.current = null;
    }
  }, []);

  // Detect platform on mount
  useEffect(() => {
    setIsMac(isMacPlatform());
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
    };
  }, []);

  // Memoized handler to avoid recreating on every render
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if focus is in an input field
      if (isInputFocused()) {
        clearPendingSequence();
        return;
      }

      const isModifier = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      // Handle sequence shortcuts (g then x)
      if (pendingKeyRef.current === 'g' && !isModifier) {
        event.preventDefault();
        clearPendingSequence();

        switch (key) {
          case 'd': // g then d: Dashboard
            router.push('/dashboard');
            return;
          case 'a': // g then a: Approvals
            router.push('/approvals');
            return;
          case 'b': // g then b: Businesses
            router.push('/businesses');
            return;
          case 's': // g then s: Settings
            router.push('/settings');
            return;
          case 'n': // g then n: Agents
            router.push('/agents');
            return;
        }
        return;
      }

      // Start 'g' sequence (for vim-style navigation)
      if (key === 'g' && !isModifier) {
        event.preventDefault();
        // Clear any existing timeout before starting new sequence
        if (sequenceTimeoutRef.current) {
          clearTimeout(sequenceTimeoutRef.current);
        }
        pendingKeyRef.current = 'g';
        sequenceTimeoutRef.current = setTimeout(() => {
          pendingKeyRef.current = null;
        }, SEQUENCE_TIMEOUT);
        return;
      }

      // Help overlay (? - Shift+/ on most keyboards)
      if ((key === '?' || (key === '/' && event.shiftKey)) && !isModifier) {
        event.preventDefault();
        setShowHelp(true);
        return;
      }

      // Focus chat with / (without modifier)
      if (key === '/' && !isModifier && !event.shiftKey) {
        event.preventDefault();
        useUIStore.getState().expandChatPanel();
        // Focus the chat input after a short delay to allow panel to open
        setTimeout(() => {
          const chatInput = document.querySelector('[data-chat-input]') as HTMLElement;
          chatInput?.focus();
        }, 100);
        return;
      }

      // Close help overlay (Esc) - use ref to get current value
      if (key === 'escape' && showHelpRef.current) {
        event.preventDefault();
        setShowHelp(false);
        return;
      }

      // Only handle shortcuts with modifier key from here
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
      // NOTE: This is now handled by CopilotKeyboardShortcut to avoid conflicts
      // between legacy ChatPanel and CopilotChat. See DM-07.5 for details.
      // The CopilotChat is the primary chat interface going forward.

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
    [router, clearPendingSequence]
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
