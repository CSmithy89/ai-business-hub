/**
 * useKeyboardShortcut Hook Tests
 *
 * Tests for keyboard shortcut handling including:
 * - Cross-platform modifier key support (Cmd/Ctrl)
 * - Input focus context detection
 * - Event cleanup on unmount
 *
 * Epic: 07 - UI Shell
 * Story: Technical Debt - Add unit tests for keyboard shortcuts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useKeyboardShortcut,
  useIsMac,
  getModifierKeySymbol,
} from './use-keyboard-shortcut';

describe('useKeyboardShortcut', () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Shortcut Registration', () => {
    it('registers keydown event listener on mount', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('k', {}, callback));

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });

    it('removes event listener on unmount', () => {
      const callback = vi.fn();
      const { unmount } = renderHook(() =>
        useKeyboardShortcut('k', {}, callback)
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });

    it('triggers callback on matching key press', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('k', {}, callback));

      const event = new KeyboardEvent('keydown', { key: 'k' });
      act(() => {
        document.dispatchEvent(event);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('does not trigger callback on non-matching key', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('k', {}, callback));

      const event = new KeyboardEvent('keydown', { key: 'j' });
      act(() => {
        document.dispatchEvent(event);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it('matches key case-insensitively', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('k', {}, callback));

      const event = new KeyboardEvent('keydown', { key: 'K' });
      act(() => {
        document.dispatchEvent(event);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cross-Platform Modifier Keys', () => {
    it('triggers with meta key (Mac Cmd) when meta option is true', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('k', { meta: true }, callback));

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
      });
      act(() => {
        document.dispatchEvent(event);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('triggers with ctrl key (Windows/Linux) when meta option is true', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('k', { meta: true }, callback));

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
      });
      act(() => {
        document.dispatchEvent(event);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('does not trigger without modifier when meta is required', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('k', { meta: true }, callback));

      const event = new KeyboardEvent('keydown', { key: 'k' });
      act(() => {
        document.dispatchEvent(event);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it('does not trigger with modifier when meta is not required', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('k', { meta: false }, callback));

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
      });
      act(() => {
        document.dispatchEvent(event);
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Shift Modifier', () => {
    it('triggers with shift when shift option is true', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('k', { shift: true }, callback));

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        shiftKey: true,
      });
      act(() => {
        document.dispatchEvent(event);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('does not trigger without shift when shift is required', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('k', { shift: true }, callback));

      const event = new KeyboardEvent('keydown', { key: 'k' });
      act(() => {
        document.dispatchEvent(event);
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Alt Modifier', () => {
    it('triggers with alt when alt option is true', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('k', { alt: true }, callback));

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        altKey: true,
      });
      act(() => {
        document.dispatchEvent(event);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('does not trigger without alt when alt is required', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('k', { alt: true }, callback));

      const event = new KeyboardEvent('keydown', { key: 'k' });
      act(() => {
        document.dispatchEvent(event);
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Combined Modifiers', () => {
    it('triggers with Cmd+Shift combination', () => {
      const callback = vi.fn();
      renderHook(() =>
        useKeyboardShortcut('k', { meta: true, shift: true }, callback)
      );

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        shiftKey: true,
      });
      act(() => {
        document.dispatchEvent(event);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('does not trigger with only one modifier when both required', () => {
      const callback = vi.fn();
      renderHook(() =>
        useKeyboardShortcut('k', { meta: true, shift: true }, callback)
      );

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        shiftKey: false,
      });
      act(() => {
        document.dispatchEvent(event);
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Input Focus Context', () => {
    it('skips callback when input is focused by default', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('k', { meta: true }, callback));

      // Create and focus an input
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
      });
      act(() => {
        document.dispatchEvent(event);
      });

      expect(callback).not.toHaveBeenCalled();

      // Cleanup
      document.body.removeChild(input);
    });

    it('skips callback when textarea is focused', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('k', { meta: true }, callback));

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
      });
      act(() => {
        document.dispatchEvent(event);
      });

      expect(callback).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it('skips callback when contenteditable element is focused', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('k', { meta: true }, callback));

      const div = document.createElement('div');
      div.setAttribute('contenteditable', 'true');
      document.body.appendChild(div);
      div.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
      });
      act(() => {
        document.dispatchEvent(event);
      });

      expect(callback).not.toHaveBeenCalled();

      document.body.removeChild(div);
    });

    it('triggers callback when skipInInputs is false and input is focused', () => {
      const callback = vi.fn();
      renderHook(() =>
        useKeyboardShortcut('k', { meta: true, skipInInputs: false }, callback)
      );

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
      });
      act(() => {
        document.dispatchEvent(event);
      });

      expect(callback).toHaveBeenCalledTimes(1);

      document.body.removeChild(input);
    });
  });

  describe('Prevent Default Behavior', () => {
    it('prevents default by default', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('k', { meta: true }, callback));

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
      });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      act(() => {
        document.dispatchEvent(event);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('does not prevent default when preventDefault is false', () => {
      const callback = vi.fn();
      renderHook(() =>
        useKeyboardShortcut(
          'k',
          { meta: true, preventDefault: false },
          callback
        )
      );

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
      });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      act(() => {
        document.dispatchEvent(event);
      });

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('Callback Stability', () => {
    it('uses latest callback without re-registering listener', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const { rerender } = renderHook(
        ({ cb }) => useKeyboardShortcut('k', {}, cb),
        { initialProps: { cb: callback1 } }
      );

      // Rerender with new callback
      rerender({ cb: callback2 });

      // Reset the spy counts from initial mount
      const initialAddCount = addEventListenerSpy.mock.calls.length;

      const event = new KeyboardEvent('keydown', { key: 'k' });
      act(() => {
        document.dispatchEvent(event);
      });

      // New callback should be called, not the old one
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);

      // Event listener should not have been re-registered
      expect(addEventListenerSpy.mock.calls.length).toBe(initialAddCount);
    });
  });
});

describe('useIsMac', () => {
  const originalNavigator = global.navigator;

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
  });

  it('returns true for Mac platform', () => {
    Object.defineProperty(global, 'navigator', {
      value: { platform: 'MacIntel' },
      writable: true,
    });

    const { result } = renderHook(() => useIsMac());
    expect(result.current).toBe(true);
  });

  it('returns false for Windows platform', () => {
    Object.defineProperty(global, 'navigator', {
      value: { platform: 'Win32' },
      writable: true,
    });

    const { result } = renderHook(() => useIsMac());
    expect(result.current).toBe(false);
  });

  it('returns true for iOS devices', () => {
    Object.defineProperty(global, 'navigator', {
      value: { platform: 'iPhone' },
      writable: true,
    });

    const { result } = renderHook(() => useIsMac());
    expect(result.current).toBe(true);
  });
});

describe('getModifierKeySymbol', () => {
  const originalNavigator = global.navigator;

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
  });

  it('returns ⌘ for Mac', () => {
    Object.defineProperty(global, 'navigator', {
      value: { platform: 'MacIntel' },
      writable: true,
    });

    expect(getModifierKeySymbol()).toBe('⌘');
  });

  it('returns Ctrl for Windows', () => {
    Object.defineProperty(global, 'navigator', {
      value: { platform: 'Win32' },
      writable: true,
    });

    expect(getModifierKeySymbol()).toBe('Ctrl');
  });
});
