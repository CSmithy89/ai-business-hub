/**
 * Sidebar Section Component
 *
 * Wrapper component for navigation sections (e.g., "Main", "Modules")
 * Provides section header and divider line.
 *
 * Epic: 07 - UI Shell
 * Story: 07-2 - Create Sidebar Navigation
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SidebarSectionProps {
  /** Section title (e.g., "Main", "Modules") */
  title: string;
  /** Whether sidebar is in collapsed state */
  collapsed: boolean;
  /** Navigation items to render in this section */
  children: ReactNode;
}

export function SidebarSection({ title, collapsed, children }: SidebarSectionProps) {
  return (
    <div className="mt-4 first:mt-0">
      {/* Section header - hidden when collapsed */}
      {!collapsed && (
        <h2 className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-[rgb(var(--color-text-muted))]">
          {title}
        </h2>
      )}

      {/* Navigation items */}
      <ul className="space-y-1">{children}</ul>

      {/* Divider line - adjust margin based on collapsed state */}
      <div
        className={cn(
          'my-3 h-px bg-[rgb(var(--color-border-default))]',
          collapsed ? 'mx-1' : 'mx-3'
        )}
      />
    </div>
  );
}
