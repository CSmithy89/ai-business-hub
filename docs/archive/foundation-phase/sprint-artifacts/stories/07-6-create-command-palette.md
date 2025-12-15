# Story 07-6: Create Command Palette

**Epic:** EPIC-07 - UI Shell
**Points:** 3
**Priority:** P1
**Status:** done

## User Story
As a power user, I want a command palette (Cmd+K) so that I can navigate quickly

## Description
Implement a command palette component using cmdk library that provides quick navigation and actions accessible via Cmd+K (Mac) or Ctrl+K (Windows/Linux). The palette should be searchable, keyboard-navigable, and categorized for easy access to common tasks.

## Acceptance Criteria

### Command Palette Component
- [x] Create `CommandPalette` component using cmdk library
- [x] Opens with Cmd/Ctrl+K keyboard shortcut
- [x] Modal dialog overlay with backdrop blur
- [x] Search input at the top with icon
- [x] Categorized results display

### Search Functionality
- [x] Navigate to pages (Dashboard, Approvals, AI Team, Settings, Profile)
- [x] Quick actions (New Contact, New Task, Toggle Theme, Toggle Sidebar, Toggle Chat)
- [x] Search content (filter results based on input)

### Keyboard Navigation
- [x] Up/down arrow keys to navigate results
- [x] Enter key to select item
- [x] Escape key to close palette
- [x] Close on selection

### Recent Items
- [x] Display recent items category
- [x] Show recently accessed pages/actions

### Categorized Results
- [x] Recent items category
- [x] Navigation category
- [x] Quick Actions category

### Integration
- [x] Add CommandPalette to dashboard layout
- [x] Use useUIStore for open state management
- [x] Keyboard shortcut handler in layout

## Technical Details

### Files Created
1. `/apps/web/src/components/command/CommandPalette.tsx` - Main component
2. `/apps/web/src/components/command/index.ts` - Export file

### Files Modified
1. `/apps/web/src/app/(dashboard)/layout.tsx` - Add CommandPalette component
2. `/apps/web/package.json` - Add cmdk dependency

### Dependencies Added
- `cmdk@^1.1.1` - Command palette library

### Navigation Items
- Dashboard → `/dashboard`
- Approvals → `/dashboard/approvals`
- AI Team → `/dashboard/agents`
- Settings → `/dashboard/settings`
- Profile → `/dashboard/profile`

### Quick Actions
- New Contact (placeholder action)
- New Task (placeholder action)
- Toggle Theme (useTheme hook)
- Toggle Sidebar (useUIStore)
- Toggle Chat (useUIStore)

## Implementation Notes

### Design System
- Uses existing HYVVE color tokens and spacing
- Matches wireframe SH-05 Command Palette design
- Uses Lucide React icons for consistency
- Supports both light and dark modes

### State Management
- Uses existing `useUIStore` command palette state
- Local state for search query and selected index
- Recent items tracked in component state (can be enhanced later with persistence)

### Keyboard Shortcuts
- Cmd+K (Mac) / Ctrl+K (Windows/Linux) to open
- Arrow Up/Down for navigation
- Enter to select
- Escape to close

### Accessibility
- Proper ARIA labels and roles via cmdk
- Keyboard navigation support
- Focus management
- Screen reader friendly

## Testing Checklist
- [x] Command palette opens with Cmd/Ctrl+K
- [x] Search filters results correctly
- [x] Navigation items work and route correctly
- [x] Quick actions execute properly
- [x] Keyboard navigation (up/down/enter/escape) works
- [x] Palette closes on selection
- [x] Palette closes on Escape
- [x] Works in both light and dark modes
- [x] Recent items display correctly
- [x] TypeScript compilation passes
- [x] ESLint passes

## Definition of Done
- [x] Component implemented and styled per wireframe
- [x] All acceptance criteria met
- [x] Integrated into dashboard layout
- [x] Keyboard shortcuts work
- [x] TypeScript check passes
- [x] ESLint passes
- [x] Code committed to epic branch

## Related Documents
- Wireframe: `/docs/design/wireframes/Finished wireframes and html files/sh-05_command_palette_(cmd+k)/code.html`
- Tech Spec: `/docs/archive/foundation-phase/sprint-artifacts/tech-spec-epic-07.md`
- Architecture: `/docs/architecture.md`

---

**Created:** 2025-12-04
**Developer:** Claude Code
**Epic Branch:** epic/07-ui-shell
