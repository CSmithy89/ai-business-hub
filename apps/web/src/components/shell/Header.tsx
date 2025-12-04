/**
 * Header Component
 *
 * Main header bar with:
 * - Logo and workspace selector (left)
 * - Breadcrumb navigation (center)
 * - Search trigger, notifications, help, user menu (right)
 *
 * Story 07.3: Create Header Bar
 */

'use client';

import Link from 'next/link';
import { HeaderBreadcrumbs } from './HeaderBreadcrumbs';
import { HeaderSearchTrigger } from './HeaderSearchTrigger';
import { HeaderNotificationBell } from './HeaderNotificationBell';
import { HeaderUserMenu } from './HeaderUserMenu';

export function Header() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex h-[60px] items-center
                 justify-between border-b border-[rgb(var(--color-border-default))]
                 bg-[rgb(var(--color-bg-secondary))] px-4 shadow-sm"
    >
      {/* Left section: Logo and workspace */}
      <div className="flex items-center gap-4">
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

        {/* Workspace selector placeholder */}
        <div className="hidden md:flex items-center gap-2 pl-4 border-l border-[rgb(var(--color-border-default))]">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md
                       bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-warning))]
                       text-xs font-bold text-white"
          >
            AC
          </div>
          <span className="text-sm font-medium text-[rgb(var(--color-text-primary))]">
            Acme Corp
          </span>
          <span className="material-symbols-rounded text-base text-[rgb(var(--color-text-tertiary))]">
            expand_more
          </span>
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

        {/* Help link */}
        <Link
          aria-label="Help"
          className="flex h-9 w-9 items-center justify-center rounded-lg
                     text-[rgb(var(--color-text-secondary))] transition-colors
                     hover:bg-[rgb(var(--color-bg-hover))] hover:text-[rgb(var(--color-text-primary))]"
          href={'/help' as never}
        >
          <span className="material-symbols-rounded text-xl">help</span>
        </Link>

        {/* User menu */}
        <HeaderUserMenu />
      </div>
    </header>
  );
}
