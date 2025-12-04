/**
 * Command Palette Component
 *
 * Quick navigation and actions accessible via Cmd+K (Mac) or Ctrl+K (Windows/Linux).
 * Uses cmdk library for command palette UI with keyboard navigation support.
 *
 * Features:
 * - Search across navigation items, quick actions, and recent items
 * - Keyboard navigation (arrow keys, enter, escape)
 * - Categorized results (Recent, Navigation, Actions)
 * - Quick actions (toggle theme, sidebar, chat, etc.)
 * - Recent items tracking
 *
 * Epic: 07 - UI Shell
 * Story: 07-6 - Create Command Palette
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  CheckCircle,
  Bot,
  Settings,
  UserPlus,
  Plus,
  Moon,
  Sun,
  PanelLeftClose,
  MessageSquare,
  Search,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from 'cmdk';
import { useUIStore } from '@/stores/ui';

interface CommandItemData {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  onSelect: () => void;
}

export function CommandPalette() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const {
    isCommandPaletteOpen,
    closeCommandPalette,
    toggleSidebar,
    toggleChatPanel,
  } = useUIStore();

  const [search, setSearch] = useState('');
  const [recentItems, setRecentItems] = useState<string[]>([]);

  // Navigation items
  const navigationItems: CommandItemData[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      shortcut: '⌘D',
      onSelect: () => {
        router.push('/dashboard');
        addToRecent('Dashboard');
        closeCommandPalette();
      },
    },
    {
      id: 'approvals',
      label: 'Approvals',
      icon: CheckCircle,
      shortcut: '⌘A',
      onSelect: () => {
        router.push('/approvals');
        addToRecent('Approvals');
        closeCommandPalette();
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      shortcut: '⌘,',
      onSelect: () => {
        router.push('/settings');
        addToRecent('Settings');
        closeCommandPalette();
      },
    },
    {
      id: 'admin-events',
      label: 'Event Monitor',
      icon: Bot,
      shortcut: '⌘I',
      onSelect: () => {
        router.push('/admin/events');
        addToRecent('Event Monitor');
        closeCommandPalette();
      },
    },
  ];

  // Quick actions
  const quickActions: CommandItemData[] = [
    {
      id: 'new-contact',
      label: 'New Contact',
      icon: UserPlus,
      onSelect: () => {
        // Placeholder - will be implemented in CRM module
        console.log('Creating new contact...');
        addToRecent('New Contact');
        closeCommandPalette();
      },
    },
    {
      id: 'new-task',
      label: 'New Task',
      icon: Plus,
      onSelect: () => {
        // Placeholder - will be implemented in task module
        console.log('Creating new task...');
        addToRecent('New Task');
        closeCommandPalette();
      },
    },
    {
      id: 'toggle-theme',
      label: theme === 'dark' ? 'Light Mode' : 'Dark Mode',
      icon: theme === 'dark' ? Sun : Moon,
      onSelect: () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
        addToRecent('Toggle Theme');
        closeCommandPalette();
      },
    },
    {
      id: 'toggle-sidebar',
      label: 'Toggle Sidebar',
      icon: PanelLeftClose,
      onSelect: () => {
        toggleSidebar();
        addToRecent('Toggle Sidebar');
        closeCommandPalette();
      },
    },
    {
      id: 'toggle-chat',
      label: 'Toggle Chat',
      icon: MessageSquare,
      onSelect: () => {
        toggleChatPanel();
        addToRecent('Toggle Chat');
        closeCommandPalette();
      },
    },
  ];

  // Add item to recent items
  const addToRecent = (label: string) => {
    setRecentItems((prev) => {
      const filtered = prev.filter((item) => item !== label);
      return [label, ...filtered].slice(0, 5); // Keep only 5 most recent
    });
  };

  // Get recent items as command items
  const getRecentCommandItems = (): CommandItemData[] => {
    const allItems = [...navigationItems, ...quickActions];
    return recentItems
      .map((label) => allItems.find((item) => item.label === label))
      .filter((item): item is CommandItemData => item !== undefined);
  };

  // Reset search when dialog closes
  useEffect(() => {
    if (!isCommandPaletteOpen) {
      setSearch('');
    }
  }, [isCommandPaletteOpen]);

  const recentCommandItems = getRecentCommandItems();

  return (
    <CommandDialog
      open={isCommandPaletteOpen}
      onOpenChange={closeCommandPalette}
    >
      <div className="flex items-center border-b border-[rgb(var(--color-border))] px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <CommandInput
          placeholder="Type a command or search..."
          value={search}
          onValueChange={setSearch}
          className="flex h-14 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-[rgb(var(--color-text-muted))] disabled:cursor-not-allowed disabled:opacity-50"
        />
        <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center gap-1 rounded bg-[rgb(var(--color-bg-secondary))] px-1.5 font-mono text-[10px] font-medium text-[rgb(var(--color-text-secondary))] opacity-100">
          ESC
        </kbd>
      </div>

      <CommandList className="max-h-[400px] overflow-y-auto overflow-x-hidden p-2">
        <CommandEmpty className="py-6 text-center text-sm text-[rgb(var(--color-text-secondary))]">
          No results found.
        </CommandEmpty>

        {/* Recent Items */}
        {recentCommandItems.length > 0 && (
          <>
            <CommandGroup
              heading="Recent"
              className="text-xs font-medium uppercase tracking-wider text-[rgb(var(--color-text-muted))]"
            >
              {recentCommandItems.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={`recent-${item.id}`}
                    onSelect={item.onSelect}
                    className="flex items-center gap-3 rounded-md px-4 py-2.5 aria-selected:bg-[rgb(var(--color-bg-tertiary))] aria-selected:border-l-2 aria-selected:border-[rgb(var(--color-primary))]"
                  >
                    <Icon className="h-5 w-5 text-[rgb(var(--color-text-secondary))]" />
                    <span className="flex-1 text-sm text-[rgb(var(--color-text-primary))]">
                      {item.label}
                    </span>
                    {item.shortcut && (
                      <span className="text-xs text-[rgb(var(--color-text-muted))]">
                        {item.shortcut}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator className="my-2 h-px bg-[rgb(var(--color-border))]" />
          </>
        )}

        {/* Navigation */}
        <CommandGroup
          heading="Navigation"
          className="text-xs font-medium uppercase tracking-wider text-[rgb(var(--color-text-muted))]"
        >
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.id}
                onSelect={item.onSelect}
                className="flex items-center gap-3 rounded-md px-4 py-2.5 aria-selected:bg-[rgb(var(--color-bg-tertiary))] aria-selected:border-l-2 aria-selected:border-[rgb(var(--color-primary))]"
              >
                <Icon className="h-5 w-5 text-[rgb(var(--color-text-secondary))]" />
                <span className="flex-1 text-sm text-[rgb(var(--color-text-primary))]">
                  {item.label}
                </span>
                {item.shortcut && (
                  <span className="text-xs text-[rgb(var(--color-text-muted))]">
                    {item.shortcut}
                  </span>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator className="my-2 h-px bg-[rgb(var(--color-border))]" />

        {/* Quick Actions */}
        <CommandGroup
          heading="Actions"
          className="text-xs font-medium uppercase tracking-wider text-[rgb(var(--color-text-muted))]"
        >
          {quickActions.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.id}
                onSelect={item.onSelect}
                className="flex items-center gap-3 rounded-md px-4 py-2.5 aria-selected:bg-[rgb(var(--color-bg-tertiary))] aria-selected:border-l-2 aria-selected:border-[rgb(var(--color-primary))]"
              >
                <Icon className="h-5 w-5 text-[rgb(var(--color-text-secondary))]" />
                <span className="flex-1 text-sm text-[rgb(var(--color-text-primary))]">
                  {item.label}
                </span>
                {item.shortcut && (
                  <span className="text-xs text-[rgb(var(--color-text-muted))]">
                    {item.shortcut}
                  </span>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>

      {/* Footer with keyboard hints */}
      <div className="flex items-center justify-between border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg-secondary))] px-4 py-2.5">
        <div className="flex items-center gap-4 text-xs text-[rgb(var(--color-text-secondary))]">
          <div className="flex items-center gap-1.5">
            <kbd className="inline-flex h-5 items-center rounded bg-[rgb(var(--color-bg-tertiary))] px-1.5 font-mono text-[10px]">
              ↑↓
            </kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="inline-flex h-5 items-center rounded bg-[rgb(var(--color-bg-tertiary))] px-1.5 font-mono text-[10px]">
              ↵
            </kbd>
            <span>Select</span>
          </div>
        </div>
      </div>
    </CommandDialog>
  );
}
