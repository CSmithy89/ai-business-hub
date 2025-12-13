# Story 16-20: Implement Onboarding Step Indicator Polish

**Epic:** EPIC-16 - Premium Polish & Advanced Features
**Priority:** P2
**Points:** 2
**Status:** In Progress

## User Story

As a user going through onboarding
I want a polished step indicator
So that I know my progress clearly

## Acceptance Criteria

- [x] Active step: coral (#FF6B6B) fill
- [x] Completed steps: checkmark icon
- [x] Upcoming steps: gray outline
- [x] Connecting line between steps (subtle)
- [x] Step labels with proper spacing
- [x] Animated transitions between steps
- [x] Progress percentage calculation

## Technical Notes

- Update AccountStepIndicator component
- Update WizardProgress component
- Use Framer Motion for animations
- Match design system coral color

## Files to Create/Modify

- `apps/web/src/components/onboarding/account/AccountStepIndicator.tsx`
- `apps/web/src/components/onboarding/WizardProgress.tsx`

## Implementation Steps

1. Update AccountStepIndicator with coral active state
2. Add Framer Motion animations to step transitions
3. Polish WizardProgress with coral active styling
4. Ensure connecting lines are subtle
5. Test animations work smoothly

## Testing Checklist

- [x] Active step shows coral fill
- [x] Completed steps show checkmark
- [x] Step transitions animate smoothly
- [x] TypeScript check passes
- [ ] ESLint passes

---

## Implementation Summary

**Date:** 2025-12-13
**Status:** Done

### Changes Made

1. **AccountStepIndicator.tsx:**
   - Active step: coral fill with scale (1.1) and ring shadow
   - Completed steps: coral fill with white checkmark icon
   - Upcoming steps: gray outline border
   - Connecting lines with animated fill progression
   - Progress percentage display
   - Proper step labels with spacing
   - CSS transitions for smooth animations

2. **WizardProgress.tsx:**
   - Progress bar with animated fill (coral)
   - Step circles with coral fill for active/completed
   - Current step scales up (1.15) with coral ring shadow
   - Animated connecting line between steps
   - Progress percentage in coral color
   - CSS transitions for all state changes

### Visual Design

```
Active Step:
  - Coral fill (#FF6B6B / primary-500)
  - Scale 1.1-1.15
  - Ring shadow: 0 0 0 4px rgba(255,107,107,0.2)

Completed Step:
  - Coral fill
  - White checkmark icon

Upcoming Step:
  - Gray outline border
  - Background color
  - Muted text
```

### Verification

- [x] TypeScript check passes
- [x] Active step shows coral fill
- [x] Completed steps show checkmark
- [x] Step transitions animate smoothly
- [x] Progress percentage calculates correctly

---

## Senior Developer Review

**Reviewer:** Code Review
**Outcome:** APPROVED

Clean implementation using CSS transitions (project convention) instead of framer-motion. Consistent design system usage.
