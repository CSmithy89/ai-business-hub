/**
 * Keyboard Help Overlay Component
 *
 * Displays all available keyboard shortcuts in a modal dialog.
 * Shortcuts are grouped by category (Navigation, UI Controls, General).
 * Shows platform-appropriate modifier keys (⌘ on Mac, Ctrl on Windows/Linux).
 *
 * Epic: 07 - UI Shell
 * Story: 07-8 - Implement Keyboard Shortcuts
 */

'use client';

import { Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: 'navigation' | 'ui' | 'general';
}

interface KeyboardHelpOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMac: boolean;
}

/**
 * Keyboard Help Overlay
 *
 * Shows all keyboard shortcuts grouped by category
 */
export function KeyboardHelpOverlay({
  open,
  onOpenChange,
  isMac,
}: KeyboardHelpOverlayProps) {
  const modKey = isMac ? '⌘' : 'Ctrl';

  // All keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    // Navigation
    {
      keys: [modKey, 'D'],
      description: 'Go to Dashboard',
      category: 'navigation',
    },
    {
      keys: [modKey, ','],
      description: 'Go to Settings',
      category: 'navigation',
    },

    // UI Controls
    {
      keys: [modKey, 'K'],
      description: 'Open command palette',
      category: 'ui',
    },
    {
      keys: [modKey, 'B'],
      description: 'Toggle sidebar',
      category: 'ui',
    },
    {
      keys: [modKey, '/'],
      description: 'Toggle chat panel',
      category: 'ui',
    },

    // General
    {
      keys: ['?'],
      description: 'Show this help',
      category: 'general',
    },
    {
      keys: ['Esc'],
      description: 'Close dialogs',
      category: 'general',
    },
  ];

  const navigationShortcuts = shortcuts.filter(
    (s) => s.category === 'navigation'
  );
  const uiShortcuts = shortcuts.filter((s) => s.category === 'ui');
  const generalShortcuts = shortcuts.filter((s) => s.category === 'general');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[rgb(var(--color-bg-primary))] border-[rgb(var(--color-border))]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgb(var(--color-primary))] bg-opacity-10">
              <Keyboard className="h-5 w-5 text-[rgb(var(--color-primary))]" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-[rgb(var(--color-text-primary))]">
                Keyboard Shortcuts
              </DialogTitle>
              <DialogDescription className="text-sm text-[rgb(var(--color-text-secondary))]">
                Quick access to common platform actions
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Navigation Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">
              Navigation
            </h3>
            <div className="space-y-2">
              {navigationShortcuts.map((shortcut, index) => (
                <ShortcutRow key={index} shortcut={shortcut} />
              ))}
            </div>
          </div>

          {/* UI Controls Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">
              UI Controls
            </h3>
            <div className="space-y-2">
              {uiShortcuts.map((shortcut, index) => (
                <ShortcutRow key={index} shortcut={shortcut} />
              ))}
            </div>
          </div>

          {/* General Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">
              General
            </h3>
            <div className="space-y-2">
              {generalShortcuts.map((shortcut, index) => (
                <ShortcutRow key={index} shortcut={shortcut} />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[rgb(var(--color-border))] pt-4 text-center text-xs text-[rgb(var(--color-text-secondary))]">
          Press{' '}
          <kbd className="mx-1 inline-flex h-5 items-center rounded bg-[rgb(var(--color-bg-secondary))] px-1.5 font-mono text-[10px]">
            Esc
          </kbd>{' '}
          to close
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Shortcut Row Component
 *
 * Displays a single keyboard shortcut with keys and description
 */
function ShortcutRow({ shortcut }: { shortcut: KeyboardShortcut }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-[rgb(var(--color-bg-secondary))] transition-colors">
      <span className="text-sm text-[rgb(var(--color-text-primary))]">
        {shortcut.description}
      </span>
      <div className="flex items-center gap-1">
        {shortcut.keys.map((key, index) => (
          <kbd
            key={index}
            className="inline-flex h-6 min-w-[24px] items-center justify-center rounded bg-[rgb(var(--color-bg-secondary))] px-2 font-mono text-xs font-medium text-[rgb(var(--color-text-secondary))] border border-[rgb(var(--color-border))] shadow-sm"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}
