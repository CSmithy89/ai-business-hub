/**
 * Theme Toggle Component
 *
 * Allows users to switch between light, dark, and system themes.
 * Uses next-themes for theme management and persistence.
 *
 * Features:
 * - Three theme options: light, dark, system
 * - Persists preference to localStorage
 * - Respects system preference when "system" is selected
 * - Smooth transitions between themes
 */

'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className="flex h-9 w-9 items-center justify-center rounded-md
                   transition-colors hover:bg-[rgb(var(--color-bg-hover))]"
        type="button"
      >
        <Sun className="h-5 w-5" />
      </button>
    );
  }

  const currentTheme = theme === 'system' ? systemTheme : theme;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Toggle theme"
          className="flex h-9 w-9 items-center justify-center rounded-md
                     transition-colors hover:bg-[rgb(var(--color-bg-hover))]
                     focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
          type="button"
        >
          {currentTheme === 'dark' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          Light
          {theme === 'light' && (
            <span className="ml-auto text-[rgb(var(--color-primary))]">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
          {theme === 'dark' && (
            <span className="ml-auto text-[rgb(var(--color-primary))]">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          System
          {theme === 'system' && (
            <span className="ml-auto text-[rgb(var(--color-primary))]">✓</span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Inline Theme Toggle Item
 *
 * A simpler version for use inside existing dropdown menus.
 * Returns just the menu items without the trigger button.
 */
export function ThemeToggleItems() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <DropdownMenuItem onClick={() => setTheme('light')}>
        <Sun className="mr-2 h-4 w-4" />
        Light theme
        {theme === 'light' && (
          <span className="ml-auto text-[rgb(var(--color-primary))]">✓</span>
        )}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme('dark')}>
        <Moon className="mr-2 h-4 w-4" />
        Dark theme
        {theme === 'dark' && (
          <span className="ml-auto text-[rgb(var(--color-primary))]">✓</span>
        )}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme('system')}>
        <Monitor className="mr-2 h-4 w-4" />
        System theme
        {theme === 'system' && (
          <span className="ml-auto text-[rgb(var(--color-primary))]">✓</span>
        )}
      </DropdownMenuItem>
    </>
  );
}
