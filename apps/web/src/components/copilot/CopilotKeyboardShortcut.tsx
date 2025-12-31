'use client';

/**
 * CopilotKeyboardShortcut Component
 *
 * Side-effect only component that handles keyboard shortcuts for the CopilotChat panel.
 * Listens for:
 * - Cmd+/ (Mac) or Ctrl+/ (Windows) to toggle the chat panel
 * - Escape key is handled by CopilotSidebar's hitEscapeToClose prop
 *
 * This is the PRIMARY keyboard shortcut handler for chat functionality.
 * The legacy KeyboardShortcuts.tsx defers to this component for Cmd+/ handling
 * to avoid conflicts. See DM-07.5 for the unification.
 *
 * Uses DM_CONSTANTS.CHAT.KEYBOARD_SHORTCUT for the shortcut key.
 *
 * @see docs/modules/bm-dm/stories/dm-01-4-copilotkit-chat-integration.md
 * @see docs/modules/bm-dm/stories/dm-07-5-unify-keyboard-shortcuts.md
 * Epic: DM-01 | Story: DM-01.4, DM-07.5
 */

import { useEffect } from 'react';
import { useCopilotChatState } from './use-copilot-chat-state';
import { DM_CONSTANTS } from '@/lib/dm-constants';

/**
 * Check if the current focus is in an input-like element
 * Matches the pattern in KeyboardShortcuts.tsx for consistency
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

export function CopilotKeyboardShortcut() {
  const toggle = useCopilotChatState((state) => state.toggle);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore auto-repeated keydown events to avoid multiple toggles
      if (event.repeat) {
        return;
      }

      // Skip if focus is in an input field
      if (isInputFocused()) {
        return;
      }

      // Toggle chat using configured shortcut from DM_CONSTANTS
      // Cmd+/ (Mac) or Ctrl+/ (Windows)
      const isMac =
        typeof navigator !== 'undefined' &&
        /Mac|iPhone|iPad|iPod/.test(navigator.platform);

      // Check modifier key based on platform and DM_CONSTANTS.CHAT.KEYBOARD_MODIFIER
      const expectedModifier = DM_CONSTANTS.CHAT.KEYBOARD_MODIFIER;
      const hasModifier = expectedModifier === 'meta'
        ? (isMac ? event.metaKey : event.ctrlKey) // 'meta' means Cmd on Mac, Ctrl on Windows
        : event.ctrlKey; // Fallback to Ctrl if not 'meta'

      if (hasModifier && event.key === DM_CONSTANTS.CHAT.KEYBOARD_SHORTCUT) {
        event.preventDefault();
        toggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  // This component renders nothing - it's purely for side effects
  return null;
}
