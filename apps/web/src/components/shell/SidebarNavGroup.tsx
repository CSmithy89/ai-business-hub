/**
 * Sidebar Navigation Group Component
 *
 * Collapsible navigation group with expand/collapse functionality.
 * Used for parent menu items that have sub-navigation (e.g., Businesses).
 *
 * Epic: 15 - UI/UX Platform Foundation
 * Story: 15.11 - Main Menu Restructuring with Businesses Tab
 */

'use client';

import { useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SidebarNavGroupProps {
  /** Lucide icon component for the group */
  icon: LucideIcon;
  /** Display label (e.g., "Businesses") */
  label: string;
  /** Base href for route matching (e.g., "/businesses") */
  baseHref: string;
  /** Whether sidebar is in collapsed state */
  collapsed: boolean;
  /** Sub-navigation items */
  children: ReactNode;
}

export function SidebarNavGroup({
  icon,
  label,
  baseHref,
  collapsed,
  children,
}: SidebarNavGroupProps) {
  const pathname = usePathname();

  // Check if any child route is active
  const isChildActive = pathname === baseHref || pathname.startsWith(baseHref + '/');

  // Expanded state - auto-expand if child is active
  const [isExpanded, setIsExpanded] = useState(isChildActive);

  // Sync expanded state when route changes
  useEffect(() => {
    if (isChildActive) {
      setIsExpanded(true);
    }
  }, [isChildActive]);

  // Toggle expand/collapse
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const Icon = icon;

  // Collapsed sidebar: show icon with tooltip containing sub-items
  if (collapsed) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <li>
              <button
                type="button"
                onClick={handleToggle}
                className={cn(
                  'group relative flex h-11 w-11 items-center justify-center rounded-md',
                  'transition-all duration-150 ease-out',
                  isChildActive
                    ? 'border-l-2 border-[rgb(var(--color-primary-500))] bg-[rgb(var(--color-bg-muted))] text-[rgb(var(--color-primary-500))] shadow-sm'
                    : 'text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-bg-tertiary))] hover:text-[rgb(var(--color-text-primary))]'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0',
                    isChildActive
                      ? 'text-[rgb(var(--color-primary-500))]'
                      : 'text-[rgb(var(--color-text-secondary))] group-hover:text-[rgb(var(--color-text-primary))]'
                  )}
                />
              </button>
            </li>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={16} className="p-0">
            <div className="min-w-[160px] py-2">
              <div className="px-3 py-1 text-xs font-medium text-[rgb(var(--color-text-muted))]">
                {label}
              </div>
              <ul className="mt-1">{children}</ul>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Expanded sidebar: show collapsible group
  return (
    <li>
      {/* Group header / toggle button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        className={cn(
          'group relative flex h-11 w-full items-center gap-3 rounded-md px-3',
          'transition-all duration-150 ease-out',
          isChildActive
            ? 'border-l-2 border-[rgb(var(--color-primary-500))] bg-[rgb(var(--color-bg-muted))] text-[rgb(var(--color-primary-500))] shadow-sm'
            : 'text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-bg-tertiary))] hover:text-[rgb(var(--color-text-primary))]'
        )}
      >
        {/* Icon */}
        <Icon
          className={cn(
            'h-5 w-5 shrink-0',
            isChildActive
              ? 'text-[rgb(var(--color-primary-500))]'
              : 'text-[rgb(var(--color-text-secondary))] group-hover:text-[rgb(var(--color-text-primary))]'
          )}
        />

        {/* Label */}
        <span className="flex-1 text-left text-sm font-medium">{label}</span>

        {/* Chevron */}
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-[rgb(var(--color-text-tertiary))] transition-transform duration-150" />
        ) : (
          <ChevronRight className="h-4 w-4 text-[rgb(var(--color-text-tertiary))] transition-transform duration-150" />
        )}
      </button>

      {/* Sub-navigation items */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-150 ease-out',
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <ul className="ml-4 mt-1 space-y-1 border-l border-[rgb(var(--color-border-default))] pl-3">
          {children}
        </ul>
      </div>
    </li>
  );
}
