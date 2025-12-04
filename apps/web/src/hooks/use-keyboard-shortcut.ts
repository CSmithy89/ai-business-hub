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

import { useEffect, useRef } from 'react';

interface KeyboardShortcutOptions {
  /** Accept Cmd (Mac) or Ctrl (Windows/Linux) - standard cross-platform modifier */
  meta?: boolean;
  /** Shift key */
  shift?: boolean;
  /** Alt/Option key */
  alt?: boolean;
  /** Prevent default browser behavior (default: true) */
  preventDefault?: boolean;
  /** Skip if focus is in input/textarea (default: true) */
  skipInInputs?: boolean;
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
 * @param options - Modifier keys and behavior options (callers don't need to memoize)
 * @param callback - Function to call when shortcut is triggered (callers don't need to memoize)
 */
export function useKeyboardShortcut(
  key: string,
  options: KeyboardShortcutOptions,
  callback: () => void
) {
  // Use ref to store callback to avoid re-registering listener on every render
  // This allows callers to pass inline functions without memoizing
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // Destructure options for stable dependency array
  // This prevents re-registration when callers pass inline options objects
  const {
    meta = false,
    shift = false,
    alt = false,
    preventDefault = true,
    skipInInputs = true,
  } = options;

  useEffect(() => {
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

      // Simplified modifier matching:
      // - meta: Accept Cmd (Mac) OR Ctrl (Windows/Linux) for cross-platform shortcuts
      // - When meta is false, ensure neither metaKey nor ctrlKey is pressed
      // - shift/alt are straightforward boolean checks
      const modifiersMatch =
        (meta
          ? event.metaKey || event.ctrlKey
          : !event.metaKey && !event.ctrlKey) &&
        (shift ? event.shiftKey : !event.shiftKey) &&
        (alt ? event.altKey : !event.altKey);

      if (modifiersMatch) {
        if (preventDefault) {
          event.preventDefault();
        }
        // Use ref to get latest callback without adding it to dependencies
        callbackRef.current();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, meta, shift, alt, preventDefault, skipInInputs]);
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
