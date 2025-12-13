/**
 * Sidebar Component
 *
 * Main navigation sidebar with:
 * - Collapsible/expandable states (64px / 256px)
 * - Navigation items with active state highlighting
 * - Badge support for approval count
 * - Tooltips in collapsed state
 * - Workspace switcher at bottom
 * - Business switcher (when in business context)
 * - Smooth 200ms transitions
 * - Hover-to-expand when auto-collapsed (Story 16.1)
 *
 * Epic: 07 - UI Shell
 * Story: 07-2 - Create Sidebar Navigation
 * Updated: Story 08.2 - Add Business Switcher
 * Updated: Story 16.1 - Implement Medium Screen Layout
 */

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useUIStore } from '@/stores/ui';
import { SidebarNav } from './SidebarNav';
import { SidebarWorkspaceSwitcher } from './SidebarWorkspaceSwitcher';
import { BusinessSwitcher } from './BusinessSwitcher';
import { cn } from '@/lib/utils';

interface SidebarProps {
  /** True if sidebar is auto-collapsed by responsive layout (not user action) */
  isAutoCollapsed?: boolean;
}

export function Sidebar({ isAutoCollapsed = false }: SidebarProps) {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const params = useParams();

  // Track hover state for auto-collapsed sidebar
  const [isHovered, setIsHovered] = useState(false);

  // Detect if we're in business context (has businessId param)
  const isBusinessContext = !!params.businessId;

  // Determine if sidebar should be collapsed
  // User collapse takes precedence over auto-collapse
  const isCollapsed = sidebarCollapsed || isAutoCollapsed;

  // Only allow hover expansion when auto-collapsed (not when user manually collapsed)
  const shouldExpandOnHover = isAutoCollapsed && !sidebarCollapsed;

  // Determine effective width based on collapsed state and hover
  const isExpanded = shouldExpandOnHover && isHovered;

  return (
    <aside
      className={cn(
        'fixed top-[60px] left-0 bottom-0 z-20 flex flex-col',
        'border-r border-[rgb(var(--color-border-default))]',
        'bg-[rgb(var(--color-bg-secondary))]',
        'transition-all duration-300 ease-in-out',
        // Width based on collapsed state and hover
        isCollapsed && !isExpanded ? 'w-16' : 'w-64',
        // Add shadow when hover-expanded to indicate temporary expansion
        isExpanded && 'shadow-xl'
      )}
      onMouseEnter={() => shouldExpandOnHover && setIsHovered(true)}
      onMouseLeave={() => shouldExpandOnHover && setIsHovered(false)}
    >
      {/* Navigation Items */}
      <SidebarNav collapsed={isCollapsed && !isExpanded} />

      {/* Workspace Switcher and Business Switcher */}
      <div className="mt-auto border-t border-[rgb(var(--color-border-default))] p-4 space-y-2">
        {/* Business Switcher - only show when in business context */}
        {isBusinessContext && <BusinessSwitcher collapsed={isCollapsed && !isExpanded} />}

        {/* Workspace Switcher */}
        <SidebarWorkspaceSwitcher collapsed={isCollapsed && !isExpanded} />
      </div>

      {/* Collapse/Expand Toggle Button - only show when not auto-collapsed */}
      {!isAutoCollapsed && (
        <button
          type="button"
          onClick={toggleSidebar}
          className={cn(
            'absolute -right-3 top-4 z-30 flex h-6 w-6 items-center justify-center',
            'rounded-full border border-[rgb(var(--color-border-default))]',
            'bg-[rgb(var(--color-bg-primary))] text-[rgb(var(--color-text-secondary))]',
            'shadow-sm transition-colors hover:bg-[rgb(var(--color-bg-tertiary))]'
          )}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="text-sm">{sidebarCollapsed ? '→' : '←'}</span>
        </button>
      )}
    </aside>
  );
}
