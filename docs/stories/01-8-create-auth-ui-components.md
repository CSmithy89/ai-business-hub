# Story 01-8: Create Auth UI Components

**Story ID:** 01-8
**Epic:** EPIC-01 - Authentication System
**Status:** done
**Points:** 3
**Priority:** P0

---

## User Story

**As a** platform user
**I want** reusable authentication UI components and layouts
**So that** I have a consistent, polished experience when accessing protected content and managing my profile

---

## Acceptance Criteria

- [x] Create UserAvatar component with image fallback to initials and configurable sizes (sm, md, lg)
- [x] Create UserMenu component as dropdown showing user info, navigation links, and sign-out action
- [x] Create AuthGuard component wrapper for protected routes with loading/redirect states
- [x] Create useAuth custom hook providing user data, auth state, and sign-out function
- [x] Create Settings Layout component with sidebar navigation for settings sections
- [x] All components follow HYVVE design system (brand color #FF6B6B, Tailwind CSS)
- [x] Components are fully typed with TypeScript
- [x] Components are responsive and accessible

---

## Description

This story creates the final set of authentication-related UI components for the HYVVE platform. While Stories 01-2 through 01-7 implemented specific auth flows (registration, sign-in, verification, password reset, sessions), this story focuses on **reusable shared components** that will be used throughout the application.

These components provide the UI foundation for:
- Displaying user identity (avatar, name, email)
- Protecting authenticated routes
- Navigating settings pages
- Managing authentication state in React components

This completes Epic 01 by providing all the UI building blocks needed for a complete authentication experience.

---

## Technical Requirements

### 1. UserAvatar Component

**Location:** `apps/web/src/components/auth/user-avatar.tsx`

**Purpose:** Display user profile picture or initials fallback

**Props:**
```typescript
interface UserAvatarProps {
  user: {
    name?: string | null
    email: string
    image?: string | null
  }
  size?: 'sm' | 'md' | 'lg'
  className?: string
}
```

**Behavior:**
- **With image:** Display user's profile picture (from Google OAuth or future upload)
- **Without image:** Display first 2 initials from name (e.g., "John Smith" → "JS")
- **Fallback:** If no name, use first 2 letters of email (e.g., "john@example.com" → "JO")

**Sizes:**
- `sm`: 32px (8 in Tailwind) - for lists, inline mentions
- `md`: 48px (12 in Tailwind) - default, for cards
- `lg`: 64px (16 in Tailwind) - for headers, profile pages

**Design Specs:**
- Circular (`rounded-full`)
- Background: Warm gray (#E7E5E4 or `bg-stone-200`)
- Text: Dark slate (#1E293B or `text-slate-800`)
- Font weight: Medium (500)
- Center text within circle

**Use shadcn/ui Avatar component** as base:
```bash
npx shadcn@latest add avatar
```

**Example Usage:**
```tsx
<UserAvatar user={user} size="md" />
```

---

### 2. UserMenu Component

**Location:** `apps/web/src/components/auth/user-menu.tsx`

**Purpose:** Dropdown menu in header showing user info and actions

**Props:**
```typescript
interface UserMenuProps {
  user: {
    name?: string | null
    email: string
    image?: string | null
  }
}
```

**Menu Structure:**
```
┌─────────────────────────────┐
│ [Avatar] John Smith         │
│          john@example.com   │
├─────────────────────────────┤
│ ⚙️  Settings                │
│ 🔐 Security & Sessions      │
├─────────────────────────────┤
│ 🚪 Sign Out                 │
└─────────────────────────────┘
```

**Menu Items:**
1. **User Info Section** (not clickable)
   - Avatar + Name + Email
   - Subtle divider below

2. **Navigation Links:**
   - "Settings" → `/settings`
   - "Security & Sessions" → `/settings/sessions`

3. **Sign Out Action:**
   - Divider above
   - "Sign Out" button
   - Calls `authClient.signOut()` from `lib/auth-client.ts`
   - Redirects to `/sign-in` on success

**Use shadcn/ui DropdownMenu** as base:
```bash
npx shadcn@latest add dropdown-menu
```

**Trigger:**
- User avatar + name + chevron down icon
- Positioned in top-right of header
- Opens on click

**Design:**
- Menu width: 240px minimum
- Padding: 8px around menu
- Items: 8px vertical padding, hover with bg-stone-100
- Dividers: border-stone-200
- Sign out in danger color (text-red-600 hover:text-red-700)

**Example Usage:**
```tsx
<UserMenu user={session.user} />
```

---

### 3. useAuth Custom Hook

**Location:** `apps/web/src/hooks/use-auth.ts`

**Purpose:** Convenient hook for accessing auth state in components

**Return Type:**
```typescript
interface UseAuthReturn {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
}

interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  emailVerified: boolean
}
```

**Implementation:**
```typescript
import { useSession, signOut as authSignOut } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  const signOut = async () => {
    await authSignOut()
    router.push('/sign-in')
  }

  return {
    user: session?.user ?? null,
    session: session ?? null,
    isLoading: isPending,
    isAuthenticated: !!session?.user,
    signOut,
  }
}
```

**Usage in Components:**
```tsx
function MyComponent() {
  const { user, isLoading, isAuthenticated, signOut } = useAuth()

  if (isLoading) return <LoadingSpinner />
  if (!isAuthenticated) return <SignInPrompt />

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

---

### 4. AuthGuard Component

**Location:** `apps/web/src/components/auth/auth-guard.tsx`

**Purpose:** Wrapper component for protected routes

**Props:**
```typescript
interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}
```

**Behavior:**
1. **Loading:** Shows fallback (or default spinner) while checking auth
2. **Not Authenticated:** Redirects to `redirectTo` (default: `/sign-in`)
3. **Authenticated:** Renders children

**Implementation Pattern:**
```typescript
'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function AuthGuard({
  children,
  fallback,
  redirectTo = '/sign-in'
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isLoading, isAuthenticated, router, redirectTo])

  if (isLoading) {
    return fallback || <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return null // Will redirect
  }

  return <>{children}</>
}
```

**Usage:**
```tsx
// In a page that requires authentication
export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}
```

**Notes:**
- Use sparingly in pages (prefer middleware for route protection at scale)
- Useful for component-level protection within public pages
- Consider adding support for required roles/permissions in future

---

### 5. Settings Layout Component

**Location:** `apps/web/src/components/layouts/settings-layout.tsx`

**Purpose:** Consistent layout for all `/settings/*` pages with sidebar navigation

**Props:**
```typescript
interface SettingsLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
}
```

**Layout Structure:**
```
┌────────────────────────────────────────────────────────┐
│ Settings                                               │
├────────────────┬───────────────────────────────────────┤
│                │                                       │
│ 👤 Profile     │  [Page Title]                        │
│                │  [Optional Description]               │
│ 🔐 Security    │                                       │
│                │  [Page Content from children]         │
│ 🔒 Sessions    │                                       │
│                │                                       │
│ 🔑 API Keys    │                                       │
│                │                                       │
│ 🤖 AI Config   │                                       │
│                │                                       │
│ 🎨 Appearance  │                                       │
│                │                                       │
└────────────────┴───────────────────────────────────────┘
```

**Sidebar Navigation Items:**
```typescript
const settingsNavItems = [
  {
    title: 'Profile',
    href: '/settings',
    icon: User,
  },
  {
    title: 'Security',
    href: '/settings/security',
    icon: Lock,
  },
  {
    title: 'Sessions',
    href: '/settings/sessions',
    icon: Shield,
  },
  {
    title: 'API Keys',
    href: '/settings/api-keys',
    icon: Key,
  },
  {
    title: 'AI Configuration',
    href: '/settings/ai-config',
    icon: Bot,
  },
  {
    title: 'Appearance',
    href: '/settings/appearance',
    icon: Palette,
  },
]
```

**Design Specs:**
- **Sidebar:** 240px width, fixed position
- **Main content:** Flexible width with max-w-4xl
- **Responsive:** Stack vertically on mobile (< 768px)
- **Active link:** HYVVE brand color (#FF6B6B) text and border-left

**Components to Use:**
- Use `Link` from `next/link` for navigation
- Use `lucide-react` for icons
- Use `cn()` utility for conditional classes

**Breadcrumb Support (Optional):**
- Show "Settings > [Section]" at top of main content
- Helps with navigation context

**Example Usage:**
```tsx
// In /settings/sessions/page.tsx
export default function SessionsPage() {
  return (
    <SettingsLayout
      title="Active Sessions"
      description="Manage your active sessions across devices"
    >
      <SessionList />
    </SettingsLayout>
  )
}
```

**Responsive Behavior:**
- **Desktop (>= 768px):** Sidebar + main content side by side
- **Mobile (< 768px):** Stacked layout, collapsible sidebar or tabs

---

## Design System Integration

### Colors
- **Primary/Brand:** `#FF6B6B` (`bg-[#FF6B6B]`)
- **Background Light:** `#FFFBF5` (Warm cream)
- **Neutrals:** Stone palette (`stone-100`, `stone-200`, `stone-800`)
- **Text:** Slate palette (`slate-600`, `slate-800`)

### Typography
- **Font:** Inter (via Tailwind)
- **Sizes:** Use Tailwind text utilities (`text-sm`, `text-base`, `text-lg`)
- **Weights:** 400 (normal), 500 (medium), 600 (semibold)

### Spacing
- **Component padding:** `p-4` (16px)
- **Section gaps:** `space-y-6` (24px)
- **Item gaps:** `space-y-2` (8px)

### Radius
- **Buttons/Inputs:** `rounded-lg` (8px)
- **Cards:** `rounded-xl` (12px)
- **Avatars:** `rounded-full` (circular)

### Accessibility
- All interactive elements must be keyboard navigable
- Proper ARIA labels on buttons and links
- Color contrast ratio >= 4.5:1 for text
- Focus visible states on all interactive elements

---

## Dependencies

### Epic Dependencies
- **Story 01-1 (Complete):** better-auth configuration and session support
- **Story 01-4 (Complete):** Sign-in creates sessions with user data
- **Story 01-7 (Complete):** Session management provides context for useAuth

### Package Dependencies
All packages already installed from previous stories:
- `better-auth` - Auth client and session hooks
- `@tanstack/react-query` - Already used in session management
- `lucide-react` - Icons (already in use)
- `tailwindcss` - Styling
- `shadcn/ui` components:
  - Avatar (`npx shadcn@latest add avatar`)
  - DropdownMenu (`npx shadcn@latest add dropdown-menu`)

---

## Implementation Tasks

- [ ] Install shadcn/ui components (Avatar, DropdownMenu) if not already installed
- [ ] Create `apps/web/src/components/auth/user-avatar.tsx` component
- [ ] Create `apps/web/src/components/auth/user-menu.tsx` component
- [ ] Create `apps/web/src/hooks/use-auth.ts` custom hook
- [ ] Create `apps/web/src/components/auth/auth-guard.tsx` component
- [ ] Create `apps/web/src/components/layouts/settings-layout.tsx` component
- [ ] Update existing pages to use new components:
  - [ ] Add UserMenu to main header layout
  - [ ] Wrap `/settings/sessions/page.tsx` with SettingsLayout
- [ ] Write unit tests for useAuth hook
- [ ] Test AuthGuard redirect behavior
- [ ] Verify responsive design on mobile/tablet/desktop
- [ ] Update `docs/sprint-artifacts/sprint-status.yaml` to mark story as ready for review

---

## Testing Requirements

### Component Testing

**UserAvatar:**
- [ ] Displays user image when available
- [ ] Shows initials when no image (from name)
- [ ] Falls back to email initials when no name
- [ ] Renders correct sizes (sm, md, lg)
- [ ] Handles null/undefined values gracefully

**UserMenu:**
- [ ] Opens dropdown on click
- [ ] Displays user name and email correctly
- [ ] Navigation links work (Settings, Sessions)
- [ ] Sign out button calls signOut() and redirects
- [ ] Closes menu after action
- [ ] Keyboard navigation works (Tab, Enter, Escape)

**useAuth Hook:**
- [ ] Returns null user when not authenticated
- [ ] Returns user data when authenticated
- [ ] isLoading is true during session fetch
- [ ] isAuthenticated matches session state
- [ ] signOut() function works and redirects

**AuthGuard:**
- [ ] Shows loading state while checking auth
- [ ] Redirects to sign-in when not authenticated
- [ ] Renders children when authenticated
- [ ] Respects custom redirectTo prop
- [ ] Renders custom fallback component

**SettingsLayout:**
- [ ] Renders sidebar with navigation items
- [ ] Highlights active navigation item
- [ ] Displays page title and description
- [ ] Responsive layout on mobile
- [ ] All navigation links work

### Integration Testing
- [ ] UserMenu integrates with real session data
- [ ] AuthGuard works with better-auth session state
- [ ] SettingsLayout works with Next.js routing
- [ ] Sign out flows through entire stack (client → API → redirect)

### Visual Testing
- [ ] Components match HYVVE design system
- [ ] Responsive layouts work on mobile/tablet/desktop
- [ ] Focus states visible and styled correctly
- [ ] Hover states provide clear feedback
- [ ] Color contrast meets accessibility standards

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All 5 components created with full TypeScript types
- [ ] Components follow HYVVE design system and brand guidelines
- [ ] UserMenu integrated into main application header
- [ ] SettingsLayout used in `/settings/sessions` page
- [ ] All components are responsive and accessible
- [ ] Unit tests written for useAuth hook
- [ ] Manual testing completed across browsers
- [ ] Code reviewed and approved
- [ ] No TypeScript errors
- [ ] Story marked as "review" in sprint status

---

## Files to Create/Modify

### Files to Create
- `apps/web/src/components/auth/user-avatar.tsx` - Avatar component
- `apps/web/src/components/auth/user-menu.tsx` - User dropdown menu
- `apps/web/src/components/auth/auth-guard.tsx` - Route protection wrapper
- `apps/web/src/hooks/use-auth.ts` - Custom auth hook
- `apps/web/src/components/layouts/settings-layout.tsx` - Settings page layout
- `apps/web/src/__tests__/hooks/use-auth.test.ts` - Hook tests (optional)

### Files to Modify
- `apps/web/src/app/layout.tsx` or header component - Add UserMenu
- `apps/web/src/app/settings/sessions/page.tsx` - Wrap with SettingsLayout
- `docs/sprint-artifacts/sprint-status.yaml` - Update story status

---

## Traceability to Tech Spec

| Component | Tech Spec Section | Reference |
|-----------|-------------------|-----------|
| UserAvatar | UI Components, Design System | Avatar system, user identity display |
| UserMenu | UI Components | User menu with sign out |
| useAuth | Services and Modules | Auth state management |
| AuthGuard | Services and Modules | Route protection middleware |
| SettingsLayout | UI Components | Settings page navigation |

---

## Related Stories

**Depends On:**
- 01-1: Install and Configure better-auth (complete) - provides auth client
- 01-4: Implement Email/Password Sign-In (complete) - creates sessions
- 01-7: Implement Session Management (complete) - provides session context

**Blocks:**
- 02-1: Create Workspace Foundation (needs AuthGuard and UserMenu)
- Future settings pages (needs SettingsLayout)

**Completes:**
- **EPIC-01: Authentication System** - This is the final story in the epic

---

## Success Metrics

- All Epic 01 components are reusable and well-documented
- UserMenu provides seamless sign-out experience
- AuthGuard enables easy route protection
- SettingsLayout provides consistent navigation for settings pages
- Components are accessible and responsive
- Zero TypeScript errors
- Estimated completion time: 4-5 hours

---

## Development Notes

### Recommended Implementation Order

1. **Start with useAuth hook** - Foundation for other components
2. **UserAvatar** - Simplest component, used by UserMenu
3. **UserMenu** - Integrates Avatar and useAuth
4. **AuthGuard** - Uses useAuth hook
5. **SettingsLayout** - Standalone layout component

### shadcn/ui Components Needed

Check if already installed, otherwise run:
```bash
cd apps/web
npx shadcn@latest add avatar
npx shadcn@latest add dropdown-menu
```

### Integration with Existing Code

**UserMenu in Header:**
The main header/layout already exists. You'll need to:
1. Import UserMenu component
2. Replace any existing user display with `<UserMenu user={session.user} />`
3. Ensure proper positioning in header (top-right)

**SettingsLayout in Sessions Page:**
The `/settings/sessions/page.tsx` already exists from Story 01-7. Wrap its content:
```tsx
export default function SessionsPage() {
  return (
    <SettingsLayout
      title="Active Sessions"
      description="Manage your active sessions across devices"
    >
      {/* Existing SessionList component */}
      <SessionList />
    </SettingsLayout>
  )
}
```

### Better Auth Session Structure

The session object from `useSession()` has this structure:
```typescript
{
  user: {
    id: string
    email: string
    name: string | null
    image: string | null
    emailVerified: boolean
  },
  session: {
    id: string
    token: string
    expiresAt: Date
    // ... other fields
  }
}
```

---

## Notes

- This story completes Epic 01 - Authentication System
- These components will be heavily reused in future epics
- Focus on reusability and clear prop interfaces
- Document component usage with JSDoc comments
- Consider creating Storybook stories for visual documentation (future enhancement)
- Settings navigation items are based on planned features; some pages don't exist yet

---

_Story created: 2025-12-02_
_Epic reference: EPIC-01 Authentication System_
_Tech spec reference: tech-spec-epic-01.md_
_Wireframe references: AU-01 through AU-05 (completed wireframes)_
