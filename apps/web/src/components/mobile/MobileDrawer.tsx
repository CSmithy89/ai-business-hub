/**
 * Mobile Drawer Navigation
 *
 * Slide-out drawer navigation for mobile devices.
 * Contains user profile, navigation items, theme toggle, and sign out.
 *
 * Epic: 07 - UI Shell
 * Story: 07-10 - Create Mobile Navigation
 */

'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useUIStore } from '@/stores/ui';
import { useApprovalCount } from '@/hooks/use-approval-count';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Mock user data - will be replaced with auth session
function useCurrentUser() {
  return {
    name: 'John Doe',
    email: 'john@example.com',
    initials: 'JD',
  };
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: number;
}

export function MobileDrawer() {
  const { mobileMenuOpen, toggleMobileMenu } = useUIStore();
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const user = useCurrentUser();
  const approvalCount = useApprovalCount();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid_view', href: '/dashboard' },
    { id: 'approvals', label: 'Approvals', icon: 'check_circle', href: '/dashboard/approvals', badge: approvalCount },
    { id: 'agents', label: 'AI Team', icon: 'smart_toy', href: '/dashboard/agents' },
    { id: 'settings', label: 'Settings', icon: 'settings', href: '/dashboard/settings' },
  ];

  const handleNavClick = (href: string) => {
    router.push(href as never);
    toggleMobileMenu();
  };

  const handleSignOut = () => {
    toggleMobileMenu();
    router.push('/auth/signin' as never);
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <Sheet open={mobileMenuOpen} onOpenChange={toggleMobileMenu}>
      <SheetContent side="left" className="w-[280px] p-0">
        {/* User Profile Section */}
        <SheetHeader className="border-b border-[rgb(var(--color-border-default))] p-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full
                         bg-gradient-to-br from-[rgb(var(--color-info))] to-purple-500
                         text-sm font-bold text-white"
            >
              {user.initials}
            </div>
            <div className="flex flex-col text-left">
              <SheetTitle className="text-base font-semibold">
                {user.name}
              </SheetTitle>
              <p className="text-xs text-[rgb(var(--color-text-secondary))]">
                {user.email}
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => handleNavClick(item.href)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors',
                'min-h-[44px]', // Touch-friendly height
                isActive(item.href)
                  ? 'bg-[rgb(var(--color-primary)/0.1)] text-[rgb(var(--color-primary))] font-medium'
                  : 'text-[rgb(var(--color-text-primary))] hover:bg-[rgb(var(--color-bg-hover))]'
              )}
            >
              <span className="material-symbols-rounded text-2xl">
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <Badge variant="default" className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </button>
          ))}
        </nav>

        {/* Theme Toggle */}
        <div className="border-t border-[rgb(var(--color-border-default))] p-4">
          <div className="flex items-center justify-between rounded-lg bg-[rgb(var(--color-bg-tertiary))] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-rounded text-2xl text-[rgb(var(--color-text-primary))]">
                {theme === 'dark' ? 'dark_mode' : 'light_mode'}
              </span>
              <span className="text-sm font-medium text-[rgb(var(--color-text-primary))]">
                Dark Mode
              </span>
            </div>
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full
                         transition-colors focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]
                         ${theme === 'dark' ? 'bg-[rgb(var(--color-primary))]' : 'bg-[rgb(var(--color-border-default))]'}`}
              aria-label="Toggle dark mode"
              role="switch"
              aria-checked={theme === 'dark'}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                           ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>
        </div>

        {/* Sign Out */}
        <div className="mt-auto border-t border-[rgb(var(--color-border-default))] p-4">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left
                       text-[rgb(var(--color-error))] transition-colors
                       hover:bg-[rgb(var(--color-error)/0.1)]
                       min-h-[44px]" // Touch-friendly height
          >
            <span className="material-symbols-rounded text-2xl">logout</span>
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
