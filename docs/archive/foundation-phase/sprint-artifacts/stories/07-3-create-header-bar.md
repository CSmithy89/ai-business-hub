# Story 07-3: Create Header Bar

**Epic:** EPIC-07 - UI Shell
**Status:** done
**Points:** 2
**Priority:** P0 - Critical
**Created:** 2025-12-04
**Assigned to:** Development Team

---

## User Story

**As a** user
**I want** a header bar with key actions
**So that** I can access common functions

---

## Context

The header bar serves as the top-level navigation and utility area for the HYVVE platform. It provides persistent access to essential functions: branding/logo, breadcrumb navigation, global search (command palette trigger), notifications, help resources, and user account management. The header is fixed at the top of the viewport and appears above all other UI elements.

This story builds upon the `DashboardLayout` component created in Story 07-1, which established the three-panel shell structure. The header integrates with multiple other components and epics:
- **Story 07-6 (Command Palette):** Search trigger opens command palette
- **Story 07-7 (Notification Center):** Notification bell opens notification dropdown
- **Epic 02 (Workspace Management):** Workspace selector in left section
- **Epic 01 (Authentication):** User session for profile/sign out

### Dependencies

- **Story 07-1 (Complete):** Dashboard layout provides the fixed header container
- **Epic 01 (Complete):** Authentication provides user session and sign-out functionality
- **Epic 02 (Complete):** Workspace management provides workspace switcher component
- **Story 07-6 (Future):** Command palette integration for search trigger
- **Story 07-7 (Future):** Notification center integration for notification dropdown

### Wireframe Reference

**SH-03: Header Bar with Dropdowns**
Location: `/home/chris/projects/work/Ai Bussiness Hub/docs/design/wireframes/Finished wireframes and html files/sh-03_header_bar_with_dropdowns/code.html`

Key design elements from wireframe:
- Fixed header: 60px height, full width, top border
- Left section: Logo + brand name + divider + workspace selector
- Center section: Breadcrumb navigation (hidden on mobile <768px)
- Right section: Search trigger + notification bell + help button + user menu
- Workspace dropdown: 280px width with workspace cards, create workspace action
- Notification dropdown: 380px width with notification list, mark all read action
- User menu dropdown: 240px width with profile, settings, theme toggle, sign out

---

## Acceptance Criteria

### AC-1: Header Structure and Layout
- [ ] Header component renders at fixed top position (z-50)
- [ ] Height: 60px (--header-height CSS variable)
- [ ] Full width with border-bottom and shadow-xs
- [ ] Three-column flex layout: left, center, right sections
- [ ] Responsive behavior:
  - Mobile (<768px): Hide breadcrumbs, compact spacing
  - Tablet/Desktop (≥768px): Show all elements

### AC-2: Left Section - Branding and Workspace
- [ ] Logo/brand on left with HYVVE branding:
  - Icon: Primary red square with horizontal rule symbol
  - Text: "HYVVE" in bold, tracking-tight
  - Clickable link to /dashboard
- [ ] Vertical divider after branding (1px, height 28px)
- [ ] Workspace selector button:
  - Workspace avatar (gradient background with initials)
  - Workspace name (truncate if long)
  - Dropdown indicator (expand_more icon)
  - Opens workspace switcher dropdown on click
- [ ] Workspace dropdown renders correctly (Epic 02 component integration)

### AC-3: Center Section - Breadcrumb Navigation
- [ ] Breadcrumb navigation displays current page path
- [ ] Format: Module → Section → Current Page
  - Example: "CRM → Contacts → Acme Corp"
  - Example: "Dashboard" (single item for home)
- [ ] Breadcrumb items:
  - All items except last are clickable links
  - Last item is current page (non-clickable, primary color)
  - Separated by chevron_right icon
- [ ] Hidden on mobile (<768px) to save space
- [ ] Responsive text truncation if breadcrumb too long

### AC-4: Right Section - Search Trigger
- [ ] Search trigger button displays:
  - Search icon (Material Symbol: search)
  - Placeholder text: "Search..."
  - Keyboard hint: "⌘K" badge on right
- [ ] Rounded full border, secondary background
- [ ] Width: Auto-expand with content (min-width on desktop)
- [ ] Hover state: Tertiary background
- [ ] Click opens command palette (integration point for Story 07-6)
- [ ] Keyboard shortcut Cmd/Ctrl+K also opens palette (Story 07-8)

### AC-5: Right Section - Notification Bell
- [ ] Notification bell icon (Material Symbol: notifications)
- [ ] Unread count badge:
  - Position: Top-right corner of icon
  - Color: Error red background, white text
  - Size: 18px circle, font size 11px
  - Hidden when count is 0
- [ ] Click opens notification dropdown (integration point for Story 07-7)
- [ ] Hover state: Tertiary background

### AC-6: Right Section - Help Button
- [ ] Help icon button (Material Symbol: help)
- [ ] Click opens help modal or navigates to help page
- [ ] Hover state: Tertiary background
- [ ] Accessible label: "Help & Support"

### AC-7: Right Section - User Menu Dropdown
- [ ] User menu button displays:
  - User avatar (gradient background with initials from name)
  - Dropdown indicator (expand_more icon)
- [ ] Click opens user menu dropdown
- [ ] Dropdown displays:
  - User info header: Avatar, full name, email (truncated)
  - Profile link (person icon)
  - Account Settings link (settings icon)
  - Divider
  - Theme toggle (desktop_windows icon, Light/Dark selector)
  - Divider
  - Sign out action (logout icon, red text)
- [ ] Dropdown width: 240px, positioned right-aligned
- [ ] Theme toggle updates theme (integration with Story 07-5)
- [ ] Sign out clears session and redirects to sign-in (Epic 01 integration)

---

## Technical Approach

### Component Structure

```
apps/web/src/components/shell/
├── Header.tsx                      # Main header component (refactor from placeholder)
├── HeaderSearchTrigger.tsx         # Search/command palette trigger button
├── HeaderNotificationBell.tsx      # Notification bell with badge
├── HeaderUserMenu.tsx              # User menu dropdown with profile/settings/sign out
├── HeaderBreadcrumbs.tsx           # Breadcrumb navigation
└── HeaderWorkspaceSelector.tsx     # Workspace selector (wraps Epic 02 component)
```

### Implementation Details

#### 1. Header Component (`Header.tsx`)

Refactor existing placeholder component to full implementation:

```typescript
'use client';

import Link from 'next/link';
import { HeaderBreadcrumbs } from './HeaderBreadcrumbs';
import { HeaderWorkspaceSelector } from './HeaderWorkspaceSelector';
import { HeaderSearchTrigger } from './HeaderSearchTrigger';
import { HeaderNotificationBell } from './HeaderNotificationBell';
import { HeaderUserMenu } from './HeaderUserMenu';
import { cn } from '@/lib/utils';

export function Header() {
  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'flex h-[60px] items-center justify-between',
        'border-b border-[rgb(var(--color-border-default))]',
        'bg-[rgb(var(--color-bg-surface))] px-6 shadow-xs'
      )}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Logo/Brand */}
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-90">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[rgb(var(--color-primary-500))]">
            <span
              className="material-symbols-outlined text-white"
              style={{ fontSize: '20px' }}
            >
              horizontal_rule
            </span>
          </div>
          <span className="text-xl font-bold tracking-tight text-[rgb(var(--color-text-primary))]">
            HYVVE
          </span>
        </Link>

        {/* Divider */}
        <div className="h-7 w-px bg-[rgb(var(--color-border-default))]" />

        {/* Workspace Selector */}
        <HeaderWorkspaceSelector />
      </div>

      {/* Center Section - Breadcrumbs */}
      <div className="hidden items-center gap-2 md:flex">
        <HeaderBreadcrumbs />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <HeaderSearchTrigger />
        <HeaderNotificationBell />
        <HeaderHelpButton />
        <HeaderUserMenu />
      </div>
    </header>
  );
}

// Help button inline component
function HeaderHelpButton() {
  return (
    <button
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-md',
        'transition-colors hover:bg-[rgb(var(--color-bg-tertiary))]'
      )}
      aria-label="Help & Support"
      onClick={() => {
        // TODO: Open help modal or navigate to help page
        console.log('Help clicked');
      }}
    >
      <span
        className="material-symbols-outlined text-[rgb(var(--color-text-secondary))]"
        style={{ fontSize: '22px' }}
      >
        help
      </span>
    </button>
  );
}
```

#### 2. Workspace Selector (`HeaderWorkspaceSelector.tsx`)

```typescript
'use client';

import { WorkspaceSelector } from '@/components/workspace-selector'; // From Epic 02
import { useWorkspaceContext } from '@/contexts/workspace-context'; // From Epic 02
import { cn } from '@/lib/utils';

export function HeaderWorkspaceSelector() {
  const { currentWorkspace } = useWorkspaceContext();

  if (!currentWorkspace) return null;

  // Generate initials from workspace name
  const initials = currentWorkspace.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative">
      <WorkspaceSelector>
        <button
          className={cn(
            'flex items-center gap-2 rounded-md p-[6px_10px]',
            'transition-colors hover:bg-[rgb(var(--color-bg-tertiary))]'
          )}
        >
          {/* Workspace Avatar */}
          <div
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-md',
              'bg-gradient-to-br from-[rgb(var(--color-primary-500))] to-[rgb(var(--color-warning-500))]',
              'text-sm font-semibold text-white'
            )}
          >
            {initials}
          </div>

          {/* Workspace Name */}
          <span className="text-sm font-medium text-[rgb(var(--color-text-primary))]">
            {currentWorkspace.name}
          </span>

          {/* Dropdown Indicator */}
          <span
            className="material-symbols-outlined text-[rgb(var(--color-text-secondary))]"
            style={{ fontSize: '16px' }}
          >
            expand_more
          </span>
        </button>
      </WorkspaceSelector>
    </div>
  );
}
```

#### 3. Breadcrumbs Component (`HeaderBreadcrumbs.tsx`)

```typescript
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function HeaderBreadcrumbs() {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const items = generateBreadcrumbs(pathname);

  if (items.length === 0) return null;

  return (
    <nav className="flex items-center gap-2" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={item.href} className="flex items-center gap-2">
            {index > 0 && (
              <span
                className="material-symbols-outlined text-[rgb(var(--color-text-muted))]"
                style={{ fontSize: '16px' }}
              >
                chevron_right
              </span>
            )}

            {isLast ? (
              <span className="text-sm font-medium text-[rgb(var(--color-text-primary))]">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  'text-sm text-[rgb(var(--color-text-secondary))]',
                  'transition-colors hover:text-[rgb(var(--color-primary-500))]'
                )}
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

// Helper function to generate breadcrumb items from pathname
function generateBreadcrumbs(pathname: string): { label: string; href: string }[] {
  // Remove leading/trailing slashes and split
  const segments = pathname.replace(/^\/|\/$/g, '').split('/');

  // Special cases
  if (segments.length === 0 || (segments.length === 1 && segments[0] === '')) {
    return [{ label: 'Home', href: '/' }];
  }

  if (segments[0] === 'dashboard' && segments.length === 1) {
    return [{ label: 'Dashboard', href: '/dashboard' }];
  }

  // Build breadcrumb trail
  const items: { label: string; href: string }[] = [];
  let currentPath = '';

  segments.forEach((segment) => {
    currentPath += `/${segment}`;

    // Convert segment to readable label
    const label = segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    items.push({
      label,
      href: currentPath,
    });
  });

  return items;
}
```

#### 4. Search Trigger (`HeaderSearchTrigger.tsx`)

```typescript
'use client';

import { useUIStore } from '@/stores/ui';
import { cn } from '@/lib/utils';

export function HeaderSearchTrigger() {
  const { openCommandPalette } = useUIStore();

  return (
    <button
      onClick={openCommandPalette}
      className={cn(
        'flex h-9 items-center gap-2 rounded-full',
        'border border-[rgb(var(--color-border-default))]',
        'bg-[rgb(var(--color-bg-secondary))] px-3.5',
        'transition-colors hover:bg-[rgb(var(--color-bg-tertiary))]'
      )}
      aria-label="Open search"
    >
      <span
        className="material-symbols-outlined text-[rgb(var(--color-text-muted))]"
        style={{ fontSize: '18px' }}
      >
        search
      </span>
      <span className="text-sm text-[rgb(var(--color-text-muted))]">Search...</span>
      <div className="ml-auto rounded-sm bg-[rgb(var(--color-border-default))] px-1.5 py-0.5 text-xs font-medium text-[rgb(var(--color-text-secondary))]">
        ⌘K
      </div>
    </button>
  );
}
```

#### 5. Notification Bell (`HeaderNotificationBell.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { NotificationDropdown } from '@/components/notification-center'; // From Story 07-7
import { useNotificationCount } from '@/hooks/use-notification-count'; // Mock hook
import { cn } from '@/lib/utils';

export function HeaderNotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = useNotificationCount(); // Returns mock count for now

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-md',
          'transition-colors hover:bg-[rgb(var(--color-bg-tertiary))]'
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <span
          className="material-symbols-outlined text-[rgb(var(--color-text-secondary))]"
          style={{ fontSize: '22px' }}
        >
          notifications
        </span>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <div
            className={cn(
              'absolute top-1 right-1 flex h-[18px] w-[18px]',
              'items-center justify-center rounded-full',
              'bg-[rgb(var(--color-error-500))] text-[11px] font-semibold text-white'
            )}
          >
            {unreadCount}
          </div>
        )}
      </button>

      {/* Notification Dropdown (Story 07-7 integration) */}
      {isOpen && (
        <NotificationDropdown
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
```

#### 6. User Menu (`HeaderUserMenu.tsx`)

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/contexts/session-context'; // From Epic 01
import { useTheme } from 'next-themes'; // From Story 07-5
import { signOut } from '@/lib/auth-client'; // From Epic 01
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function HeaderUserMenu() {
  const { user } = useSession();
  const { theme, setTheme } = useTheme();

  if (!user) return null;

  // Generate initials from user name
  const initials = user.name
    ?.split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/sign-in';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-1.5 rounded-md p-1',
            'transition-colors hover:bg-[rgb(var(--color-bg-tertiary))]'
          )}
          aria-label="User menu"
        >
          {/* User Avatar */}
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full',
              'bg-gradient-to-br from-[rgb(var(--color-info-500))] to-purple-500',
              'text-sm font-semibold text-white'
            )}
          >
            {initials}
          </div>

          {/* Dropdown Indicator */}
          <span
            className="material-symbols-outlined text-[rgb(var(--color-text-secondary))]"
            style={{ fontSize: '16px' }}
          >
            expand_more
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[240px]">
        {/* User Info Header */}
        <div className="flex items-center gap-3 border-b border-[rgb(var(--color-border-default))] px-3 pb-3 pt-1">
          <div
            className={cn(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
              'bg-gradient-to-br from-[rgb(var(--color-info-500))] to-purple-500',
              'text-base font-semibold text-white'
            )}
          >
            {initials}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">
              {user.name}
            </p>
            <p className="truncate text-xs text-[rgb(var(--color-text-secondary))]">
              {user.email}
            </p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-2">
          <DropdownMenuItem asChild>
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-3 px-3 py-2.5"
            >
              <span
                className="material-symbols-outlined text-[rgb(var(--color-text-secondary))]"
                style={{ fontSize: '20px' }}
              >
                person
              </span>
              <span className="text-sm">Profile</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 px-3 py-2.5"
            >
              <span
                className="material-symbols-outlined text-[rgb(var(--color-text-secondary))]"
                style={{ fontSize: '20px' }}
              >
                settings
              </span>
              <span className="text-sm">Account Settings</span>
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator />

        {/* Theme Toggle */}
        <div className="px-3 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <span
                className="material-symbols-outlined text-[rgb(var(--color-text-secondary))]"
                style={{ fontSize: '20px' }}
              >
                desktop_windows
              </span>
              <span>Theme</span>
            </div>
            <div className="flex items-center rounded-md bg-[rgb(var(--color-bg-secondary))] p-0.5 text-xs">
              <button
                onClick={() => setTheme('light')}
                className={cn(
                  'rounded-sm px-2 py-0.5',
                  theme === 'light'
                    ? 'bg-[rgb(var(--color-bg-surface))] shadow-sm'
                    : 'text-[rgb(var(--color-text-secondary))]'
                )}
              >
                Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={cn(
                  'rounded-sm px-2 py-0.5',
                  theme === 'dark'
                    ? 'bg-[rgb(var(--color-bg-surface))] shadow-sm'
                    : 'text-[rgb(var(--color-text-secondary))]'
                )}
              >
                Dark
              </button>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Sign Out */}
        <div className="pt-1">
          <DropdownMenuItem
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 text-[rgb(var(--color-error-500))]"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '20px' }}
            >
              logout
            </span>
            <span className="text-sm">Sign Out</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### State Management

Update `apps/web/src/stores/ui.ts` to include command palette state (already defined in tech spec):

```typescript
interface UIState {
  // ... existing sidebar/chat panel state

  // Command palette state
  commandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
}
```

### Mock Data Hooks

Create hooks for notification and user data:

```typescript
// apps/web/src/hooks/use-notification-count.ts
export function useNotificationCount(): number {
  // TODO: Replace with real API call in Story 07-7
  return 3; // Mock unread count
}
```

---

## Implementation Tasks

### Task 1: Refactor Header Component Structure
- [ ] Create component files in `apps/web/src/components/shell/`:
  - `HeaderBreadcrumbs.tsx`
  - `HeaderWorkspaceSelector.tsx`
  - `HeaderSearchTrigger.tsx`
  - `HeaderNotificationBell.tsx`
  - `HeaderUserMenu.tsx`
- [ ] Refactor `Header.tsx` from placeholder to full implementation
- [ ] Import and integrate all subcomponents

### Task 2: Implement Left Section (Branding + Workspace)
- [ ] Add HYVVE logo with primary red square background
- [ ] Make logo clickable link to /dashboard
- [ ] Add vertical divider after logo
- [ ] Create `HeaderWorkspaceSelector` component
- [ ] Integrate with Epic 02 `WorkspaceSelector` dropdown
- [ ] Generate workspace initials from name
- [ ] Add gradient avatar background

### Task 3: Implement Center Section (Breadcrumbs)
- [ ] Create `HeaderBreadcrumbs` component
- [ ] Implement breadcrumb generation from pathname
- [ ] Add chevron separators between items
- [ ] Style last item as non-clickable (current page)
- [ ] Make previous items clickable links
- [ ] Hide on mobile (<768px) with md:flex utility

### Task 4: Implement Right Section (Search Trigger)
- [ ] Create `HeaderSearchTrigger` component
- [ ] Add search icon, placeholder text, and ⌘K badge
- [ ] Style with rounded-full border and secondary background
- [ ] Connect to `openCommandPalette()` from UI store
- [ ] Add hover state (tertiary background)

### Task 5: Implement Right Section (Notification Bell)
- [ ] Create `HeaderNotificationBell` component
- [ ] Add notification icon (Material Symbol)
- [ ] Create `use-notification-count` hook with mock data
- [ ] Implement unread count badge:
  - Position at top-right corner
  - Error red background, white text
  - Hide when count is 0
- [ ] Add dropdown toggle state (integration point for Story 07-7)

### Task 6: Implement Right Section (Help Button)
- [ ] Add help icon button (Material Symbol: help)
- [ ] Add hover state (tertiary background)
- [ ] Add accessible label (aria-label)
- [ ] Add click handler (console.log for now, TODO for Story 07-7)

### Task 7: Implement Right Section (User Menu)
- [ ] Create `HeaderUserMenu` component
- [ ] Generate user initials from session user name
- [ ] Render gradient avatar background
- [ ] Install/verify `@radix-ui/react-dropdown-menu` (shadcn/ui)
- [ ] Implement dropdown with:
  - User info header (avatar, name, email)
  - Profile link
  - Account Settings link
  - Theme toggle (Light/Dark buttons)
  - Sign out action
- [ ] Integrate with Epic 01 session context
- [ ] Integrate with Story 07-5 theme (next-themes)
- [ ] Wire up sign out to Epic 01 signOut function

### Task 8: Update UI Store
- [ ] Add `commandPaletteOpen`, `openCommandPalette()`, `closeCommandPalette()` to UI store
- [ ] Ensure state typing correct

### Task 9: Test Responsive Behavior
- [ ] Verify header fixed at top (z-50)
- [ ] Test breadcrumbs hide on mobile (<768px)
- [ ] Verify all dropdowns position correctly
- [ ] Test with various content lengths (long workspace names, etc.)
- [ ] Verify header height consistent (60px)

### Task 10: Visual QA Against Wireframe
- [ ] Compare with SH-03 wireframe for pixel-perfect alignment
- [ ] Verify colors match Style Guide (light/dark modes)
- [ ] Test hover states on all buttons
- [ ] Verify dropdown styling (width, border, shadow)
- [ ] Test spacing and typography
- [ ] Verify badge positioning and styling

---

## Testing Requirements

### Unit Tests

**File:** `apps/web/src/components/shell/__tests__/HeaderBreadcrumbs.test.tsx`

```typescript
describe('HeaderBreadcrumbs', () => {
  it('generates breadcrumbs from pathname', () => {});
  it('renders chevron separators between items', () => {});
  it('makes previous items clickable links', () => {});
  it('renders last item as non-clickable', () => {});
  it('handles dashboard root correctly', () => {});
  it('converts segments to readable labels', () => {});
});
```

**File:** `apps/web/src/components/shell/__tests__/HeaderUserMenu.test.tsx`

```typescript
describe('HeaderUserMenu', () => {
  it('renders user avatar with initials', () => {});
  it('displays user name and email in dropdown', () => {});
  it('renders profile and settings links', () => {});
  it('renders theme toggle with current theme selected', () => {});
  it('calls setTheme on theme button click', () => {});
  it('calls signOut on sign out click', () => {});
  it('redirects to /sign-in after sign out', () => {});
});
```

### Visual Tests (Storybook)

**File:** `apps/web/src/components/shell/Header.stories.tsx`

```typescript
export default {
  title: 'Shell/Header',
  component: Header,
} as Meta;

export const Default = () => <Header />;
export const WithNotifications = () => <Header />;
export const DarkMode = () => <Header />;
export const Mobile = () => <Header />;
export const WithLongBreadcrumbs = () => <Header />;
```

### Interaction Tests (Playwright)

**File:** `apps/web/e2e/header.spec.ts`

```typescript
test.describe('Header', () => {
  test('renders all header elements', async ({ page }) => {});
  test('logo navigates to dashboard', async ({ page }) => {});
  test('workspace selector opens dropdown', async ({ page }) => {});
  test('breadcrumbs show current page path', async ({ page }) => {});
  test('search trigger opens command palette', async ({ page }) => {});
  test('notification bell shows unread count', async ({ page }) => {});
  test('notification bell opens dropdown', async ({ page }) => {});
  test('help button is clickable', async ({ page }) => {});
  test('user menu opens dropdown', async ({ page }) => {});
  test('theme toggle switches theme', async ({ page }) => {});
  test('sign out clears session', async ({ page }) => {});
  test('breadcrumbs hide on mobile', async ({ page }) => {});
});
```

### Accessibility Tests

- [ ] Run axe DevTools on header (no violations)
- [ ] Test keyboard navigation (Tab through all buttons)
- [ ] Test with screen reader (NVDA/VoiceOver)
- [ ] Verify all buttons have accessible labels
- [ ] Verify color contrast ratios (4.5:1 for text)
- [ ] Test dropdown keyboard navigation (Escape to close)

### Manual Testing Checklist

- [ ] Header renders fixed at top of page
- [ ] Logo clickable and navigates to dashboard
- [ ] Workspace selector shows current workspace
- [ ] Workspace dropdown opens on click
- [ ] Breadcrumbs show correct current path
- [ ] Breadcrumbs hide on mobile (<768px)
- [ ] Search trigger shows ⌘K hint
- [ ] Search trigger opens command palette (Story 07-6)
- [ ] Notification bell shows unread count badge
- [ ] Notification bell badge hidden when count is 0
- [ ] Notification dropdown opens on click (Story 07-7)
- [ ] Help button clickable
- [ ] User menu opens dropdown on click
- [ ] User menu shows correct user info
- [ ] Profile link navigates to profile page
- [ ] Settings link navigates to settings page
- [ ] Theme toggle switches between light/dark
- [ ] Sign out clears session and redirects
- [ ] All hover states work correctly
- [ ] Dark mode styling correct
- [ ] Light mode styling correct

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All implementation tasks completed
- [ ] Unit tests written and passing (80%+ coverage)
- [ ] Visual tests created in Storybook
- [ ] Playwright interaction tests passing
- [ ] Accessibility tests passing (axe, keyboard nav, screen reader)
- [ ] Manual QA completed against wireframe
- [ ] Code reviewed by senior developer
- [ ] No console errors or warnings
- [ ] Works in light and dark modes
- [ ] Responsive behavior correct (mobile/tablet/desktop)
- [ ] Integration points documented for Stories 07-6, 07-7
- [ ] PR approved and merged to epic branch

---

## Notes

### Design Tokens Used

From `apps/web/src/styles/globals.css`:

```css
--color-bg-primary: Light #FFFBF5 / Dark #0a0a0b
--color-bg-secondary: Light #f9f7f2 / Dark #111113
--color-bg-surface: Light #ffffff / Dark #232326
--color-bg-tertiary: Light #f5f3ee / Dark #1a1a1d
--color-border-default: Light #e5e5e5 / Dark #27272a
--color-text-primary: Light #1a1a1a / Dark #fafafa
--color-text-secondary: Light #6b7280 / Dark #a1a1aa
--color-text-muted: Light #9ca3af / Dark #71717a
--color-primary-500: #FF6B6B (same in both modes)
--color-accent-500: #20B2AA (same in both modes)
--color-info-500: #4B7BEC (same in both modes)
--color-error-500: #EF4444 (same in both modes)
--color-warning-500: #F59E0B (same in both modes)
--header-height: 60px
```

### Integration Points

- **Epic 01 Authentication:** `useSession()` hook provides user session, `signOut()` function
- **Epic 02 Workspace Context:** `useWorkspaceContext()` hook provides current workspace
- **Epic 02 Workspace Selector:** `WorkspaceSwitcher` component wraps workspace selector button
- **Story 07-5 Theme:** `useTheme()` hook from next-themes for theme toggle
- **Story 07-6 Command Palette:** Search trigger calls `openCommandPalette()` (integration point)
- **Story 07-7 Notification Center:** Notification bell renders `NotificationDropdown` (integration point)
- **Story 07-1 Dashboard Layout:** Header renders at top of layout (fixed position)

### Future Enhancements (Not in This Story)

- Real-time notification count updates via WebSocket
- Unread notification indicator dot (in addition to count badge)
- Global keyboard shortcut for help (Cmd+?)
- User avatar upload (currently uses initials)
- Recent searches in command palette preview
- Notification preferences quick settings in dropdown
- Multiple workspaces quick-switch (keyboard shortcut)

---

## Related Stories

- **Story 07-1:** Dashboard Layout Component (dependency - complete)
- **Story 07-2:** Create Sidebar Navigation (related - complete)
- **Story 07-5:** Implement Dark/Light Mode (integration for theme toggle)
- **Story 07-6:** Create Command Palette (integration for search trigger)
- **Story 07-7:** Create Notification Center (integration for notification bell)
- **Story 07-8:** Implement Keyboard Shortcuts (integration for Cmd+K)

---

_Story created by BMAD create-story workflow_
_Epic reference: docs/epics/EPIC-07-ui-shell.md_
_Tech spec: docs/archive/foundation-phase/sprint-artifacts/tech-spec-epic-07.md_
_Wireframe: SH-03 Header Bar with Dropdowns_
