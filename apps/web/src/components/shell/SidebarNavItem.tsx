/**
 * Sidebar Navigation Item Component
 *
 * Individual navigation item with:
 * - Active state detection based on current route
 * - Badge support (inline in expanded, overlay in collapsed)
 * - Status dot for module items
 * - Tooltip in collapsed state
 *
 * Epic: 07 - UI Shell
 * Story: 07-2 - Create Sidebar Navigation
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SidebarNavItemProps {
  /** Material Symbols icon name (e.g., "grid_view") */
  icon: string;
  /** Display label (e.g., "Dashboard") */
  label: string;
  /** Navigation route (e.g., "/dashboard") */
  href: string;
  /** Optional badge count (e.g., 5 for approvals) */
  badge?: number;
  /** Optional status dot color for module items */
  statusDot?: 'secondary' | 'atlas';
  /** Whether sidebar is in collapsed state */
  collapsed: boolean;
}

export function SidebarNavItem({
  icon,
  label,
  href,
  badge,
  statusDot,
  collapsed,
}: SidebarNavItemProps) {
  const pathname = usePathname();

  // Active state: exact match or starts with href + '/'
  const isActive = pathname === href || pathname.startsWith(href + '/');

  // Status dot color mapping
  const statusDotColors = {
    secondary: 'bg-[rgb(var(--color-accent-500))]', // Teal
    atlas: 'bg-[rgb(var(--color-agent-atlas))]', // Orange
  };

  const linkContent = (
    <li>
      <Link
        href={href as Route}
        className={cn(
          'group relative flex h-11 items-center gap-3 rounded-md',
          'transition-all duration-150 ease-out',
          collapsed ? 'w-11 justify-center' : 'px-3',
          isActive
            ? 'border-l-2 border-[rgb(var(--color-primary-500))] bg-[rgb(var(--color-bg-muted))] text-[rgb(var(--color-primary-500))] shadow-sm'
            : 'text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-bg-tertiary))] hover:text-[rgb(var(--color-text-primary))]'
        )}
      >
      {/* Icon */}
      <span
        className={cn(
          'material-symbols-outlined text-xl',
          isActive
            ? 'text-[rgb(var(--color-primary-500))]'
            : 'text-[rgb(var(--color-text-secondary))] group-hover:text-[rgb(var(--color-text-primary))]'
        )}
      >
        {icon}
      </span>

      {/* Label + Status Dot + Badge (expanded state) */}
      {!collapsed && (
        <>
          <div className="flex flex-1 items-center gap-2">
            <span className="text-sm font-medium">{label}</span>
            {statusDot && (
              <div
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  statusDotColors[statusDot]
                )}
              />
            )}
          </div>
          {badge !== undefined && badge > 0 && (
            <span className="rounded-full bg-[rgb(var(--color-primary-500))] px-2 py-0.5 text-xs font-medium text-white">
              {badge}
            </span>
          )}
        </>
      )}

      {/* Badge overlay (collapsed state) */}
      {collapsed && badge !== undefined && badge > 0 && (
        <div className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[rgb(var(--color-bg-secondary))] bg-[rgb(var(--color-primary-500))] text-[10px] font-bold text-white">
          {badge}
        </div>
      )}
      </Link>
    </li>
  );

  // Wrap with tooltip in collapsed state
  if (collapsed) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={16}>
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return linkContent;
}
