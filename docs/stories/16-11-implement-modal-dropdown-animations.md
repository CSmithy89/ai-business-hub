# Story 16-11: Implement Modal & Dropdown Animations

**Epic:** EPIC-16 - Premium Polish & Advanced Features
**Priority:** P2
**Points:** 2
**Status:** In Progress

## User Story

As a user opening modals and dropdowns
I want smooth open/close animations
So that transitions don't feel jarring

## Acceptance Criteria

- [ ] Modal scale-in animation:
  - Enter: `scale(0.95) → scale(1)` + `opacity: 0 → 1`
  - Exit: reverse
  - Duration: 150ms
- [ ] Dropdown slide animation:
  - Enter: `translateY(-4px) → 0` + fade
  - Exit: reverse
  - Duration: 100ms
- [ ] Backdrop fade animation
- [ ] Focus trap maintains during animation

## Technical Notes

- shadcn Dialog and Dropdown have animation support via Radix
- Uses Tailwind's `animate-in/animate-out` classes
- May need to customize Radix primitives for duration

## Current Implementation Analysis

### Dialog Component
Already has:
- `animate-in` / `animate-out` classes
- `fade-in-0` / `fade-out-0` for opacity
- `zoom-in-95` / `zoom-out-95` for scale
- `slide-in-from-top-[48%]` / `slide-out-to-top-[48%]` for position
- `duration-200` for content transition

### DropdownMenu Component
Already has:
- `animate-in` / `animate-out` classes
- `fade-in-0` / `fade-out-0` for opacity
- `zoom-in-95` / `zoom-out-95` for scale
- Direction-aware slide: `slide-in-from-top-2`, etc.
- Uses Radix's transform origin

### What's Needed
1. Verify animation durations match spec
2. Add explicit reduced-motion CSS
3. Document the animation setup

## Files to Modify

- `apps/web/src/app/globals.css` - Add modal/dropdown animation CSS variables
- Document existing animation setup

## Implementation Steps

1. Review existing Dialog/DropdownMenu animations
2. Add CSS variables for animation duration customization
3. Add explicit prefers-reduced-motion rules for modals/dropdowns
4. Verify Sheet component has consistent animations
5. Document animation system

## Testing Checklist

- [ ] Modal opens with scale-in animation
- [ ] Modal closes with scale-out animation
- [ ] Dropdown opens with slide + fade
- [ ] Dropdown closes smoothly
- [ ] Animations disabled with prefers-reduced-motion
- [ ] Focus trap works during animation
- [ ] No layout shift during animation
- [ ] TypeScript check passes
- [ ] ESLint passes

## Notes

- Existing shadcn components already have solid animations
- Focus on verification and reduced-motion support
- Document for future reference

---

## Implementation Summary

**Date:** 2025-12-12
**Status:** Done

### Analysis

The shadcn Dialog and DropdownMenu components already have excellent animations:
- Uses Radix UI primitives with `animate-in/animate-out`
- Has zoom-in/zoom-out for scale transitions
- Has fade-in/fade-out for opacity
- Has direction-aware slide animations

### Changes Made

1. **globals.css** - Added modal/dropdown animation enhancements:
   - CSS custom properties for animation duration control
   - `--modal-animation-duration: 150ms`
   - `--dropdown-animation-duration: 100ms`
   - `--backdrop-animation-duration: 200ms`
   - Applied to Radix data attributes for consistent timing
   - Explicit prefers-reduced-motion support for all Radix components

### Components Covered

- `DialogContent` / `DialogOverlay`
- `DropdownMenuContent` / `DropdownMenuSubContent`
- `AlertDialog` components
- `Select` / `Popover` / `ContextMenu` / `Menubar` content

### Focus Trap

Radix UI handles focus trapping automatically during animation - no changes needed.

### Verification

- [x] TypeScript check passes
- [x] Modal/dropdown animations use spec durations
- [x] Reduced motion disables all Radix animations
- [x] CSS variables allow easy customization

---

## Senior Developer Review

**Reviewer:** Code Review
**Outcome:** APPROVED

Existing shadcn/Radix animations are already well-implemented. Added CSS custom properties for duration control and explicit reduced-motion support for accessibility compliance.
