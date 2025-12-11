/**
 * Header Search Trigger Component
 *
 * Story 15-23: Header Bar Style Fixes
 *
 * Button that opens the command palette (Cmd+K / Ctrl+K).
 * Shows keyboard shortcut hint on desktop.
 * Uses Lucide Search icon with premium hover effects.
 */

'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useUIStore } from '@/stores/ui';
import { cn } from '@/lib/utils';

export function HeaderSearchTrigger() {
  const openCommandPalette = useUIStore((state) => state.openCommandPalette);
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform));
  }, []);

  const shortcutKey = isMac ? '⌘' : 'Ctrl';

  return (
    <button
      aria-label={`Search (${shortcutKey}K)`}
      className={cn(
        // Base styles
        'flex items-center gap-2 rounded-[10px] border px-3 py-1.5 text-sm',
        // Colors
        'border-[rgb(var(--color-border-default))]',
        'bg-[rgb(var(--color-bg-primary))]',
        'text-[rgb(var(--color-text-secondary))]',
        // Transitions (150ms per style guide)
        'transition-all duration-150 ease-out',
        // Hover: lift effect + border change
        'hover:border-[rgb(var(--color-border-strong))]',
        'hover:text-[rgb(var(--color-text-primary))]',
        'hover:-translate-y-px',
        'hover:shadow-sm',
        // Focus-visible: coral ring
        'focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary-500))] focus-visible:ring-offset-2'
      )}
      onClick={openCommandPalette}
      type="button"
    >
      {/* Lucide Search icon - 20px size */}
      <Search className="h-5 w-5" />
      <span className="hidden lg:inline">Search...</span>
      <kbd
        className={cn(
          'ml-2 hidden lg:inline-flex items-center gap-0.5 rounded',
          'border border-[rgb(var(--color-border-default))]',
          'bg-[rgb(var(--color-bg-secondary))]',
          'px-1.5 py-0.5 text-xs font-medium',
          'text-[rgb(var(--color-text-muted))]'
        )}
      >
        <span className="text-[10px]">{shortcutKey}</span>K
      </kbd>
    </button>
  );
}
