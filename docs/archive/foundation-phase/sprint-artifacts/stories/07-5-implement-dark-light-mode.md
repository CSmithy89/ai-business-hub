# Story 07-5: Implement Dark/Light Mode

**Epic:** EPIC-07 UI Shell
**Status:** done
**Priority:** P0
**Points:** 2
**Assignee:** dev

---

## User Story

As a user, I want to choose dark or light theme so that I can work comfortably in different lighting conditions.

---

## Acceptance Criteria

- [x] Use next-themes for theme management
- [x] Create theme toggle component with sun/moon icons
- [x] Apply CSS variables from Style Guide for light and dark modes
- [x] Persist user theme preference across sessions
- [x] Support system preference detection
- [x] Smooth transition on theme toggle
- [x] Add theme toggle to HeaderUserMenu dropdown
- [x] TypeScript type-check passes
- [x] ESLint passes

---

## Technical Details

### Implementation

**Dependencies:**
- next-themes: Already installed (v0.3.0)
- ThemeProvider: Already configured in providers.tsx

**Files Created/Modified:**

1. **ThemeToggle Component** (`/apps/web/src/components/theme/ThemeToggle.tsx`)
   - Three-state toggle: light, dark, system
   - Uses Material Symbols icons: `light_mode`, `dark_mode`, `computer`
   - useTheme() hook from next-themes
   - Dropdown menu for theme selection

2. **HeaderUserMenu** (`/apps/web/src/components/shell/HeaderUserMenu.tsx`)
   - Added ThemeToggle menu item
   - Positioned before Settings item
   - Uses inline theme toggle component

3. **Dark Mode CSS** (`/src/styles/tokens.css`)
   - Already has complete dark mode variable definitions
   - Uses `.dark` class selector
   - All semantic color aliases properly mapped

### Theme Variables Used

**Light Mode:**
- Background: `--color-bg-cream` (#FFFBF5)
- Card: `--color-bg-white` (#FFFFFF)
- Text: `--color-slate-800` (#1e293b)

**Dark Mode:**
- Background: `--color-bg-primary` (#0a0a0b)
- Card: `--color-bg-secondary` (#111113)
- Text: `--color-slate-50` (#f8fafc)

---

## Testing Checklist

- [x] Theme toggle appears in user menu dropdown
- [x] Clicking theme options changes the UI theme immediately
- [x] Theme preference persists after page reload
- [x] System theme is detected correctly when "System" is selected
- [x] Smooth transition between themes (no flash)
- [x] All components render correctly in both themes
- [x] TypeScript compilation passes
- [x] ESLint passes

---

## Definition of Done

- [x] Code implemented and tested
- [x] TypeScript type-check passes
- [x] ESLint passes
- [x] Theme toggle functional in UI
- [x] Theme preference persists
- [x] All acceptance criteria met
- [x] Story marked as done in sprint-status.yaml

---

## Implementation Notes

### Theme Provider Configuration

The ThemeProvider in `providers.tsx` is configured with:
- `attribute="class"` - Uses `.dark` class on `<html>` element
- `defaultTheme="light"` - Starts with light theme
- `enableSystem={true}` - Allows system preference detection
- `disableTransitionOnChange` - Prevents flash during initial load

### CSS Variable Strategy

The tokens.css file uses a cascading strategy:
1. Root variables defined with RGB values (e.g., `--color-bg-cream: 255, 251, 245`)
2. Semantic aliases point to raw values (e.g., `--color-bg-primary: var(--color-bg-cream)`)
3. Dark mode overrides semantic aliases under `.dark` selector
4. Components use semantic aliases like `rgb(var(--color-bg-primary))`

This allows theme switching without rebuilding the entire CSS variable tree.

### Icon Choice

Using Material Symbols Rounded for theme icons:
- `light_mode` - Sun icon for light theme
- `dark_mode` - Moon icon for dark theme
- `computer` - Monitor icon for system theme

These are already loaded via the Material Symbols font in the project.

---

## Related

- **Epic:** docs/epics/EPIC-07/EPIC-07-ui-shell.md
- **Wireframe:** docs/design/wireframes/Finished wireframes and html files/st-08_appearance/code.html
- **Design Tokens:** src/styles/tokens.css
- **Style Guide:** docs/design/STYLE-GUIDE.md
