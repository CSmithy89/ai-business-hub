/**
 * Header Component
 *
 * Story 15-23: Header Bar Style Fixes
 *
 * Main header bar with:
 * - Logo and business switcher (left)
 * - Breadcrumb navigation (center)
 * - Search trigger, notifications, help, user menu (right)
 *
 * All icon buttons use premium hover effects:
 * - Subtle background on hover
 * - 1px lift effect
 * - 150ms transitions
 */

'use client';

import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import { HeaderBreadcrumbs } from './HeaderBreadcrumbs';
import { HeaderSearchTrigger } from './HeaderSearchTrigger';
import { HeaderNotificationBell } from './HeaderNotificationBell';
import { HeaderUserMenu } from './HeaderUserMenu';
import { MobileHamburger } from '@/components/mobile';
import { BusinessSwitcher } from '@/components/business/business-switcher';
import { cn } from '@/lib/utils';

export function Header() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex h-[60px] items-center
                 justify-between border-b border-[rgb(var(--color-border-default))]
                 bg-[rgb(var(--color-bg-secondary))] px-4 shadow-sm"
    >
      {/* Left section: Logo and workspace */}
      <div className="flex items-center gap-4">
        {/* Mobile hamburger menu */}
        <MobileHamburger />
        {/* Logo */}
        <Link
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
          href="/dashboard"
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg
                       bg-[rgb(var(--color-primary))]"
          >
            <span className="text-sm font-bold text-white">H</span>
          </div>
          <span
            className="hidden sm:block text-lg font-bold tracking-tight
                       text-[rgb(var(--color-text-primary))]"
          >
            HYVVE
          </span>
        </Link>

        {/* Business Switcher (Story 15.14) */}
        <div className="hidden md:flex items-center pl-4 border-l border-[rgb(var(--color-border-default))]">
          <BusinessSwitcher />
        </div>
      </div>

      {/* Center section: Breadcrumbs */}
      <div className="flex-1 flex justify-center px-4">
        <HeaderBreadcrumbs />
      </div>

      {/* Right section: Actions */}
      <div className="flex items-center gap-2">
        {/* Search trigger */}
        <HeaderSearchTrigger />

        {/* Notification bell */}
        <HeaderNotificationBell />

        {/* Help link - premium hover with lift effect */}
        <Link
          aria-label="Help"
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg',
            'text-[rgb(var(--color-text-secondary))]',
            // 150ms transitions per style guide
            'transition-all duration-150 ease-out',
            // Hover: background + lift + color
            'hover:bg-[rgb(var(--color-bg-hover))]',
            'hover:text-[rgb(var(--color-text-primary))]',
            'hover:-translate-y-px',
            // Focus-visible
            'focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary-500))] focus-visible:ring-offset-2'
          )}
          href={'/help' as never}
        >
          {/* Lucide icon - 20px size */}
          <HelpCircle className="h-5 w-5" />
        </Link>

        {/* User menu */}
        <HeaderUserMenu />
      </div>
    </header>
  );
}
