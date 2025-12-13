/**
 * Mobile Bottom Navigation Bar
 *
 * Fixed bottom navigation bar for mobile devices (<768px).
 * Provides quick access to key sections: Home, Businesses, Approvals, AI Team, More.
 *
 * Epic: 07 - UI Shell
 * Story: 07-10 - Create Mobile Navigation
 * Epic: 16 - Premium Polish & Advanced Features
 * Story: 16-3 - Implement Mobile Layout
 */

'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Home, Building2, CheckCircle, Bot, MoreHorizontal } from 'lucide-react';
import { useUIStore } from '@/stores/ui';
import { useApprovalCount } from '@/hooks/use-approval-count';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface BottomNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  action?: 'openDrawer';
  badge?: number;
}

export function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const { toggleMobileMenu } = useUIStore();
  const approvalCount = useApprovalCount();

  const items: BottomNavItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      href: '/dashboard',
    },
    {
      id: 'businesses',
      label: 'Business',
      icon: Building2,
      href: '/dashboard/businesses',
    },
    {
      id: 'approvals',
      label: 'Approvals',
      icon: CheckCircle,
      href: '/dashboard/approvals',
      badge: approvalCount,
    },
    {
      id: 'agents',
      label: 'AI Team',
      icon: Bot,
      href: '/dashboard/agents',
    },
    {
      id: 'more',
      label: 'More',
      icon: MoreHorizontal,
      action: 'openDrawer',
    },
  ];

  const handleItemClick = (item: BottomNavItem) => {
    if (item.action === 'openDrawer') {
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
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'border-t border-[rgb(var(--color-border-default))]',
        'bg-[rgb(var(--color-bg-secondary))] shadow-lg',
        'md:hidden', // Only show on mobile (<768px)
        // Safe area support for iOS/Android notches
        'pb-safe'
      )}
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
      }}
      aria-label="Mobile bottom navigation"
    >
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-1 py-2',
                'min-h-[56px] min-w-[56px]', // Touch-friendly targets (minimum 44x44px, using 56px for comfort)
                'transition-colors duration-150',
                isActive(item)
                  ? 'text-[rgb(var(--color-primary-500))]'
                  : 'text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))] active:scale-95'
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

              {/* Icon - Lucide Icon */}
              <Icon className="h-6 w-6" strokeWidth={isActive(item) ? 2.5 : 2} />

              {/* Label */}
              <span className={cn(
                'text-[10px]',
                isActive(item) ? 'font-semibold' : 'font-medium'
              )}>
                {item.label}
              </span>

              {/* Active indicator */}
              {isActive(item) && (
                <div
                  className="absolute bottom-0 left-1/2 h-1 w-12 -translate-x-1/2
                             rounded-t-full bg-[rgb(var(--color-primary-500))]"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
