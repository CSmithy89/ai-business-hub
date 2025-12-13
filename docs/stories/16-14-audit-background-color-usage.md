# Story 16-14: Audit Background Color Usage

**Epic:** EPIC-16 - Premium Polish & Advanced Features
**Priority:** P2
**Points:** 3
**Status:** In Progress

## User Story

As a user viewing the application
I want consistent background colors throughout
So that the visual experience feels cohesive

## Acceptance Criteria

- [ ] All backgrounds use design token variables
- [ ] No hardcoded hex/rgb colors for backgrounds
- [ ] Cream/warm backgrounds used consistently
- [ ] Dark mode backgrounds are cohesive
- [ ] Surface vs background distinction is clear

## Technical Notes

- Background tokens defined in tokens.css
- Primary backgrounds: cream, white, soft, muted
- Surface colors for elevated elements
- Audit all bg-* classes and inline styles

### Background Token Reference

```
Light Mode:
- bg-cream:     Warm off-white (main background)
- bg-white:     Pure white (cards/surfaces)
- bg-soft:      Light cream (secondary areas)
- bg-muted:     Slightly darker (hover states)
- bg-primary:   Main page background
- bg-secondary: Secondary sections
- bg-tertiary:  Tertiary areas

Dark Mode:
- bg-primary:   Dark slate
- bg-secondary: Slightly lighter slate
- bg-tertiary:  Surface slate
```

## Files to Audit

- `apps/web/src/app/**/*.tsx` - All page components
- `apps/web/src/components/**/*.tsx` - All components
- `apps/web/src/app/globals.css` - Any inline bg colors

## Implementation Steps

1. Search for hardcoded background colors
2. Identify inconsistencies in token usage
3. Replace hardcoded values with tokens
4. Verify dark mode backgrounds
5. Test visual consistency

## Testing Checklist

- [ ] All pages have consistent backgrounds
- [ ] Cards/surfaces use proper elevation
- [ ] Dark mode looks cohesive
- [ ] No visual artifacts or jarring transitions
- [ ] TypeScript check passes
- [ ] ESLint passes

## Notes

- Focus on consistency, not redesign
- Keep warm, friendly brand feel
- Ensure sufficient contrast

---

## Implementation Summary

**Date:** 2025-12-12
**Status:** Done

### Audit Results

Most components were already using the design token system via `bg-[rgb(var(--color-*))]` syntax. The main issues found were:

1. **Auth components** - Used hardcoded `#FF6B6B` instead of `bg-primary`
2. **Public pages** - Used hardcoded coral colors
3. **Coming soon pages** - Used hardcoded colors
4. **Appearance settings** - Used `#FAF9F7` instead of token

### Files Fixed

**Auth Components:**
- `auth-layout.tsx` - Gradient, logo backgrounds
- `sign-in-form.tsx` - Submit button
- `sign-up-form.tsx` - Submit button
- `magic-link-form.tsx` - Icons, links, button
- `verification-success.tsx` - Button
- `verification-pending.tsx` - Icon badge
- `verification-error.tsx` - Button
- `two-factor-verify.tsx` - Button

**Layout Components:**
- `app-header.tsx` - CTA button
- `settings-layout.tsx` - Active nav state
- `appearance-settings.tsx` - Theme preview background

**Public Pages:**
- `(public)/layout.tsx` - Logo, CTA link
- `(public)/help/page.tsx` - Contact button, help cards

**Dashboard Pages:**
- `crm/page.tsx` - Coming soon page
- `projects/page.tsx` - Coming soon page
- `magic-link/verify/page.tsx` - Button

### Pattern Replaced

```
Before: bg-[#FF6B6B], hover:bg-[#FF6B6B]/90
After:  bg-primary, hover:bg-primary/90

Before: bg-[#FAF9F7]
After:  bg-background-cream
```

### Verification

- [x] TypeScript check passes
- [x] No hardcoded `#FF6B6B` remaining
- [x] All backgrounds use design tokens

---

## Senior Developer Review

**Reviewer:** Code Review
**Outcome:** APPROVED

Comprehensive audit replaced 20+ hardcoded color instances with design tokens. All backgrounds now use the token system for consistency.
