/**
 * Mobile Bottom Navigation Bar
 *
 * Fixed bottom navigation bar for mobile devices.
 * Provides quick access to key sections: Home, Approvals, Chat, More.
 *
 * Epic: 07 - UI Shell
 * Story: 07-10 - Create Mobile Navigation
 */

'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useUIStore } from '@/stores/ui';
import { useApprovalCount } from '@/hooks/use-approval-count';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BottomNavItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  action?: 'toggleChat' | 'openDrawer';
  badge?: number;
}

export function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { toggleChatPanel, toggleMobileMenu } = useUIStore();
  const approvalCount = useApprovalCount();

  const items: BottomNavItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: 'home',
      href: '/dashboard',
    },
    {
      id: 'approvals',
      label: 'Approvals',
      icon: 'task_alt',
      href: '/dashboard/approvals',
      badge: approvalCount,
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: 'chat',
      action: 'toggleChat',
    },
    {
      id: 'more',
      label: 'More',
      icon: 'more_horiz',
      action: 'openDrawer',
    },
  ];

  const handleItemClick = (item: BottomNavItem) => {
    if (item.action === 'toggleChat') {
      toggleChatPanel();
    } else if (item.action === 'openDrawer') {
      toggleMobileMenu();
    } else if (item.href) {
      router.push(item.href as never);
    }
  };

  const isActive = (item: BottomNavItem) => {
    if (!item.href) return false;
    if (item.href === '/dashboard') {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50
                 border-t border-[rgb(var(--color-border-default))]
                 bg-[rgb(var(--color-bg-secondary))] shadow-lg
                 md:hidden" // Only show on mobile
      aria-label="Mobile bottom navigation"
    >
      <div className="flex items-center justify-around">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            className={cn(
              'relative flex flex-1 flex-col items-center justify-center gap-1 py-2',
              'min-h-[56px] min-w-[56px]', // Touch-friendly targets (minimum 44x44px, using 56px for comfort)
              'transition-colors',
              isActive(item)
                ? 'text-[rgb(var(--color-primary))]'
                : 'text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))]'
            )}
            aria-label={item.label}
            aria-current={isActive(item) ? 'page' : undefined}
          >
            {/* Badge for approvals */}
            {item.badge !== undefined && item.badge > 0 && (
              <div className="absolute right-1/4 top-1">
                <Badge
                  variant="destructive"
                  className="h-5 min-w-[20px] rounded-full px-1 text-[10px] font-bold"
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </Badge>
              </div>
            )}

            {/* Icon */}
            <span className="material-symbols-rounded text-2xl">
              {item.icon}
            </span>

            {/* Label */}
            <span className="text-[10px] font-medium">{item.label}</span>

            {/* Active indicator */}
            {isActive(item) && (
              <div
                className="absolute bottom-0 left-1/2 h-1 w-12 -translate-x-1/2
                           rounded-t-full bg-[rgb(var(--color-primary))]"
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
