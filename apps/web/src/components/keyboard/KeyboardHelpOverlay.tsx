/**
 * Keyboard Help Overlay Component
 *
 * Displays all available keyboard shortcuts in a modal dialog.
 * Features:
 * - Search/filter shortcuts
 * - Categorized by context (Global, Navigation, UI, Chat)
 * - Platform-appropriate modifier keys (⌘ on Mac, Ctrl on Windows/Linux)
 * - Visual key representations
 *
 * Epic: 07 - UI Shell
 * Story: 07-8 - Implement Keyboard Shortcuts
 * Updated: Story 16-26 - Keyboard Shortcuts Help Modal Polish
 */

'use client';

import { useState, useMemo } from 'react';
import { Keyboard, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type ShortcutCategory = 'global' | 'navigation' | 'ui' | 'chat';

interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: ShortcutCategory;
}

interface KeyboardHelpOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMac: boolean;
}

const CATEGORY_LABELS: Record<ShortcutCategory, string> = {
  global: 'Global',
  navigation: 'Navigation',
  ui: 'UI Controls',
  chat: 'Chat',
};

const CATEGORY_ORDER: ShortcutCategory[] = ['global', 'navigation', 'ui', 'chat'];

/**
 * Keyboard Help Overlay
 *
 * Shows all keyboard shortcuts grouped by category with search/filter
 */
export function KeyboardHelpOverlay({
  open,
  onOpenChange,
  isMac,
}: KeyboardHelpOverlayProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const modKey = isMac ? '⌘' : 'Ctrl';

  // All keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    // Global shortcuts
    {
      keys: ['?'],
      description: 'Show keyboard shortcuts',
      category: 'global',
    },
    {
      keys: ['Esc'],
      description: 'Close dialogs and modals',
      category: 'global',
    },
    {
      keys: [modKey, 'K'],
      description: 'Open command palette',
      category: 'global',
    },

    // Navigation - Modifier shortcuts
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
    // Navigation - Vim-style sequences
    {
      keys: ['G', 'then', 'D'],
      description: 'Go to Dashboard',
      category: 'navigation',
    },
    {
      keys: ['G', 'then', 'A'],
      description: 'Go to Approvals',
      category: 'navigation',
    },
    {
      keys: ['G', 'then', 'B'],
      description: 'Go to Businesses',
      category: 'navigation',
    },
    {
      keys: ['G', 'then', 'S'],
      description: 'Go to Settings',
      category: 'navigation',
    },
    {
      keys: ['G', 'then', 'N'],
      description: 'Go to AI Team',
      category: 'navigation',
    },

    // UI Controls
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

    // Chat
    {
      keys: ['/'],
      description: 'Focus chat input',
      category: 'chat',
    },
    {
      keys: ['Enter'],
      description: 'Send message',
      category: 'chat',
    },
    {
      keys: [modKey, 'Enter'],
      description: 'New line in chat',
      category: 'chat',
    },
    {
      keys: ['@'],
      description: 'Mention an agent',
      category: 'chat',
    },
  ], [modKey]);

  // Filter shortcuts based on search query
  const filteredShortcuts = useMemo(() => {
    if (!searchQuery.trim()) return shortcuts;

    const query = searchQuery.toLowerCase();
    return shortcuts.filter(shortcut =>
      shortcut.description.toLowerCase().includes(query) ||
      shortcut.keys.some(key => key.toLowerCase().includes(query)) ||
      CATEGORY_LABELS[shortcut.category].toLowerCase().includes(query)
    );
  }, [shortcuts, searchQuery]);

  // Group filtered shortcuts by category
  const groupedShortcuts = useMemo(() => {
    const grouped: Record<ShortcutCategory, KeyboardShortcut[]> = {
      global: [],
      navigation: [],
      ui: [],
      chat: [],
    };

    filteredShortcuts.forEach(shortcut => {
      grouped[shortcut.category].push(shortcut);
    });

    return grouped;
  }, [filteredShortcuts]);

  // Clear search when modal closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSearchQuery('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col bg-[rgb(var(--color-bg-primary))] border-[rgb(var(--color-border))]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgb(var(--color-primary-500)/0.1)]">
              <Keyboard className="h-5 w-5 text-[rgb(var(--color-primary-500))]" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-[rgb(var(--color-text-primary))]">
                Keyboard Shortcuts
              </DialogTitle>
              <DialogDescription className="text-sm text-[rgb(var(--color-text-secondary))]">
                Quick access to common actions
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--color-text-muted))]" />
          <Input
            type="text"
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-[rgb(var(--color-bg-secondary))]"
            autoFocus
          />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-6 py-4 min-h-0">
          {CATEGORY_ORDER.map((category) => {
            const categoryShortcuts = groupedShortcuts[category];
            if (categoryShortcuts.length === 0) return null;

            return (
              <div key={category} className="space-y-3">
                <h3 className="sticky top-0 bg-[rgb(var(--color-bg-primary))] text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-text-muted))] py-1">
                  {CATEGORY_LABELS[category]}
                </h3>
                <div className="space-y-1">
                  {categoryShortcuts.map((shortcut, index) => (
                    <ShortcutRow key={`${category}-${index}`} shortcut={shortcut} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {filteredShortcuts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-[rgb(var(--color-text-secondary))]">
                No shortcuts found for &quot;{searchQuery}&quot;
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[rgb(var(--color-border))] pt-4 text-center text-xs text-[rgb(var(--color-text-secondary))]">
          Press{' '}
          <kbd className="mx-1 inline-flex h-5 items-center rounded bg-[rgb(var(--color-bg-secondary))] px-1.5 font-mono text-[10px] border border-[rgb(var(--color-border))]">
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
            className={`inline-flex h-6 min-w-[24px] items-center justify-center rounded px-2 font-mono text-xs font-medium border shadow-sm ${
              key === 'then'
                ? 'bg-transparent border-transparent text-[rgb(var(--color-text-muted))] shadow-none'
                : 'bg-[rgb(var(--color-bg-secondary))] text-[rgb(var(--color-text-secondary))] border-[rgb(var(--color-border))]'
            }`}
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}
