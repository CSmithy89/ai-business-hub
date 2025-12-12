/**
 * Sidebar Navigation Sub-Item Component
 *
 * Nested navigation item for collapsible groups.
 * Simpler than SidebarNavItem - no badge/statusDot support.
 *
 * Epic: 15 - UI/UX Platform Foundation
 * Story: 15.11 - Main Menu Restructuring with Businesses Tab
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarNavSubItemProps {
  /** Lucide icon component */
  icon: LucideIcon;
  /** Display label */
  label: string;
  /** Navigation route */
  href: string;
  /** Whether this is displayed in collapsed sidebar tooltip */
  inTooltip?: boolean;
}

export function SidebarNavSubItem({
  icon,
  label,
  href,
  inTooltip = false,
}: SidebarNavSubItemProps) {
  const pathname = usePathname();

  // Active state: exact match or starts with href + '/'
  const isActive = pathname === href || pathname.startsWith(href + '/');

  const Icon = icon;

  // In tooltip mode (collapsed sidebar), use simpler styling
  if (inTooltip) {
    return (
      <li>
        <Link
          href={href as Route}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 text-sm',
            'transition-colors duration-150',
            isActive
              ? 'bg-[rgb(var(--color-bg-muted))] text-[rgb(var(--color-primary-500))]'
              : 'text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-bg-tertiary))] hover:text-[rgb(var(--color-text-primary))]'
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span>{label}</span>
        </Link>
      </li>
    );
  }

  // Normal expanded sidebar sub-item
  return (
    <li>
      <Link
        href={href as Route}
        className={cn(
          'group flex h-9 items-center gap-2 rounded-md px-2',
          'transition-all duration-150 ease-out',
          isActive
            ? 'bg-[rgb(var(--color-bg-muted))] text-[rgb(var(--color-primary-500))]'
            : 'text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-bg-tertiary))] hover:text-[rgb(var(--color-text-primary))]'
        )}
      >
        <Icon
          className={cn(
            'h-4 w-4 shrink-0',
            isActive
              ? 'text-[rgb(var(--color-primary-500))]'
              : 'text-[rgb(var(--color-text-tertiary))] group-hover:text-[rgb(var(--color-text-primary))]'
          )}
        />
        <span className="text-sm">{label}</span>
      </Link>
    </li>
  );
}
