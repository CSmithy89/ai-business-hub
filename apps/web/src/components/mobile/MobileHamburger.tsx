/**
 * Mobile Hamburger Menu Button
 *
 * Hamburger button that opens the mobile drawer navigation.
 * Only visible on mobile screens (< md breakpoint).
 *
 * Epic: 07 - UI Shell
 * Story: 07-10 - Create Mobile Navigation
 */

'use client';

import { useUIStore } from '@/stores/ui';
import { cn } from '@/lib/utils';

export function MobileHamburger() {
  const { mobileMenuOpen, toggleMobileMenu } = useUIStore();

  return (
    <button
      type="button"
      onClick={toggleMobileMenu}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-lg',
        'text-[rgb(var(--color-text-primary))] transition-colors',
        'hover:bg-[rgb(var(--color-bg-hover))]',
        'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]',
        'md:hidden' // Only show on mobile
      )}
      aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={mobileMenuOpen}
    >
      <span className="material-symbols-rounded text-2xl">
        {mobileMenuOpen ? 'close' : 'menu'}
      </span>
    </button>
  );
}
