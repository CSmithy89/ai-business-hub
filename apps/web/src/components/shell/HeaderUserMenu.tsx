/**
 * Header User Menu Component
 *
 * Dropdown menu for user actions: profile, settings, theme toggle, sign out.
 * Uses shadcn/ui DropdownMenu component.
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggleItems } from '@/components/theme/ThemeToggle';

// Mock user data - will be replaced with auth session
function useCurrentUser() {
  return {
    name: 'John Doe',
    email: 'john@example.com',
    initials: 'JD',
  };
}

export function HeaderUserMenu() {
  const user = useCurrentUser();
  const router = useRouter();

  const handleSignOut = () => {
    // TODO: Implement actual sign out logic from Epic 01
    router.push('/sign-in');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="User menu"
          className="flex h-9 w-9 items-center justify-center rounded-full
                     bg-gradient-to-br from-[rgb(var(--color-info))] to-purple-500
                     text-xs font-bold text-white transition-transform
                     hover:scale-105 focus:outline-none focus:ring-2
                     focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2"
          type="button"
        >
          {user.initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <ThemeToggleItems />
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
