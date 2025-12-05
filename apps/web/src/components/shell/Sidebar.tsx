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
 *
 * Epic: 07 - UI Shell
 * Story: 07-2 - Create Sidebar Navigation
 * Updated: Story 08.2 - Add Business Switcher
 */

'use client';

import { useParams } from 'next/navigation';
import { useUIStore } from '@/stores/ui';
import { SidebarNav } from './SidebarNav';
import { SidebarWorkspaceSwitcher } from './SidebarWorkspaceSwitcher';
import { BusinessSwitcher } from './BusinessSwitcher';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const params = useParams();

  // Detect if we're in business context (has businessId param)
  const isBusinessContext = !!params.businessId;

  return (
    <aside
      className={cn(
        'fixed top-[60px] left-0 bottom-0 z-20 flex flex-col',
        'border-r border-[rgb(var(--color-border-default))]',
        'bg-[rgb(var(--color-bg-secondary))]',
        'transition-all duration-200 ease-out',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Navigation Items */}
      <SidebarNav collapsed={sidebarCollapsed} />

      {/* Workspace Switcher and Business Switcher */}
      <div className="mt-auto border-t border-[rgb(var(--color-border-default))] p-4 space-y-2">
        {/* Business Switcher - only show when in business context */}
        {isBusinessContext && <BusinessSwitcher collapsed={sidebarCollapsed} />}

        {/* Workspace Switcher */}
        <SidebarWorkspaceSwitcher collapsed={sidebarCollapsed} />
      </div>

      {/* Collapse/Expand Toggle Button */}
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
    </aside>
  );
}
