/**
 * Mobile Sidebar Component
 *
 * Drawer overlay for sidebar navigation on tablet devices (768-1024px).
 * Features:
 * - Slides in from left with dark backdrop
 * - Swipe gesture support for closing
 * - Touch-friendly navigation items (48px minimum height)
 * - Hamburger menu trigger
 * - Uses shadcn Sheet component
 *
 * Story: 16-2 - Implement Tablet Layout
 */

'use client';

import { useParams } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { SidebarNav } from '@/components/shell/SidebarNav';
import { SidebarWorkspaceSwitcher } from '@/components/shell/SidebarWorkspaceSwitcher';
import { BusinessSwitcher } from '@/components/shell/BusinessSwitcher';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileSidebarProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Callback when drawer should close */
  onOpenChange: (open: boolean) => void;
}

/**
 * Mobile sidebar drawer for tablet devices
 */
export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const params = useParams();

  // Detect if we're in business context
  const isBusinessContext = !!params.businessId;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className={cn(
          'w-[280px] p-0 flex flex-col',
          'bg-[rgb(var(--color-bg-secondary))]'
        )}
      >
        {/* Header with close button */}
        <SheetHeader className="border-b border-[rgb(var(--color-border-default))] p-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">
              Navigation
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>

        {/* Navigation Items - with touch-friendly sizing */}
        <div className="flex-1 overflow-y-auto">
          <SidebarNav collapsed={false} />
        </div>

        {/* Bottom section: Business & Workspace Switchers */}
        <div className="mt-auto border-t border-[rgb(var(--color-border-default))] p-4 space-y-3">
          {/* Business Switcher - only show when in business context */}
          {isBusinessContext && <BusinessSwitcher collapsed={false} />}

          {/* Workspace Switcher */}
          <SidebarWorkspaceSwitcher collapsed={false} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Hamburger menu trigger button
 * Should be placed in the header/toolbar
 */
export function MobileSidebarTrigger({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'h-10 w-10 touch-target-min',
        'text-[rgb(var(--color-text-primary))]',
        'hover:bg-[rgb(var(--color-bg-tertiary))]'
      )}
      onClick={onClick}
      aria-label="Open navigation menu"
    >
      <Menu className="h-6 w-6" />
    </Button>
  );
}
