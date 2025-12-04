/**
 * useKeyboardShortcut Hook
 *
 * Reusable hook for registering keyboard shortcuts with support for:
 * - Modifier keys (meta, ctrl, shift, alt)
 * - Focus context checking (skip shortcuts in inputs)
 * - Automatic cleanup on unmount
 *
 * Usage:
 * ```tsx
 * useKeyboardShortcut('k', { meta: true }, () => {
 *   console.log('Cmd+K pressed');
 * });
 * ```
 *
 * Epic: 07 - UI Shell
 * Story: 07-8 - Implement Keyboard Shortcuts
 */

import { useEffect } from 'react';

interface KeyboardShortcutOptions {
  meta?: boolean; // Cmd on Mac, Ctrl on Windows/Linux
  ctrl?: boolean; // Ctrl key specifically
  shift?: boolean; // Shift key
  alt?: boolean; // Alt/Option key
  preventDefault?: boolean; // Prevent default browser behavior (default: true)
  skipInInputs?: boolean; // Skip if focus is in input/textarea (default: true)
}

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
 * Register a keyboard shortcut
 *
 * @param key - The key to listen for (e.g., 'k', 'Enter', 'Escape')
 * @param options - Modifier keys and behavior options
 * @param callback - Function to call when shortcut is triggered
 */
export function useKeyboardShortcut(
  key: string,
  options: KeyboardShortcutOptions,
  callback: () => void
) {
  useEffect(() => {
    const {
      meta = false,
      ctrl = false,
      shift = false,
      alt = false,
      preventDefault = true,
      skipInInputs = true,
    } = options;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if focus is in an input and skipInInputs is true
      if (skipInInputs && isInputFocused()) {
        return;
      }

      // Check if the pressed key matches
      const keyMatches =
        event.key.toLowerCase() === key.toLowerCase() ||
        event.code === key;

      if (!keyMatches) return;

      // Check modifier keys
      const metaMatches = meta ? event.metaKey || event.ctrlKey : !event.metaKey && !event.ctrlKey;
      const ctrlMatches = ctrl ? event.ctrlKey : !event.ctrlKey;
      const shiftMatches = shift ? event.shiftKey : !event.shiftKey;
      const altMatches = alt ? event.altKey : !event.altKey;

      // If meta is true, we accept either metaKey OR ctrlKey (cross-platform)
      const modifiersMatch = meta
        ? (event.metaKey || event.ctrlKey) && shiftMatches && altMatches
        : metaMatches && ctrlMatches && shiftMatches && altMatches;

      if (modifiersMatch) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, options, callback]);
}

/**
 * Detect if the current platform is Mac
 */
export function useIsMac(): boolean {
  if (typeof window === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

/**
 * Get the appropriate modifier key symbol for the current platform
 */
export function getModifierKeySymbol(): string {
  if (typeof window === 'undefined') return 'Ctrl';
  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  return isMac ? '⌘' : 'Ctrl';
}
