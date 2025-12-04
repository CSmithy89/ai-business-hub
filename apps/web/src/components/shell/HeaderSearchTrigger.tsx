/**
 * Header Search Trigger Component
 *
 * Button that opens the command palette (Cmd+K / Ctrl+K).
 * Shows keyboard shortcut hint on desktop.
 */

'use client';

import { useEffect, useState } from 'react';
import { useUIStore } from '@/stores/ui';

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
      className="flex items-center gap-2 rounded-lg border border-[rgb(var(--color-border-default))]
                 bg-[rgb(var(--color-bg-primary))] px-3 py-1.5 text-sm
                 text-[rgb(var(--color-text-secondary))] transition-colors
                 hover:border-[rgb(var(--color-border-hover))]
                 hover:text-[rgb(var(--color-text-primary))]
                 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2"
      onClick={openCommandPalette}
      type="button"
    >
      <span className="material-symbols-rounded text-lg">search</span>
      <span className="hidden lg:inline">Search...</span>
      <kbd
        className="ml-2 hidden lg:inline-flex items-center gap-0.5 rounded border
                   border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-bg-secondary))]
                   px-1.5 py-0.5 text-xs font-medium text-[rgb(var(--color-text-tertiary))]"
      >
        <span className="text-[10px]">{shortcutKey}</span>K
      </kbd>
    </button>
  );
}
