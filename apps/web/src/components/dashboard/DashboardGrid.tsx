'use client';

/**
 * Dashboard Grid Component
 *
 * Responsive grid layout for rendering agent-driven widgets.
 * Layout adapts based on screen size:
 * - Mobile (<640px): 1 column
 * - Tablet (640px-1024px): 2 columns
 * - Desktop (>1024px): 3 columns
 *
 * This component wraps children (typically DashboardSlots) in a
 * responsive grid container for widget display.
 *
 * @example
 * <DashboardGrid>
 *   <DashboardSlots />
 * </DashboardGrid>
 *
 * Epic: DM-03 | Story: DM-03.4 - Dashboard Page Integration
 * @see docs/modules/bm-dm/epics/epic-dm-03-tech-spec.md
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface DashboardGridProps {
  /** Child components (widgets rendered by DashboardSlots) */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function DashboardGrid({ children, className }: DashboardGridProps) {
  return (
    <div
      className={cn(
        // Base grid layout with gap
        'grid gap-4',
        // Responsive columns: 1 mobile, 2 tablet, 3 desktop
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        // Auto-rows to handle dynamic widget heights
        'auto-rows-auto',
        className
      )}
      role="region"
      aria-label="Dashboard widgets"
      data-testid="dashboard-grid"
    >
      {children}
    </div>
  );
}
