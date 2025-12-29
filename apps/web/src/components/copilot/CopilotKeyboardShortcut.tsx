'use client';

/**
 * CopilotKeyboardShortcut Component
 *
 * Side-effect only component that handles keyboard shortcuts for the CopilotChat panel.
 * Listens for:
 * - Cmd+/ (Mac) or Ctrl+/ (Windows) to toggle the chat panel
 * - Escape key is handled by CopilotSidebar's hitEscapeToClose prop
 *
 * Note: This component is intentionally separate from KeyboardShortcuts.tsx to maintain
 * modularity with the CopilotKit integration. The existing Cmd+/ shortcut in
 * KeyboardShortcuts.tsx toggles the legacy ChatPanel - this component will work
 * alongside it until migration is complete.
 *
 * @see docs/modules/bm-dm/stories/dm-01-4-copilotkit-chat-integration.md
 * Epic: DM-01 | Story: DM-01.4
 */

import { useEffect } from 'react';
import { useCopilotChatState } from './use-copilot-chat-state';

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
      // Skip if focus is in an input field
      if (isInputFocused()) {
        return;
      }

      // Cmd+/ (Mac) or Ctrl+/ (Windows) to toggle chat
      const isMac =
        typeof navigator !== 'undefined' &&
        /Mac|iPhone|iPad|iPod/.test(navigator.platform);
      const modifier = isMac ? event.metaKey : event.ctrlKey;

      if (modifier && event.key === '/') {
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
