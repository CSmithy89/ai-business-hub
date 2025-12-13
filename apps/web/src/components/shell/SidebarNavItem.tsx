/**
 * Sidebar Navigation Item Component
 *
 * Individual navigation item with:
 * - Active state detection based on current route
 * - Badge support (inline in expanded, overlay in collapsed)
 * - Status dot for module items (agent-colored)
 * - Tooltip in collapsed state
 * - Coming Soon tooltip for unreleased modules
 *
 * Epic: 07 - UI Shell
 * Story: 07-2 - Create Sidebar Navigation
 * Updated: Story 15.1 - Replace Material Icons with Lucide
 * Updated: Story 15-25 - Apply Agent Character Colors Throughout
 * Updated: Story 16-22 - Add Coming Soon Module Tooltips
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import type { LucideIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/**
 * Agent status dot colors (using CSS custom properties from tokens.css)
 */
type AgentStatusDot = 'hub' | 'maya' | 'atlas' | 'sage' | 'nova' | 'echo' | 'secondary';

interface SidebarNavItemProps {
  /** Lucide icon component */
  icon: LucideIcon;
  /** Display label (e.g., "Dashboard") */
  label: string;
  /** Navigation route (e.g., "/dashboard") */
  href: string;
  /** Optional badge count (e.g., 5 for approvals) */
  badge?: number;
  /** Optional status dot color for module items (agent name or secondary) */
  statusDot?: AgentStatusDot;
  /** Whether this module is coming soon (adds tooltip to status dot) */
  comingSoon?: string;
  /** Whether sidebar is in collapsed state */
  collapsed: boolean;
}

export function SidebarNavItem({
  icon,
  label,
  href,
  badge,
  statusDot,
  comingSoon,
  collapsed,
}: SidebarNavItemProps) {
  const pathname = usePathname();

  // Active state: exact match or starts with href + '/'
  const isActive = pathname === href || pathname.startsWith(href + '/');

  // Status dot color mapping (using agent CSS custom properties)
  const statusDotColors: Record<AgentStatusDot, string> = {
    hub: 'bg-[rgb(var(--color-agent-hub))]',       // Coral
    maya: 'bg-[rgb(var(--color-agent-maya))]',     // Teal
    atlas: 'bg-[rgb(var(--color-agent-atlas))]',   // Orange
    sage: 'bg-[rgb(var(--color-agent-sage))]',     // Green
    nova: 'bg-[rgb(var(--color-agent-nova))]',     // Pink
    echo: 'bg-[rgb(var(--color-agent-echo))]',     // Blue
    secondary: 'bg-[rgb(var(--color-accent-500))]', // Teal (alias for maya)
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
      {(() => {
        const Icon = icon;
        return (
          <Icon
            className={cn(
              'h-5 w-5 shrink-0',
              isActive
                ? 'text-[rgb(var(--color-primary-500))]'
                : 'text-[rgb(var(--color-text-secondary))] group-hover:text-[rgb(var(--color-text-primary))]'
            )}
          />
        );
      })()}

      {/* Label + Status Dot + Badge (expanded state) */}
      {!collapsed && (
        <>
          <div className="flex flex-1 items-center gap-2">
            <span className="text-sm font-medium">{label}</span>
            {statusDot && (
              comingSoon ? (
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'h-1.5 w-1.5 rounded-full cursor-help',
                          statusDotColors[statusDot]
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      <span className="text-xs">{comingSoon}</span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <div
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    statusDotColors[statusDot]
                  )}
                />
              )
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
            <div className="flex flex-col gap-0.5">
              <span>{label}</span>
              {comingSoon && (
                <span className="text-xs text-muted-foreground">{comingSoon}</span>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return linkContent;
}
